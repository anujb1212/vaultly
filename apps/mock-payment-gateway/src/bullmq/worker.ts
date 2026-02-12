import { UnrecoverableError, Worker } from "bullmq";
import type { WebhookJobData } from "./jobTypes";
import { redisConnection } from "../config/redis";
import { dlqQueue } from "./queues";
import { getBackoffWithJitter } from "../webhook/backoff";
import { isTransientError } from "../webhook/classifyError";
import { sendWebhook } from "../webhook/sender";

let workerSingleton: Worker<WebhookJobData> | null = null;

export function startWebhookWorker(): Worker<WebhookJobData> {
    if (workerSingleton) return workerSingleton;

    const worker = new Worker<WebhookJobData>(
        "webhook-delivery",
        async (job) => {
            const { payload, secret, url, webhookEventId } = job.data;

            console.log(`[Worker] Processing webhook token=${payload?.token} attempt ${job.attemptsMade + 1}/${job.opts.attempts}`);

            try {
                await sendWebhook({ payload, secret, url, webhookEventId });
            } catch (error: any) {
                const transient = isTransientError(error);

                console.error(
                    `[WebhookSender] Webhook failed (${transient ? "transient" : "permanent"
                    }): token=${payload?.token} id=${webhookEventId} error=${error?.message
                    }`
                );

                if (!transient) {
                    throw new UnrecoverableError(
                        `PERMANENT ERROR: ${error?.message ?? "unknown"}`
                    );
                }

                throw error;
            }
        },
        {
            connection: redisConnection,
            concurrency: 4,
            settings: { backoffStrategy: getBackoffWithJitter },
        }
    );

    worker.on("failed", async (job, error) => {
        if (!job) return;

        const maxAttempts = job.opts.attempts ?? 1;
        const attemptsUsed = job.attemptsMade ?? 0;
        const isUnrecoverable = error?.name === "UnrecoverableError"

        if (isUnrecoverable || attemptsUsed >= maxAttempts) {
            const token = job.data?.payload?.token;
            const webhookEventId = job.data?.webhookEventId;

            console.error(`[DLQ] Moving to DLQ after ${attemptsUsed}/${maxAttempts} attempts: token=${token} id=${webhookEventId}`);

            const transient = isTransientError(error);

            await dlqQueue.add("failed-webhook", {
                ...(job.data as WebhookJobData),
                failureReason: error?.message ?? "unknown",
                failureClass: isUnrecoverable ? "permanent" : (transient ? "transient" : "permanent"),
                failedAt: new Date().toISOString(),
                attempts: attemptsUsed,
                sourceQueue: "webhook-delivery",
                sourceJobId: job.id ?? null,
                sourceJobName: job.name,
            } satisfies WebhookJobData);
        }
    });

    worker.on("completed", async (job) => {
        const latency = Date.now() - job.timestamp;
        console.log(`[Metrics] Webhook delivered in ${latency}ms after ${job.attemptsMade} attempts`);
    });

    workerSingleton = worker;
    return workerSingleton;
}
