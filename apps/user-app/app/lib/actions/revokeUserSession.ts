"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import db, { auditLogger } from "@repo/db/client";

export async function revokeUserSession(sessionId: string) {
    const session = await getServerSession(authOptions);
    const userIdRaw = session?.user?.id;

    if (!userIdRaw) {
        return { success: false as const, errorCode: "UNAUTHENTICATED" as const, message: "Unauthenticated" };
    }

    const userId = Number(userIdRaw);

    const row = await db.userSession.findFirst({
        where: { id: sessionId, userId },
        select: { id: true, revokedAt: true },
    });

    if (!row) {
        return { success: false as const, errorCode: "NOT_FOUND" as const, message: "Session not found" };
    }

    if (row.revokedAt) {
        return { success: true as const };
    }

    await db.userSession.update({
        where: { id: row.id },
        data: { revokedAt: new Date() },
    });

    await auditLogger.createAuditLog({
        userId,
        action: "SESSION_REVOKED",
        entityType: "UserSession",
        newValue: { sessionId: row.id },
        metadata: { sessionId: row.id },
    });

    return { success: true as const };
}
