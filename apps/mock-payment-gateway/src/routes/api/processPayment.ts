import { Router } from "express";
import { z } from "zod";
import { queueWebhook } from "../../webhook/queueWebhook";

export const processPaymentRouter = Router();

const PaymentRequestSchema = z.object({
    token: z.string().min(1),
    user_identifier: z.string().min(1),
    amount: z.coerce.number().int().positive(),
    scenario: z
        .enum(["success", "failure", "chaos-slow", "chaos-duplicate", "chaos-race"])
        .optional()
        .default("success"),
});

type PaymentRequest = z.infer<typeof PaymentRequestSchema>;
type Scenario =
    | "success"
    | "failure"
    | "chaos-slow"
    | "chaos-duplicate"
    | "chaos-race";

const FailureReasonCodeSchema = z.enum([
    "USER_DECLINED",
    "INSUFFICIENT_FUNDS",
    "BANK_TIMEOUT",
    "PROVIDER_ERROR",
    "UNKNOWN",
]);
type FailureReasonCode = z.infer<typeof FailureReasonCodeSchema>;

function randomDelayMs(max = 200) {
    return Math.floor(Math.random() * max);
}

processPaymentRouter.post("/process-payment", async (req, res) => {
    const paymentRequest = PaymentRequestSchema.safeParse(req.body);

    if (!paymentRequest.success) {
        return res.status(400).json({
            message: "INVALID_REQUEST",
            issue: paymentRequest.error.issues,
        });
    }

    const payload: PaymentRequest = paymentRequest.data;
    const scenario: Scenario = payload.scenario;

    const baseWebhookPayload = {
        type: "ONRAMP" as const,
        token: payload.token,
        user_identifier: payload.user_identifier,
        amount: payload.amount,
    };

    try {
        if (scenario === "success") {
            const webhookPayload = { ...baseWebhookPayload, status: "Success" as const };

            const { enqueued } = await queueWebhook(webhookPayload, {
                delayMs: 0,
                jobId: `onramp-${payload.token}`,
            });

            return res.status(202).json({
                queued: true,
                token: payload.token,
                status: "PENDING_WEBHOOK",
                deduplicated: !enqueued
            });
        }

        if (scenario === "failure") {
            const failureReasonCode: FailureReasonCode = "USER_DECLINED";

            const webhookPayload = {
                ...baseWebhookPayload,
                status: "Failure" as const,
                failureReasonCode,
                failureReasonMessage: "Declined in mock bank UI",
            };

            const { enqueued } = await queueWebhook(webhookPayload, {
                delayMs: 0,
                jobId: `onramp-${payload.token}`,
            });

            return res.status(202).json({
                queued: true,
                token: payload.token,
                status: "PENDING_WEBHOOK",
                failureReasonCode,
                deduplicated: !enqueued
            });
        }

        if (scenario === "chaos-slow") {
            const webhookPayload = { ...baseWebhookPayload, status: "Success" as const };

            await queueWebhook(webhookPayload, {
                delayMs: 10000,
                jobId: `onramp-${payload.token}`,
            });

            return res.status(202).json({
                queued: true,
                token: payload.token,
                status: "DELAYED_ENQUEUE",
            });
        }

        if (scenario === "chaos-duplicate") {
            const webhookPayload = { ...baseWebhookPayload, status: "Success" as const };

            const results = await Promise.allSettled([
                queueWebhook(webhookPayload, {
                    delayMs: randomDelayMs(200),
                    jobId: `onramp-${payload.token}-dup-1`,
                }),
                queueWebhook(webhookPayload, {
                    delayMs: randomDelayMs(200),
                    jobId: `onramp-${payload.token}-dup-2`,
                }),
                queueWebhook(webhookPayload, {
                    delayMs: randomDelayMs(200),
                    jobId: `onramp-${payload.token}-dup-3`,
                }),
            ]);

            const failed = results.filter((r) => r.status === "rejected");
            if (failed.length > 0) {
                console.error(JSON.stringify({
                    level: "error",
                    event: "chaos_duplicate_partial_failure",
                    token: payload.token,
                    failedCount: failed.length,
                }));
            }

            return res.status(202).json({
                queued: true,
                token: payload.token,
                status: "DUPLICATE_ENQUEUED",
                enqueuedCount: results.filter((r) => r.status === "fulfilled").length
            });
        }

        if (scenario === "chaos-race") {
            const webhookPayload1 = { ...baseWebhookPayload, status: "Success" as const };
            const webhookPayload2 = {
                ...baseWebhookPayload,
                status: "Failure" as const,
                failureReasonCode: "BANK_TIMEOUT" satisfies FailureReasonCode,
                failureReasonMessage: "Race scenario induced timeout",
            };

            await Promise.all([
                queueWebhook(webhookPayload1, {
                    delayMs: randomDelayMs(200),
                    jobId: `onramp-${payload.token}-race-1`,
                }),
                queueWebhook(webhookPayload2, {
                    delayMs: randomDelayMs(200),
                    jobId: `onramp-${payload.token}-race-2`,
                }),
            ]);

            return res.status(202).json({
                queued: true,
                token: payload.token,
                status: "RACE_ENQUEUED",
            });
        }

        return res.status(400).json({ message: "UNSUPPORTED_SCENARIO" });
    } catch (err: unknown) {
        return res.status(503).json({
            error: "QUEUE_UNAVAILABLE",
            message: (err instanceof Error ? err.message : null) ?? "Failed to enqueue webhook",
        });
    }
});
