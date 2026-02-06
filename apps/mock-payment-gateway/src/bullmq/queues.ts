import { Queue } from "bullmq"
import { redisConnection } from "../config/redis"

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
