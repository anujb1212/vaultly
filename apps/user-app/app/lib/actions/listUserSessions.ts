"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import db from "@repo/db/client";

export async function listUserSessions() {
    const session = await getServerSession(authOptions);
    const userIdRaw = session?.user?.id;
    const currentSessionId = (session as any)?.sessionId as string | null;

    if (!userIdRaw) {
        return { success: false as const, errorCode: "UNAUTHENTICATED" as const, message: "Unauthenticated" };
    }

    const userId = Number(userIdRaw);

    const rows = await db.userSession.findMany({
        where: { userId },
        orderBy: [{ revokedAt: "asc" }, { lastSeenAt: "desc" }, { createdAt: "desc" }],
        select: {
            id: true,
            createdAt: true,
            lastSeenAt: true,
            expiresAt: true,
            ip: true,
            userAgent: true,
            deviceId: true,
            deviceLabel: true,
            revokedAt: true,
            sudoUntil: true,
        },
    });

    return {
        success: true as const,
        sessions: rows.map((r) => ({
            ...r,
            isCurrent: Boolean(currentSessionId && r.id === currentSessionId),
        })),
    };
}
