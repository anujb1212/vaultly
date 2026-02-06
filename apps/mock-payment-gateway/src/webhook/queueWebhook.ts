import crypto from "crypto";
import { webhookQueue } from "../bullmq/queues";
import type { WebhookJobData } from "../bullmq/jobTypes";

function generateWebhookEventId(): string {
    return crypto.randomUUID();
}

export async function queueWebhook(
    payload: any,
    secret: string,
    url: string,
    opts?: {
        delayMs?: number;
        jobId?: string
    }
) {
    const webhookEventId = generateWebhookEventId();

    await webhookQueue.add(
        "send-webhook",
        { payload, secret, url, webhookEventId } satisfies WebhookJobData,
        {
            delay: opts?.delayMs ?? 0,
            jobId: opts?.jobId ?? payload.token,
        }
    );

    console.log(`[Queue] Webhook queued: token=${payload.token} webhookId=${webhookEventId}`);
}
