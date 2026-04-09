const REDIS_PORT_RAW = parseInt(process.env.REDIS_PORT || '6379')
const REDIS_PORT = Number.isFinite(REDIS_PORT_RAW) ? REDIS_PORT_RAW : 6379

if (process.env.NODE_ENV === 'production' && !process.env.REDIS_HOST) {
    throw new Error('[Redis] REDIS_HOST must be set in production')
}

export const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: REDIS_PORT,
    maxRetriesPerRequest: null
}
