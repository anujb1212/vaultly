import { redis } from "../redis/redis";

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

export async function peekAIQuota(opts: { userId: number; feature?: "security_insights" }) {
    const feature = opts.feature ?? "security_insights";
    const day = isoDayUTC();

    const userDailyCap = Number(process.env.AI_USER_DAILY_CAP ?? "3");
    const globalDailyCap = Number(process.env.AI_GLOBAL_DAILY_CAP ?? "200");

    const userKey = `ai:quota:${feature}:user:${opts.userId}:${day}`;
    const globalKey = `ai:quota:${feature}:global:${day}`;

    const [userUsedRaw, globalUsedRaw] = await Promise.all([redis.get(userKey), redis.get(globalKey)]);
    const userUsed = userUsedRaw ? Number(userUsedRaw) : 0;
    const globalUsed = globalUsedRaw ? Number(globalUsedRaw) : 0;

    if (userUsed >= userDailyCap) {
        return { allowed: false as const, reason: "USER_DAILY_CAP" as const, userUsed, globalUsed, userDailyCap, globalDailyCap };
    }
    if (globalUsed >= globalDailyCap) {
        return { allowed: false as const, reason: "GLOBAL_DAILY_CAP" as const, userUsed, globalUsed, userDailyCap, globalDailyCap };
    }

    return { allowed: true as const, userUsed, globalUsed, userDailyCap, globalDailyCap };
}

export async function consumeAIQuota(opts: { userId: number; feature?: "security_insights" }) {
    return checkAndConsumeAIQuota(opts);
}

function cbKey(provider: "gemini") {
    return `ai:cb:${provider}`;
}

function cbReasonKey(provider: "gemini") {
    return `ai:cb:${provider}:reason`;
}

function cbProbeKey(provider: "gemini") {
    return `ai:cb:${provider}:probe`;
}

export async function isAICircuitOpen(provider: "gemini", opts?: { probeWindowSec?: number }) {
    const v = await redis.get(cbKey(provider));
    if (v !== "1") return false;

    const probeWindowSec = Math.max(5, Number(opts?.probeWindowSec ?? 30));

    const probeClaim = await redis.set(cbProbeKey(provider), "1", "EX", probeWindowSec, "NX");
    if (probeClaim === "OK") {
        return false;
    }

    return true;
}

export async function openAICircuit(opts: { provider: "gemini"; ttlSec?: number; reason?: string }) {
    const ttlSec = Math.max(60, Number(opts.ttlSec ?? 3 * 60));
    await redis.set(cbKey(opts.provider), "1", "EX", ttlSec);

    if (opts.reason) {
        await redis.set(cbReasonKey(opts.provider), opts.reason.slice(0, 80), "EX", ttlSec);
    }
}

export async function closeAICircuit(provider: "gemini") {
    await Promise.all([
        redis.del(cbKey(provider)),
        redis.del(cbReasonKey(provider)),
        redis.del(cbProbeKey(provider)),
    ]);
}

export async function getAICircuitReason(provider: "gemini") {
    return redis.get(cbReasonKey(provider));
}
