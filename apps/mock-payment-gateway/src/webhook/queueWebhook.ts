import crypto from "crypto";
import { webhookQueue } from "../bullmq/queues";
import type { WebhookJobData, WebhookPayload } from "../bullmq/jobTypes";

const WEBHOOK_URL = process.env.WEBHOOK_URL ?? "http://localhost:3003/bankWebhook"
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "dev_secret"

function generateWebhookEventId(): string {
    return crypto.randomUUID();
}

export type QueueWebhookResult = {
    webhookEventId: string;
    jobId: string;
    enqueued: boolean; // false = deduplicated
}

export async function queueWebhook(
    payload: WebhookPayload,
    opts?: {
        delayMs?: number;
        jobId?: string;
    }
): Promise<QueueWebhookResult> {
    const webhookEventId = generateWebhookEventId();
    const effectiveJobId = opts?.jobId ?? payload.token;

    const existingJob = await webhookQueue.getJob(effectiveJobId);
    const deduplicated = Boolean(existingJob);

    await webhookQueue.add(
        "send-webhook",
        {
            payload,
            secret: WEBHOOK_SECRET,
            url: WEBHOOK_URL,
            webhookEventId
        } satisfies WebhookJobData,
        {
            delay: opts?.delayMs ?? 0,
            jobId: effectiveJobId
        }
    );

    console.log(JSON.stringify({
        level: "info",
        event: deduplicated ? "webhook_deduplicated" : "webhook_enqueued",
        type: payload.type,
        token: payload.token,
        webhookEventId,
        jobId: effectiveJobId,
        ...(deduplicated && {
            existingJobId: existingJob!.id,
            existingJobTimestamp: existingJob!.timestamp,
        }),
    }));

    return {
        webhookEventId: deduplicated
            ? (existingJob!.data as WebhookJobData).webhookEventId
            : webhookEventId,
        jobId: effectiveJobId,
        enqueued: !deduplicated
    }
}
