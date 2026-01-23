"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { rateLimit } from "../rateLimit";
import db, { auditLogger } from "@repo/db/client";
import bcrypt from "bcrypt";

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
        | "UNKNOWN";
    };

function isSixDigitPin(pin: string): boolean {
    return /^\d{6}$/.test(pin);
}

export async function setTransactionPin(pin: string): Promise<SetTransactionPinResult> {
    const session = await getServerSession(authOptions);
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
            message: "PIN already set. Change/Reset will be added next.",
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
                    metadata: { source: "settings-security" },
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
                message: "PIN already set. Change/Reset will be added next.",
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
