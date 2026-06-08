import Redis from "ioredis";

declare global {
    var __redis: Redis | undefined;
}

function getRedis(): Redis {
    const url = process.env.REDIS_URL || "";
    if (!url) throw new Error("[redis] REDIS_URL is not set");

    if (process.env.NODE_ENV === "production") return createRedisClient(url);
    if (!globalThis.__redis) globalThis.__redis = createRedisClient(url);
    return globalThis.__redis;
}

function createRedisClient(url: string): Redis {
    const client = new Redis(url, {
        maxRetriesPerRequest: null,
        lazyConnect: false,
    });
    client.on("error", (err) => console.error("[redis] client error", err));
    return client;
}

export const redis = getRedis();
