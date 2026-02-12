import { Router } from "express";
import { z } from "zod";
import { queueWebhook } from "../../webhook/queueWebhook";

export const processWithdrawRouter = Router();

const WEBHOOK_URL = process.env.WEBHOOK_URL ?? "http://localhost:3003/bankWebhook";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "dev_secret";

const WithdrawRequestSchema = z.object({
    token: z.string().min(1),
    user_identifier: z.string().min(1),
    amount: z.coerce.number().int().positive(),
    linkedBankAccountId: z.coerce.number().int().positive(),
    scenario: z.enum(["success", "failure", "chaos-slow", "chaos-duplicate", "chaos-race"]).optional().default("success"),
});

type Scenario = z.infer<typeof WithdrawRequestSchema>["scenario"];

function randomDelayMs(max = 200) {
    return Math.floor(Math.random() * max);
}

processWithdrawRouter.post("/process-withdraw", async (req, res) => {
    const parsed = WithdrawRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "INVALID_REQUEST", issues: parsed.error.issues });
    }

    const payload = parsed.data;
    const scenario: Scenario = payload.scenario;

    const baseWebhookPayload = {
        type: "OFFRAMP" as const,
        token: payload.token,
        user_identifier: payload.user_identifier,
        amount: payload.amount,
        linkedBankAccountId: payload.linkedBankAccountId,
    };

    try {
        if (scenario === "success") {
            await queueWebhook({ ...baseWebhookPayload, status: "Success" as const }, WEBHOOK_SECRET, WEBHOOK_URL, {
                delayMs: 0,
                jobId: `offramp-${payload.token}`,
            });
            return res.status(202).json({
                queued: true,
                token: payload.token,
                status: "PENDING_WEBHOOK"
            });
        }

        if (scenario === "failure") {
            await queueWebhook(
                {
                    ...baseWebhookPayload,
                    status: "Failure" as const,
                    failureReasonCode: "USER_DECLINED" as const,
                    failureReasonMessage: "Declined in mock UI",
                },
                WEBHOOK_SECRET,
                WEBHOOK_URL,
                { delayMs: 0, jobId: `offramp-${payload.token}` }
            );

            return res.status(202).json({
                queued: true,
                token: payload.token, status: "PENDING_WEBHOOK"
            });
        }

        if (scenario === "chaos-slow") {
            await queueWebhook({ ...baseWebhookPayload, status: "Success" as const }, WEBHOOK_SECRET, WEBHOOK_URL, {
                delayMs: 10_000,
                jobId: `offramp-${payload.token}`,
            });
            return res.status(202).json({ queued: true, token: payload.token, status: "DELAYED_ENQUEUE" });
        }

        if (scenario === "chaos-duplicate") {
            const webhookPayload = { ...baseWebhookPayload, status: "Success" as const };
            await Promise.all([
                queueWebhook(webhookPayload, WEBHOOK_SECRET, WEBHOOK_URL, {
                    delayMs: randomDelayMs(200),
                    jobId: `offramp-${payload.token}-dup-1`
                }),
                queueWebhook(webhookPayload, WEBHOOK_SECRET, WEBHOOK_URL, {
                    delayMs: randomDelayMs(200),
                    jobId: `offramp-${payload.token}-dup-2`
                }),
                queueWebhook(webhookPayload, WEBHOOK_SECRET, WEBHOOK_URL, {
                    delayMs: randomDelayMs(200),
                    jobId: `offramp-${payload.token}-dup-3`
                }),
            ]);
            return res.status(202).json({
                queued: true,
                token: payload.token,
                status: "DUPLICATE_ENQUEUED"
            });
        }

        if (scenario === "chaos-race") {
            const webhookPayload1 = { ...baseWebhookPayload, status: "Success" as const };
            const webhookPayload2 = {
                ...baseWebhookPayload,
                status: "Failure" as const,
                failureReasonCode: "BANK_TIMEOUT" as const,
                failureReasonMessage: "Race scenario induced timeout",
            };

            await Promise.all([
                queueWebhook(webhookPayload1, WEBHOOK_SECRET, WEBHOOK_URL, {
                    delayMs: randomDelayMs(200),
                    jobId: `offramp-${payload.token}-race-1`
                }),
                queueWebhook(webhookPayload2, WEBHOOK_SECRET, WEBHOOK_URL, {
                    delayMs: randomDelayMs(200),
                    jobId: `offramp-${payload.token}-race-2`
                }),
            ]);

            return res.status(202).json({
                queued: true,
                token: payload.token, status: "RACE_ENQUEUED"
            });
        }

        return res.status(400).json({ message: "UNSUPPORTED_SCENARIO" });

    } catch (err: any) {
        return res.status(503).json({
            error: "QUEUE_UNAVAILABLE",
            message: err?.message ?? "Failed to enqueue webhook"
        });
    }
});
