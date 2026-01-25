import crypto from "crypto";
import { NextResponse } from "next/server";

import db, { auditLogger } from "@repo/db/client";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? "";

    const ok = new URL("/settings/security?emailVerified=1", url);
    const fail = new URL("/settings/security?emailVerified=0", url);

    if (!token) return NextResponse.redirect(fail);

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();

    const row = await db.emailVerificationToken.findFirst({
        where: { tokenHash, consumedAt: null, expiresAt: { gt: now } },
        select: { id: true, userId: true, email: true },
    });

    if (!row) return NextResponse.redirect(fail);

    await db.$transaction(async (tx) => {
        await tx.emailVerificationToken.update({
            where: { id: row.id },
            data: { consumedAt: now },
        });

        await tx.user.update({
            where: { id: row.userId },
            data: { email: row.email, emailVerified: true },
        });
    });

    await auditLogger.createAuditLog({
        userId: row.userId,
        action: "EMAIL_VERIFIED",
        entityType: "Email Verification",
        metadata: { email: row.email },
        newValue: { email: row.email },
    });

    return NextResponse.redirect(ok);
}
