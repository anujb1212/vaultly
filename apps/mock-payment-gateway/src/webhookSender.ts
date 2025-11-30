import { Queue, Worker } from 'bullmq'
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

function generateSignature(payload: any, secret: string): string {
    return crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex')
}

function getBackoffWithJitter(attemptsMade: number): number {
    const exponentialDelay = Math.min(
        1000 * Math.pow(2, attemptsMade),
        3600000
    )

    const jitter = Math.random() * 1000

    return exponentialDelay + jitter
}

async function sendWebhook(payload: any, secret: string, url: string): Promise<boolean> {
    const signature = generateSignature(payload, secret)

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'X-Webhook-Id': payload.token,
                'X-Webhook-Timestamp': Date.now().toString()
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000)
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} : ${response.statusText}`)
        }

        console.log(`[WebhookSender] Webhook delivered: ${payload.token}`)

        return true
    } catch (error: any) {
        const isTransient =
            error.name === 'AbortSignal' ||
            error.code === 'ECONNREFUSED' ||
            error.code === 'ETIMEOUT' ||
            (error.message && error.message.includes('HTTP 5'))

        console.error(`[WebhookSender] Webhook failed (${isTransient ? 'transient' : 'permanent'}):`, error.message)

        if (!isTransient) {
            throw new Error(`PERMANENT ERROR: ${error.message}`)
        }

        throw error
    }
}


export const webhookWorker = new Worker('webhook-delivery', async (job) => {
    const { payload, secret, url } = job.data
    console.log(`[Worker] Processing webhook attempt ${job.attemptsMade + 1}/${job.opts.attempts}`);
    await sendWebhook(payload, secret, url)
},
    {
        connection: redisConnection,
        concurrency: 10,
        settings: {
            backoffStrategy: getBackoffWithJitter
        }
    }

)

webhookWorker.on('failed', async (job, error) => {
    if (job && job.attemptsMade >= (job.opts.attempts || 5)) {
        console.error(`[DLQ] Moving to DLQ after ${job.attemptsMade} attempts:`, job.data.payload.token);
        await dlqQueue.add('failed-webhook', {
            ...job?.data,
            failureReason: error.message,
            failedAt: new Date().toISOString(),
            attempts: job?.attemptsMade
        })
    }
})

webhookWorker.on('completed', async (job) => {
    const latency = Date.now() - job.timestamp
    console.log(`[Metrics] Webhook delivered in ${latency}ms after ${job.attemptsMade} attempts`)
})

export async function queueWebhook(payload: any, secret: string, url: string) {
    await webhookQueue.add('send-webhook', {
        payload,
        secret,
        url
    }, {
        jobId: payload.token
    })

    console.log(`[Queue] Webhook queued: ${payload.token}`)
}

export async function getDLQJobs() {
    const failed = await dlqQueue.getJobs(['completed', 'failed', 'delayed']);
    return failed.map(job => ({
        id: job.id,
        token: job.data.payload.token,
        failureReason: job.data.failureReason,
        failedAt: job.data.failedAt,
        attempts: job.data.attempts,
    }));
}