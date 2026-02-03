"use server";

import "server-only";
import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";
import db, { auditLogger } from "@repo/db/client";
import { authOptions } from "../auth";
import { rateLimit } from "../redis/rateLimit";

export type ChangePasswordResult =
    | { success: true; message: string }
    | {
        success: false;
        message: string;
        retryAfterSec?: number;
        errorCode: "UNAUTHENTICATED" | "INVALID_INPUT" | "RATE_LIMITED" | "INVALID_CURRENT" | "UNKNOWN";
    };

function isStrongEnough(pw: string) {
    return typeof pw === "string" && pw.trim().length >= 8;
}

export async function changePassword(input: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}): Promise<ChangePasswordResult> {
    const session = await getServerSession(authOptions);
    const userIdRaw = session?.user?.id;
    const sessionId = (session as any)?.sessionId ?? null;

    if (!userIdRaw) {
        return { success: false, message: "Unauthenticated Request", errorCode: "UNAUTHENTICATED" };
    }

    const userId = Number(userIdRaw);
    if (!Number.isFinite(userId) || userId <= 0) {
        return { success: false, message: "Invalid session user", errorCode: "UNAUTHENTICATED" };
    }

    const { currentPassword, newPassword, confirmPassword } = input;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { success: false, message: "Missing fields", errorCode: "INVALID_INPUT" };
    }
    if (!isStrongEnough(newPassword)) {
        return { success: false, message: "New password must be at least 8 characters", errorCode: "INVALID_INPUT" };
    }
    if (newPassword !== confirmPassword) {
        return { success: false, message: "Passwords do not match", errorCode: "INVALID_INPUT" };
    }
    if (currentPassword === newPassword) {
        return { success: false, message: "New password must be different", errorCode: "INVALID_INPUT" };
    }

    const rl = await rateLimit({
        key: `rl:password:change:user:${userId}`,
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

    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });

        if (!user) return { success: false, message: "Invalid user", errorCode: "UNAUTHENTICATED" };

        const ok = await bcrypt.compare(currentPassword, user.password);
        if (!ok) return { success: false, message: "Current password is incorrect", errorCode: "INVALID_CURRENT" };

        const nextHash = await bcrypt.hash(newPassword, 10);

        await db.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: { password: nextHash },
            });

            if (sessionId) {
                await tx.userSession.updateMany({
                    where: { userId, id: { not: String(sessionId) }, revokedAt: null },
                    data: { revokedAt: new Date() },
                });
            }

            await auditLogger.createAuditLog(
                {
                    userId,
                    action: "PASSWORD_CHANGED",
                    entityType: "User",
                    newValue: { revokedOtherSessions: Boolean(sessionId) },
                    metadata: { source: "settings" },
                },
                tx
            );
        });

        return { success: true, message: "Password changed successfully" };
    } catch {
        return { success: false, message: "Failed to change password", errorCode: "UNKNOWN" };
    }
}
