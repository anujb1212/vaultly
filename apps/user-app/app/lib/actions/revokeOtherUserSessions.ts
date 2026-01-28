"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import db, { auditLogger } from "@repo/db/client";

export async function revokeOtherUserSessions() {
    const session = await getServerSession(authOptions);
    const userIdRaw = session?.user?.id;
    const currentSessionId = (session as any)?.sessionId as string | null;

    if (!userIdRaw) {
        return { success: false as const, errorCode: "UNAUTHENTICATED" as const, message: "Unauthenticated" };
    }
    if (!currentSessionId) {
        return { success: false as const, errorCode: "UNKNOWN" as const, message: "Missing current session" };
    }

    const userId = Number(userIdRaw);

    const res = await db.userSession.updateMany({
        where: { userId, id: { not: currentSessionId }, revokedAt: null },
        data: { revokedAt: new Date() },
    });

    await auditLogger.createAuditLog({
        userId,
        action: "SESSION_REVOKED_ALL_OTHERS",
        entityType: "UserSession",
        newValue: { revokedCount: res.count },
    });

    return { success: true as const, revokedCount: res.count };
}
