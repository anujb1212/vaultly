import express from "express";
import db, { auditLogger, emitSecurityEvent, bucketizeAmount } from "@repo/db/client";
import { config } from "../config";
import { webhookBodySchema } from "./schema";
import { computeSignatureHex, safeEq } from "./signature";
import { handleOnrampWebhookTx } from "./handlers/onramp";
import { handleOfframpWebhookTx } from "./handlers/offramp";

export const webhookRouter = express.Router();

type ReqWithRaw = express.Request & { rawBody?: Buffer };

webhookRouter.post("/bankWebhook", async (req: ReqWithRaw, res) => {
    try {
        const raw = req.rawBody;
        if (!raw || !Buffer.isBuffer(raw)) {
            return res.status(400).json({ message: "Missing raw body" });
        }

        const signature = String(req.header("X-Webhook-Signature") ?? "");
        const webhookEventId = String(req.header("X-Webhook-Id") ?? "");
        const computed = computeSignatureHex(raw, config.webhookSecret);

        if (!signature || !safeEq(signature, computed)) {
            return res.status(401).json({ message: "Invalid signature" });
        }

        const parsed = webhookBodySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid request body", issues: parsed.error.issues });
        }

        const body = parsed.data;
        const now = new Date();
        const amountBucket = bucketizeAmount(body.amount);

        const outcome = await db.$transaction(
            async (tx) => {
                if (body.type === "OFFRAMP") {
                    return handleOfframpWebhookTx({
                        tx,
                        body,
                        now,
                        webhookEventId: webhookEventId || undefined,
                        webhookPayload: req.body,
                    });
                }

                return handleOnrampWebhookTx({
                    tx,
                    body,
                    now,
                    webhookEventId: webhookEventId || undefined,
                    webhookPayload: req.body,
                });
            },
            {
                maxWait: 10_000,
                timeout: 30_000,
            }
        );

        if (outcome.kind === "not_found") return res.status(404).json({ message: "Transaction not found" });
        if (outcome.kind === "user_mismatch") return res.status(400).json({ message: "User mismatch" });
        if (outcome.kind === "amount_mismatch") return res.status(400).json({ message: "Amount mismatch" });
        if (outcome.kind === "account_mismatch") return res.status(400).json({ message: "linkedBankAccountId mismatch" });

        if (outcome.kind === "already_processed") return res.status(200).json({ message: "Captured" });

        queueMicrotask(async () => {
            try {
                if (outcome.kind === "processed_onramp_success") {
                    await auditLogger.createAuditLog({
                        userId: outcome.userId,
                        action: "ONRAMP_COMPLETED",
                        entityType: "OnRampTransaction",
                        entityId: outcome.onRampTxnId,
                        newValue: {
                            status: "Success",
                            token: outcome.token,
                            amount: outcome.amount,
                            ledgerTransactionId: outcome.ledgerTransactionId,
                            webhookEventId: outcome.webhookEventId,
                        },
                        metadata: { webhookEventId: outcome.webhookEventId },
                    });

                    await emitSecurityEvent(db as any, {
                        userId: outcome.userId,
                        type: "ONRAMP_COMPLETED",
                        source: "bank-webhook",
                        sourceId: `onramp:${outcome.token}`,
                        metadata: { amountBucket, webhookEventId: outcome.webhookEventId },
                    });
                }

                if (outcome.kind === "processed_onramp_failure") {
                    await auditLogger.createAuditLog({
                        userId: outcome.userId,
                        action: "ONRAMP_FAILED",
                        entityType: "OnRampTransaction",
                        entityId: outcome.onRampTxnId,
                        newValue: {
                            status: "Failure",
                            token: outcome.token,
                            amount: outcome.amount,
                            failureReasonCode: outcome.failureReasonCode,
                            failureReasonMessage: outcome.failureReasonMessage,
                            webhookEventId: outcome.webhookEventId,
                        },
                        metadata: { webhookEventId: outcome.webhookEventId },
                    });

                    await emitSecurityEvent(db as any, {
                        userId: outcome.userId,
                        type: "ONRAMP_FAILED",
                        source: "bank-webhook",
                        sourceId: `onramp:${outcome.token}`,
                        metadata: {
                            amountBucket,
                            failureReasonCode: outcome.failureReasonCode,
                            webhookEventId: outcome.webhookEventId,
                        },
                    });
                }

                if (outcome.kind === "processed_offramp_success") {
                    await auditLogger.createAuditLog({
                        userId: outcome.userId,
                        action: "OFFRAMP_COMPLETED",
                        entityType: "OffRampTransaction",
                        entityId: outcome.offRampTxnId,
                        newValue: {
                            status: "Success",
                            token: outcome.token,
                            amount: outcome.amount,
                            ledgerTransactionId: outcome.ledgerTransactionId,
                            webhookEventId: outcome.webhookEventId,
                        },
                        metadata: { webhookEventId: outcome.webhookEventId },
                    });

                    await emitSecurityEvent(db as any, {
                        userId: outcome.userId,
                        type: "OFFRAMP_COMPLETED",
                        source: "bank-webhook",
                        sourceId: `offramp:${outcome.token}`,
                        metadata: { amountBucket, webhookEventId: outcome.webhookEventId },
                    });
                }

                if (outcome.kind === "processed_offramp_failure") {
                    await auditLogger.createAuditLog({
                        userId: outcome.userId,
                        action: "OFFRAMP_FAILED",
                        entityType: "OffRampTransaction",
                        entityId: outcome.offRampTxnId,
                        newValue: {
                            status: "Failure",
                            token: outcome.token,
                            amount: outcome.amount,
                            failureReasonCode: outcome.failureReasonCode,
                            failureReasonMessage: outcome.failureReasonMessage,
                            webhookEventId: outcome.webhookEventId,
                        },
                        metadata: { webhookEventId: outcome.webhookEventId },
                    });

                    await emitSecurityEvent(db as any, {
                        userId: outcome.userId,
                        type: "OFFRAMP_FAILED",
                        source: "bank-webhook",
                        sourceId: `offramp:${outcome.token}`,
                        metadata: {
                            amountBucket,
                            failureReasonCode: outcome.failureReasonCode,
                            webhookEventId: outcome.webhookEventId,
                        },
                    });
                }
            } catch (e) {
                console.error("[Webhook][side-effects] failed:", e);
            }
        });

        return res.status(200).json({ message: "Captured" });
    } catch (e: any) {
        console.error("[Webhook] failed:", e);
        return res.status(500).json({ message: "Error while processing webhook" });
    }
});
