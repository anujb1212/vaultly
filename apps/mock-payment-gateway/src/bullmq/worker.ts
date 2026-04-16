import { UnrecoverableError, Worker } from "bullmq";
import type { WebhookJobData } from "./jobTypes";
import { redisConnection } from "../config/redis";
import { dlqQueue, QUEUE_PREFIX } from "./queues";
import { getBackoffWithJitter } from "../webhook/backoff";
import { classifyError } from "../webhook/classifyError";
import { sendWebhook } from "../webhook/sender";

let workerSingleton: Worker<WebhookJobData> | null = null;

export function startWebhookWorker(): Worker<WebhookJobData> {
    if (workerSingleton) return workerSingleton;

    const worker = new Worker<WebhookJobData>(
        "webhook-delivery",
        async (job) => {
            const { payload, secret, url, webhookEventId } = job.data;

            console.log(JSON.stringify({
                level: "info",
                event: "webhook_processing",
                token: payload?.token,
                attempt: job.attemptsMade + 1,
                maxAttempts: job.opts.attempts,
            }));

            try {
                await sendWebhook({ payload, secret, url, webhookEventId });
            } catch (error: unknown) {
                const failureClass = classifyError(error);

                console.error(JSON.stringify({
                    level: "error",
                    event: "webhook_failed",
                    failureClass,
                    token: payload?.token,
                    webhookEventId,
                    error: (error as Error)?.message,
                }));

                if (failureClass === "permanent" || failureClass === "unknown") {
                    const cause = error instanceof Error ? error : new Error(String(error));
                    throw new UnrecoverableError(
                        `PERMANENT: ${cause.message}`,
                    );
                }

                throw error;
            }
        },
        {
            connection: redisConnection,
            prefix: QUEUE_PREFIX,
            concurrency: parseInt(process.env.WORKER_CONCURRENCY ?? "4"),
            settings: { backoffStrategy: getBackoffWithJitter },
        }
    );

    worker.on("failed", async (job, error) => {
        if (!job) return;

        const maxAttempts = job.opts.attempts ?? 1;
        const attemptsUsed = job.attemptsMade ?? 0;
        const isUnrecoverable = error instanceof UnrecoverableError

        if (isUnrecoverable || attemptsUsed >= maxAttempts) {
            const token = job.data?.payload?.token;
            const webhookEventId = job.data?.webhookEventId;

            console.error(`[DLQ] Moving to DLQ after ${attemptsUsed}/${maxAttempts} attempts: token=${token} id=${webhookEventId}`);

            const originalError = (error as any)?.cause ?? error;
            const failureClass = classifyError(originalError);

            try {
                await dlqQueue.add("failed-webhook", {
                    ...(job.data as WebhookJobData),
                    failureReason: (error as Error)?.message ?? "unknown",
                    failureClass: isUnrecoverable ? "permanent" : failureClass,
                    failedAt: new Date().toISOString(),
                    attempts: attemptsUsed,
                    sourceQueue: "webhook-delivery",
                    sourceJobId: job.id ?? null,
                    sourceJobName: job.name,
                } satisfies WebhookJobData);
            } catch (dlqError) {
                console.error(JSON.stringify({
                    level: "critical",
                    event: "dlq_add_failed",
                    jobId: job.id,
                    token,
                    webhookEventId,
                    error: (dlqError as Error)?.message,
                }));
            }
        }
    });

    worker.on("completed", (job) => {
        console.log(JSON.stringify({
            level: "info",
            event: "webhook_delivered",
            e2eLatencyMs: Date.now() - job.timestamp,
            processingTimeMs: Date.now() - (job.processedOn ?? job.timestamp),
            attempts: job.attemptsMade,
            token: job.data?.payload?.token,
        }));
    });

    worker.on("error", (err) => {
        console.error(JSON.stringify({
            level: "critical",
            event: "worker_error",
            error: err.message,
        }));
    });

    workerSingleton = worker;
    return workerSingleton;
}

export async function stopWebhookWorker(): Promise<void> {
    if (workerSingleton) {
        await workerSingleton.close();
        workerSingleton = null;
    }
}
