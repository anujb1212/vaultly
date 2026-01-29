import { redis } from "../redis";

function isoDayUTC() {
    return new Date().toISOString().slice(0, 10);
}

function ttlSecondsForDailyKey() {
    return 30 * 60 * 60;
}

export type AIQuotaResult =
    | { allowed: true; userUsed: number; globalUsed: number; userDailyCap: number; globalDailyCap: number }
    | {
        allowed: false;
        reason: "USER_DAILY_CAP" | "GLOBAL_DAILY_CAP";
        userUsed: number;
        globalUsed: number;
        userDailyCap: number;
        globalDailyCap: number;
    };

export async function checkAndConsumeAIQuota(opts: { userId: number; feature?: "security_insights" }) {
    const feature = opts.feature ?? "security_insights";
    const day = isoDayUTC();

    const userDailyCap = Number(process.env.AI_USER_DAILY_CAP ?? "5");
    const globalDailyCap = Number(process.env.AI_GLOBAL_DAILY_CAP ?? "200");

    const userKey = `ai:quota:${feature}:user:${opts.userId}:${day}`;
    const globalKey = `ai:quota:${feature}:global:${day}`;

    const ttl = ttlSecondsForDailyKey();

    const [userUsed, globalUsed] = (await Promise.all([
        redis.incr(userKey),
        redis.incr(globalKey),
    ])) as [number, number];

    if (userUsed === 1) await redis.expire(userKey, ttl);
    if (globalUsed === 1) await redis.expire(globalKey, ttl);

    if (userUsed > userDailyCap) {
        return {
            allowed: false,
            reason: "USER_DAILY_CAP",
            userUsed,
            globalUsed,
            userDailyCap,
            globalDailyCap,
        } satisfies AIQuotaResult;
    }

    if (globalUsed > globalDailyCap) {
        return {
            allowed: false,
            reason: "GLOBAL_DAILY_CAP",
            userUsed,
            globalUsed,
            userDailyCap,
            globalDailyCap,
        } satisfies AIQuotaResult;
    }

    return {
        allowed: true,
        userUsed,
        globalUsed,
        userDailyCap,
        globalDailyCap,
    } satisfies AIQuotaResult;
}

export async function isAICircuitOpen(provider: "gemini") {
    const v = await redis.get(`ai:cb:${provider}`);
    return v === "1";
}

export async function openAICircuit(opts: { provider: "gemini"; ttlSec?: number; reason?: string }) {
    const ttlSec = Math.max(60, Number(opts.ttlSec ?? 20 * 60));
    await redis.set(`ai:cb:${opts.provider}`, "1", "EX", ttlSec);

    if (opts.reason) {
        await redis.set(`ai:cb:${opts.provider}:reason`, opts.reason.slice(0, 80), "EX", ttlSec);
    }
}

export async function getAICircuitReason(provider: "gemini") {
    return redis.get(`ai:cb:${provider}:reason`);
}
