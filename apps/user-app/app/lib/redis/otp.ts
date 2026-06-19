import "server-only";

import crypto from "crypto";
import { redis } from "./redis";

const OTP_LENGTH = 6;
const OTP_TTL_SEC = 5 * 60;
const VERIFY_MAX_ATTEMPTS = 5;

function otpKey(prefix: string, id: string | number): string {
    return `otp:${prefix}:${id}`;
}

function attemptsKey(prefix: string, id: string | number): string {
    return `otp:${prefix}:attempts:${id}`;
}

export async function generateOTP(prefix: string, id: string | number): Promise<string> {
    const key = otpKey(prefix, id);
    const code = randomDigits(OTP_LENGTH);

    await redis.setex(key, OTP_TTL_SEC, code);
    await redis.del(attemptsKey(prefix, id));

    return code;
}

export async function verifyOTP(
    prefix: string,
    id: string | number,
    code: string,
): Promise<{ success: boolean; remaining: number }> {
    const key = otpKey(prefix, id);
    const attKey = attemptsKey(prefix, id);

    const attempts = await redis.incr(attKey);
    if (attempts === 1) {
        await redis.expire(attKey, OTP_TTL_SEC);
    }

    if (attempts > VERIFY_MAX_ATTEMPTS) {
        return { success: false, remaining: 0 };
    }

    const stored = await redis.get(key);
    if (!stored) {
        return { success: false, remaining: Math.max(0, VERIFY_MAX_ATTEMPTS - attempts) };
    }

    if (!timingSafeEqual(code, stored)) {
        return { success: false, remaining: Math.max(0, VERIFY_MAX_ATTEMPTS - attempts) };
    }

    await redis.del(key);
    await redis.del(attKey);
    return { success: true, remaining: VERIFY_MAX_ATTEMPTS - attempts };
}

export async function invalidateOTP(prefix: string, id: string | number): Promise<void> {
    await redis.del(otpKey(prefix, id));
    await redis.del(attemptsKey(prefix, id));
}

function randomDigits(length: number): string {
    const chars = "0123456789";
    const buf = crypto.randomBytes(length);
    let result = "";
    for (let i = 0; i < length; i++) {
        const byte = buf[i]!;
        result += chars[byte % chars.length];
    }
    return result;
}

function timingSafeEqual(a: string, b: string): boolean {
    try {
        return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
        return false;
    }
}
