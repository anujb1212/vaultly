import { Queue, UnrecoverableError, Worker } from 'bullmq'
import crypto from 'crypto'

const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null
}

export const webhookQueue = new Queue('webhook-delivery', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 1000
        },
        removeOnComplete: 100,
        removeOnFail: 500
    }
})

export const dlqQueue = new Queue('webhook-dlq', {
    connection: redisConnection
})

function getBackoffWithJitter(attemptsMade: number): number {
    const exponentialDelay = Math.min(
        1000 * Math.pow(2, attemptsMade),
        3600000
    )

    const jitter = Math.random() * 1000

    return exponentialDelay + jitter
}

function generateWebhookEventId(): string {
    return crypto.randomUUID()
}

async function sendWebhook(
    payload: any,
    secret: string,
    url: string,
    webhookEventId: string
): Promise<void> {
    const bodyStr = JSON.stringify(payload)
    const signature = crypto.createHmac("sha256", secret).update(bodyStr).digest("hex")

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Id': webhookEventId,
            'X-Webhook-Timestamp': Date.now().toString()
        },
        body: bodyStr,
        signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} : ${response.statusText}`)
    }

    console.log(`[WebhookSender] Webhook delivered: token=${payload?.token} id=${webhookEventId}`)

}

function isTransientError(error: any): boolean {
    const msg = String(error?.message ?? "");
    return (
        error?.name === "AbortError" ||
        error?.code === "ECONNREFUSED" ||
        error?.code === "ETIMEOUT" ||
        msg.includes("HTTP 5")
    );
}

export const webhookWorker = new Worker(
    "webhook-delivery",
    async (job) => {
        const { payload, secret, url, webhookEventId } = job.data;

        console.log(`[Worker] Processing webhook token=${payload?.token} attempt ${job.attemptsMade + 1}/${job.opts.attempts}`);

        try {
            await sendWebhook(payload, secret, url, webhookEventId);
        } catch (error: any) {
            const transient = isTransientError(error);

            console.error(`[WebhookSender] Webhook failed (${transient ? "transient" : "permanent"}): token=${payload?.token} id=${webhookEventId} error=${error?.message}`);

            if (!transient) {
                throw new UnrecoverableError(`PERMANENT ERROR: ${error?.message ?? "unknown"}`);
            }

            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: 4,
        settings: { backoffStrategy: getBackoffWithJitter },
    }
)

webhookWorker.on("failed", async (job, error) => {
    if (!job) return;

    const maxAttempts = job.opts.attempts ?? 1;
    const attemptsUsed = job.attemptsMade + 1;

    if (attemptsUsed >= maxAttempts) {
        const token = job.data?.payload?.token;
        const webhookEventId = job.data?.webhookEventId;

        console.error(
            `[DLQ] Moving to DLQ after ${attemptsUsed}/${maxAttempts} attempts: token=${token} id=${webhookEventId}`
        );

        await dlqQueue.add("failed-webhook", {
            ...job.data,
            failureReason: error?.message ?? "unknown",
            failedAt: new Date().toISOString(),
            attempts: attemptsUsed,
        });
    }
});

webhookWorker.on('completed', async (job) => {
    const latency = Date.now() - job.timestamp
    console.log(`[Metrics] Webhook delivered in ${latency}ms after ${job.attemptsMade} attempts`)
})

export async function queueWebhook(
    payload: any,
    secret: string,
    url: string,
    opts?: {
        delayMs?: number,
        jobId?: string
    }) {

    const webhookEventId = generateWebhookEventId()

    await webhookQueue.add('send-webhook', {
        payload,
        secret,
        url,
        webhookEventId
    }, {
        delay: opts?.delayMs ?? 0,
        jobId: opts?.jobId ?? payload.token
    })

    console.log(`[Queue] Webhook queued: token=${payload.token} webhookId=${webhookEventId}`)
}

export async function getDLQJobs() {
    const jobs = await dlqQueue.getJobs(["completed", "failed", "delayed"]);
    return jobs.map((job) => ({
        id: job.id,
        token: job.data?.payload?.token,
        webhookEventId: job.data?.webhookEventId,
        failureReason: job.data?.failureReason,
        failedAt: job.data?.failedAt,
        attempts: job.data?.attempts,
    }));
}