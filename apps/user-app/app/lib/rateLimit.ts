import { redis } from "./redis";

const LUA_FIXED_WINDOW = `
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local windowSec = tonumber(ARGV[2])

    local current = redis.call("INCR", key)
    if current == 1 then
        redis.call("EXPIRE", key, windowSec)
    end

    local ttl = redis.call("TTL", key)
    local allowed = 0
    if current <= limit then allowed = 1 end

    return { allowed, current, ttl }
`

export async function rateLimit(
    opts: {
        key: string;
        limit: number;
        windowSec: number
    }) {
    const { key, limit, windowSec } = opts;

    const [allowed, current, ttl] = (await redis.eval(
        LUA_FIXED_WINDOW,
        1,
        key,
        String(limit),
        String(windowSec),
    )) as [number, number, number];

    const safeTtl = ttl > 0 ? ttl : windowSec

    return {
        allowed: allowed === 1,
        current,
        ttl: safeTtl
    };
}
