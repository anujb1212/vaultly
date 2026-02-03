"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { rateLimit } from "../redis/rateLimit";
import db, { auditLogger } from "@repo/db/client";
import bcrypt from "bcrypt";
import { VerifyMpinError, verifyMpinOrThrow } from "../security/verifyMpin";

export type SetTransactionPinResult =
    | { success: true; message: string }
    | {
        success: false;
        message: string;
        retryAfterSec?: number;
        errorCode:
        | "UNAUTHENTICATED"
        | "INVALID_INPUT"
        | "RATE_LIMITED"
        | "ALREADY_SET"
        | "NOT_SET"
        | "PIN_LOCKED"
        | "PIN_INVALID"
        | "UNKNOWN";
    };

function isSixDigitPin(pin: string): boolean {
    return /^\d{6}$/.test(pin);
}

function getUserIdOrFail(session: any): SetTransactionPinResult | { userId: number } {
    const userIdRaw = session?.user?.id;

    if (!userIdRaw) {
        return {
            success: false,
            message: "Unauthenticated Request",
            errorCode: "UNAUTHENTICATED",
        };
    }

    const userId = Number(userIdRaw);
    if (!Number.isFinite(userId) || userId <= 0) {
        return {
            success: false,
            message: "Invalid session user",
            errorCode: "UNAUTHENTICATED",
        };
    }

    return { userId };
}

export async function setTransactionPin(pin: string): Promise<SetTransactionPinResult> {
    const session = await getServerSession(authOptions);
    const userIdRes = getUserIdOrFail(session);
    if ("success" in userIdRes) return userIdRes;
    const { userId } = userIdRes;

    if (typeof pin !== "string" || !isSixDigitPin(pin)) {
        return {
            success: false,
            message: "PIN must be exactly 6 digits",
            errorCode: "INVALID_INPUT",
        };
    }

    const rl = await rateLimit({
        key: `rl:mpin:set:user:${userId}`,
        limit: 3,
        windowSec: 60 * 60,
    });

    if (!rl.allowed) {
        return {
            success: false,
            message: `Too many attempts. Retry after ${rl.ttl}s`,
            retryAfterSec: rl.ttl,
            errorCode: "RATE_LIMITED",
        };
    }

    const existing = await db.transactionPin.findUnique({
        where: { userId },
        select: { userId: true },
    });

    if (existing) {
        return {
            success: false,
            message: "PIN already set",
            errorCode: "ALREADY_SET",
        };
    }

    try {
        const pinHash = await bcrypt.hash(pin, 12);

        await db.$transaction(async (tx) => {
            await tx.transactionPin.create({
                data: {
                    userId,
                    pinHash,
                    algo: "bcrypt",
                    version: 1,
                    changedAt: new Date(),
                },
            });

            await auditLogger.createAuditLog(
                {
                    userId,
                    action: "MPIN_SET",
                    entityType: "TransactionPin",
                    newValue: { algo: "bcrypt", version: 1 },
                    metadata: { source: "settings" },
                },
                tx
            );
        });

        return { success: true, message: "Transaction PIN set successfully" };
    } catch {
        const after = await db.transactionPin.findUnique({
            where: { userId },
            select: { userId: true },
        });

        if (after) {
            return {
                success: false,
                message: "PIN already set",
                errorCode: "ALREADY_SET",
            };
        }

        return {
            success: false,
            message: "Failed to set PIN",
            errorCode: "UNKNOWN",
        };
    }
}

export async function changeTransactionPin(input: {
    currentPin: string;
    newPin: string;
    confirmPin: string;
}): Promise<SetTransactionPinResult> {
    const session = await getServerSession(authOptions);
    const userIdRes = getUserIdOrFail(session);
    if ("success" in userIdRes) return userIdRes;
    const { userId } = userIdRes;

    const { currentPin, newPin, confirmPin } = input;

    if (!isSixDigitPin(currentPin)) {
        return { success: false, message: "Current PIN must be exactly 6 digits", errorCode: "INVALID_INPUT" };
    }
    if (!isSixDigitPin(newPin)) {
        return { success: false, message: "New PIN must be exactly 6 digits", errorCode: "INVALID_INPUT" };
    }
    if (newPin !== confirmPin) {
        return { success: false, message: "PINs do not match", errorCode: "INVALID_INPUT" };
    }
    if (currentPin === newPin) {
        return { success: false, message: "New PIN must be different", errorCode: "INVALID_INPUT" };
    }

    const rl = await rateLimit({
        key: `rl:mpin:change:user:${userId}`,
        limit: 3,
        windowSec: 60 * 60,
    });

    if (!rl.allowed) {
        return {
            success: false,
            message: `Too many attempts. Retry after ${rl.ttl}s`,
            retryAfterSec: rl.ttl,
            errorCode: "RATE_LIMITED",
        };
    }

    const existing = await db.transactionPin.findUnique({
        where: { userId },
        select: { userId: true, version: true },
    });

    if (!existing) {
        return { success: false, message: "PIN not set", errorCode: "NOT_SET" };
    }

    try {
        await verifyMpinOrThrow({
            userId,
            mpin: currentPin,
            context: { action: "MPIN_CHANGE" },
        });

        const nextHash = await bcrypt.hash(newPin, 12);
        const nextVersion = (existing.version ?? 1) + 1;

        await db.$transaction(async (tx) => {
            await tx.transactionPin.update({
                where: { userId },
                data: {
                    pinHash: nextHash,
                    algo: "bcrypt",
                    version: nextVersion,
                    changedAt: new Date(),
                    failedAttempts: 0,
                    lockedUntil: null,
                    lastFailedAt: null,
                },
            });

            await auditLogger.createAuditLog(
                {
                    userId,
                    action: "MPIN_CHANGED",
                    entityType: "TransactionPin",
                    newValue: { algo: "bcrypt", version: nextVersion },
                    metadata: { source: "settings" },
                },
                tx
            );
        });

        return { success: true, message: "Transaction PIN changed successfully" };
    } catch (e) {
        if (e instanceof VerifyMpinError) {
            if (e.code === "PIN_LOCKED") {
                return {
                    success: false,
                    message: e.message,
                    retryAfterSec: e.retryAfterSec,
                    errorCode: "PIN_LOCKED",
                };
            }
            if (e.code === "PIN_INVALID") {
                return { success: false, message: e.message, errorCode: "PIN_INVALID" };
            }
            return { success: false, message: e.message, errorCode: "INVALID_INPUT" };
        }

        return { success: false, message: "Failed to change PIN", errorCode: "UNKNOWN" };
    }
}
