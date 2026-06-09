import { Queue } from "bullmq"
import { redisConnection } from "../config/redis"

const ENV = process.env.NODE_ENV ?? 'development';
export const QUEUE_PREFIX = `{vaultly-${ENV}}`;

export const webhookQueue = new Queue('webhook-delivery', {
    connection: redisConnection,
    prefix: QUEUE_PREFIX,
    defaultJobOptions: {
        attempts: 5,
        removeOnComplete: 100,
        removeOnFail: 500
    }
})

export const dlqQueue = new Queue('webhook-dlq', {
    connection: redisConnection,
    prefix: QUEUE_PREFIX,
    defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false
    }
})

webhookQueue.on('error', (err) => {
    console.error('[Queue][webhook-delivery] Error:', err.message)
})

dlqQueue.on('error', (err) => {
    console.error('[Queue][webhook-dlq] Error:', err.message)
})
