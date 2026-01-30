import { OnRampStatus, Prisma } from "@prisma/client";
import db, {
    auditLogger,
    postOnrampLedger,
    emitSecurityEvent,
    bucketizeAmount,
} from "@repo/db/client";
import express from "express";
import zod from "zod";
import crypto from "crypto";

const app = express();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "dev_secret";

const TX_MAX_WAIT_MS = Number(process.env.PRISMA_TX_MAX_WAIT_MS ?? 20_000);
const TX_TIMEOUT_MS = Number(process.env.PRISMA_TX_TIMEOUT_MS ?? 30_000);

app.use(
    express.json({
        verify: (req: any, _res, buf) => {
            req.rawBody = buf;
        },
    })
);

function asJsonObject(
    value: Prisma.JsonValue | null | undefined
): Prisma.JsonObject {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value as Prisma.JsonObject;
    }
    return {};
}

function timingSafeEqual(a: string, b: string) {
    const aBuf = Buffer.from(a, "utf8");
    const bBuf = Buffer.from(b, "utf8");
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
}

function computeSignature(rawBody: Buffer, secret: string) {
    return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

const webhookBodySchema = zod.object({
    token: zod.string().min(1),
    user_identifier: zod.string().min(1),
    amount: zod.coerce.number().int().positive(),
    status: zod.enum(OnRampStatus),
    failureReasonCode: zod.string().optional(),
    failureReasonMessage: zod.string().optional(),
});

app.post("/bankWebhook", async (req: any, res) => {
    const webhookEventId = String(req.header("X-Webhook-Id") ?? "");

    const signatureHeader = req.header("X-Webhook-Signature");
    const rawBody: Buffer | undefined = req.rawBody;

    if (!rawBody) {
        return res.status(400).json({ message: "Missing raw body" });
    }

    const computed = computeSignature(rawBody, WEBHOOK_SECRET);
    if (!signatureHeader || !timingSafeEqual(computed, signatureHeader)) {
        return res.status(401).json({ message: "Invalid signature" });
    }

    const parsed = webhookBodySchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ message: "Invalid request", issues: parsed.error.issues });
    }

    const body = parsed.data;
    const userIdFromBody = Number(body.user_identifier);

    if (!Number.isFinite(userIdFromBody) || userIdFromBody <= 0) {
        return res.status(400).json({ message: "Invalid user_identifier" });
    }

    const amountBucket = bucketizeAmount(body.amount);

    try {
        const now = new Date();

        const outcome = await db.$transaction(
            async (tx: Prisma.TransactionClient) => {
                const txn = await tx.onRampTransaction.findUnique({
                    where: { token: body.token },
                });

                if (!txn) return { kind: "not_found" as const };

                if (txn.userId !== userIdFromBody) {
                    return { kind: "user_mismatch" as const };
                }

                if (txn.amount !== body.amount) {
                    return { kind: "amount_mismatch" as const };
                }

                if (txn.status === "Success") {
                    return { kind: "already_processed" as const };
                }

                const canOverrideFailureWithSuccess =
                    txn.status === "Failure" &&
                    txn.failureReasonCode === "BANK_TIMEOUT" &&
                    body.status === "Success";

                if (txn.status === "Failure" && body.status === "Failure") {
                    return { kind: "already_processed" as const };
                }

                if (
                    txn.status === "Failure" &&
                    body.status === "Success" &&
                    !canOverrideFailureWithSuccess
                ) {
                    return { kind: "already_processed" as const };
                }

                const prevMeta = asJsonObject(txn.metadata);

                if (body.status === "Failure") {
                    const claimed = await tx.onRampTransaction.updateMany({
                        where: {
                            token: body.token,
                            userId: txn.userId,
                            status: "Processing",
                        },
                        data: {
                            status: "Failure",
                            completedAt: now,
                            failureReasonCode: body.failureReasonCode ?? "UNKNOWN",
                            failureReasonMessage: body.failureReasonMessage,
                            metadata: {
                                ...prevMeta,
                                webhookReceivedAt: now.toISOString(),
                                webhookPayload: req.body,
                            },
                        },
                    });

                    if (claimed.count === 0)
                        return { kind: "already_processed" as const };

                    return {
                        kind: "processed_failure" as const,
                        userId: txn.userId,
                        onRampTxnId: txn.id,
                        provider: txn.provider,
                        prevStatus: txn.status,
                        token: body.token,
                        amount: body.amount,
                        nowIso: now.toISOString(),
                        failureReasonCode: body.failureReasonCode ?? "UNKNOWN",
                        failureReasonMessage: body.failureReasonMessage,
                        webhookEventId: webhookEventId || undefined,
                    };
                }

                const claimed = await tx.onRampTransaction.updateMany({
                    where: {
                        token: body.token,
                        userId: txn.userId,
                        status: canOverrideFailureWithSuccess
                            ? { in: ["Processing", "Failure"] }
                            : "Processing",
                    },
                    data: {
                        status: "Success",
                        completedAt: now,
                        failureReasonCode: null,
                        failureReasonMessage: null,
                        metadata: {
                            ...prevMeta,
                            webhookReceivedAt: now.toISOString(),
                            webhookPayload: req.body,
                        },
                    },
                });

                if (claimed.count === 0) return { kind: "already_processed" as const };

                await tx.balance.upsert({
                    where: { userId: txn.userId },
                    update: {},
                    create: { userId: txn.userId, amount: 0, locked: 0 },
                });

                const ledgerTxn = await postOnrampLedger({
                    tx,
                    token: body.token,
                    userId: txn.userId,
                    amount: body.amount,
                    provider: txn.provider,
                    webhookEventId: webhookEventId || undefined,
                });

                const updatedBalance = await tx.balance.update({
                    where: { userId: txn.userId },
                    data: { amount: { increment: body.amount } },
                });

                const prevBalanceAmount = updatedBalance.amount - body.amount;

                return {
                    kind: "processed_success" as const,
                    userId: txn.userId,
                    onRampTxnId: txn.id,
                    provider: txn.provider,
                    prevStatus: txn.status,
                    token: body.token,
                    amount: body.amount,
                    nowIso: now.toISOString(),
                    ledgerTransactionId: ledgerTxn.id,
                    prevBalanceAmount,
                    newBalanceAmount: updatedBalance.amount,
                    webhookEventId: webhookEventId || undefined,
                };
            },
            {
                maxWait: Number.isFinite(TX_MAX_WAIT_MS) ? TX_MAX_WAIT_MS : 20_000,
                timeout: Number.isFinite(TX_TIMEOUT_MS) ? TX_TIMEOUT_MS : 30_000,
            }
        );

        if (outcome.kind === "not_found") {
            return res.status(400).json({ message: "Transaction not found" });
        }
        if (outcome.kind === "user_mismatch") {
            return res.status(400).json({ message: "user_identifier mismatch" });
        }
        if (outcome.kind === "amount_mismatch") {
            return res.status(400).json({ message: "amount mismatch" });
        }

        if (outcome.kind === "processed_failure") {
            res.status(200).json({ message: "Captured" });

            void (async () => {
                try {
                    await auditLogger.createAuditLog({
                        userId: outcome.userId,
                        action: "ONRAMP_FAILED",
                        entityType: "OnRampTransaction",
                        entityId: outcome.onRampTxnId,
                        oldValue: { status: outcome.prevStatus },
                        newValue: {
                            status: "Failure",
                            amount: outcome.amount,
                            completedAt: outcome.nowIso,
                            failureReasonCode: outcome.failureReasonCode,
                            failureReasonMessage: outcome.failureReasonMessage,
                        },
                        metadata: { token: outcome.token, provider: outcome.provider },
                    });
                } catch (e) {
                    console.error("[Webhook] Audit log failed (non-fatal):", e);
                }

                try {
                    await emitSecurityEvent(db as any, {
                        userId: outcome.userId,
                        type: "ONRAMP_FAILED",
                        source: "bank-webhook",
                        sourceId: `onramp:fail:${outcome.token}`,
                        metadata: {
                            provider: outcome.provider,
                            amountBucket,
                            failureReasonCode: outcome.failureReasonCode,
                            webhookEventId: outcome.webhookEventId,
                        },
                    });
                } catch (e) {
                    console.error("[Webhook] Security event emit failed (non-fatal):", e);
                }
            })();

            return;
        }

        if (outcome.kind === "processed_success") {
            res.status(200).json({ message: "Captured" });

            void (async () => {
                try {
                    await auditLogger.logBalanceChange(
                        outcome.userId,
                        outcome.prevBalanceAmount,
                        outcome.newBalanceAmount,
                        "ONRAMP_CREDIT",
                        {
                            token: outcome.token,
                            provider: outcome.provider,
                            onRampTxnId: outcome.onRampTxnId,
                            ledgerTransactionId: outcome.ledgerTransactionId,
                        }
                    );
                } catch (e) {
                    console.error("[Webhook] Balance audit failed (non-fatal):", e);
                }

                try {
                    await auditLogger.createAuditLog({
                        userId: outcome.userId,
                        action: "ONRAMP_COMPLETED",
                        entityType: "OnRampTransaction",
                        entityId: outcome.onRampTxnId,
                        oldValue: { status: outcome.prevStatus },
                        newValue: {
                            status: "Success",
                            amount: outcome.amount,
                            completedAt: outcome.nowIso,
                        },
                        metadata: { token: outcome.token, provider: outcome.provider },
                    });
                } catch (e) {
                    console.error("[Webhook] Audit log failed (non-fatal):", e);
                }

                try {
                    await emitSecurityEvent(db as any, {
                        userId: outcome.userId,
                        type: "ONRAMP_COMPLETED",
                        source: "bank-webhook",
                        sourceId: `onramp:success:${outcome.token}`,
                        metadata: {
                            provider: outcome.provider,
                            amountBucket,
                            webhookEventId: outcome.webhookEventId,
                        },
                    });
                } catch (e) {
                    console.error("[Webhook] Security event emit failed (non-fatal):", e);
                }
            })();

            return;
        }

        // already_processed + others
        return res.status(200).json({ message: "Captured" });
    } catch (e: any) {
        console.error("[Webhook] Processing failed:", e);
        return res.status(500).json({ message: "Error while processing webhook" });
    }
});

app.listen(3003, () => {
    console.log("[Webhook Server] Running on port 3003");
});
