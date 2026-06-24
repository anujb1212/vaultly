function getRedisConnection() {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
        const url = new URL(redisUrl);
        const isTLS = url.protocol === "rediss:";
        return {
            host: url.hostname,
            port: parseInt(url.port || "6379"),
            ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
            ...(url.pathname && url.pathname.length > 1
                ? { db: parseInt(url.pathname.slice(1)) || 0 }
                : {}),
            maxRetriesPerRequest: null,
            ...(isTLS ? { tls: {} as Record<string, never> } : {}),
        };
    }

    const port = parseInt(process.env.REDIS_PORT || "6379");
    return {
        host: process.env.REDIS_HOST || "localhost",
        port: Number.isFinite(port) ? port : 6379,
        maxRetriesPerRequest: null,
    };
}

export const redisConnection = getRedisConnection();
