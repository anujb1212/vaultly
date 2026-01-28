"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import db from "@repo/db/client";

export type TransactionPinStatusResult =
    | {
        success: true;
        isSet: boolean;
        isLocked: boolean;
        lockedUntil: string | null;
        changedAt: string | null
    }
    | {
        success: false;
        message: string;
        errorCode: "UNAUTHENTICATED" | "UNKNOWN"
    }

export async function getTransactionPinStatus(): Promise<TransactionPinStatusResult> {
    const session = await getServerSession(authOptions)
    const userIdRaw = session?.user?.id

    if (!userIdRaw) {
        return {
            success: false,
            message: "Unauthenticated Request",
            errorCode: "UNAUTHENTICATED"
        }
    }

    const userId = Number(userIdRaw)
    if (!Number.isFinite(userId) || userId <= 0) {
        return {
            success: false,
            message: "Invalid Session User",
            errorCode: "UNAUTHENTICATED"
        }
    }

    try {
        const pin = await db.transactionPin.findUnique({
            where: { userId },
            select: {
                lockedUntil: true,
                changedAt: true
            }
        })

        const now = new Date()
        const lockedUntil = pin?.lockedUntil ?? null

        return {
            success: true,
            isSet: Boolean(pin),
            isLocked: Boolean(lockedUntil && lockedUntil > now),
            lockedUntil: lockedUntil ? lockedUntil.toISOString() : null,
            changedAt: pin?.changedAt ? pin.changedAt.toISOString() : null
        }

    } catch {
        return {
            success: false,
            message: "Failed to load PIN status",
            errorCode: "UNKNOWN"
        }
    }
}
