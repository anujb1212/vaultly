import db, { auditLogger } from "@repo/db/client";
import bcrypt from "bcrypt";
import { rateLimit } from "../rateLimit";
import "server-only"

export type VerifyMpinErrorCode =
    | "PIN_REQUIRED"
    | "PIN_NOT_SET"
    | "PIN_LOCKED"
    | "PIN_INVALID"
    | "RATE_LIMITED";

export class VerifyMpinError extends Error {
    constructor(
        public readonly code: VerifyMpinErrorCode,
        message: string,
        public readonly retryAfterSec?: number
    ) {
        super(message);
    }
}

function isSixDigitPin(pin: string): boolean {
    return /^\d{6}$/.test(pin);
}

const MAX_DB_FAILS = 5;
const LOCK_MINUTES = 15;

export async function verifyMpinOrThrow(opts: {
    userId: number;
    mpin: string | undefined;
    context: { action: "P2P_TRANSFER" | "ONRAMP_CREATE" };
}) {
    const { userId, mpin, context } = opts;

    if (!mpin) {
        throw new VerifyMpinError("PIN_REQUIRED", "Transaction PIN is required");
    }
    if (!isSixDigitPin(mpin)) {
        throw new VerifyMpinError("PIN_INVALID", "PIN must be exactly 6 digits");
    }

    const rl = await rateLimit({
        key: `rl:mpin:verify:user:${userId}`,
        limit: 10,
        windowSec: 10 * 60,
    });
    if (!rl.allowed) {
        throw new VerifyMpinError(
            "RATE_LIMITED",
            `Too many PIN attempts. Retry after ${rl.ttl}s`,
            rl.ttl
        );
    }

    const now = new Date();

    await db.$transaction(async (tx) => {
        const pin = await tx.transactionPin.findUnique({
            where: { userId },
            select: {
                pinHash: true,
                failedAttempts: true,
                lockedUntil: true,
                version: true,
            },
        });

        if (!pin) {
            throw new VerifyMpinError("PIN_NOT_SET", "Transaction PIN not set");
        }

        if (pin.lockedUntil && pin.lockedUntil > now) {
            const retryAfterSec = Math.max(
                1,
                Math.floor((pin.lockedUntil.getTime() - now.getTime()) / 1000)
            );
            throw new VerifyMpinError(
                "PIN_LOCKED",
                "PIN locked due to repeated failures",
                retryAfterSec
            );
        }

        const ok = await bcrypt.compare(mpin, pin.pinHash);

        if (ok) {
            if (pin.failedAttempts !== 0 || pin.lockedUntil) {
                await tx.transactionPin.update({
                    where: { userId },
                    data: { failedAttempts: 0, lockedUntil: null, lastFailedAt: null },
                });
            }

            await auditLogger.createAuditLog(
                {
                    userId,
                    action: "MPIN_VERIFIED",
                    entityType: "TransactionPin",
                    newValue: { action: context.action, version: pin.version },
                },
                tx
            );
            return;
        }

        const nextFails = (pin.failedAttempts ?? 0) + 1;
        const shouldLock = nextFails >= MAX_DB_FAILS;
        const lockedUntil = shouldLock
            ? new Date(now.getTime() + LOCK_MINUTES * 60 * 1000)
            : null;

        await tx.transactionPin.update({
            where: { userId },
            data: {
                failedAttempts: nextFails,
                lastFailedAt: now,
                lockedUntil,
            },
        });

        await auditLogger.createAuditLog(
            {
                userId,
                action: "MPIN_VERIFY_FAILED",
                entityType: "TransactionPin",
                newValue: {
                    action: context.action,
                    failedAttempts: nextFails,
                    lockedUntil: lockedUntil ? lockedUntil.toISOString() : null,
                },
            },
            tx
        );

        throw new VerifyMpinError("PIN_INVALID", "Invalid transaction PIN");
    });
}
