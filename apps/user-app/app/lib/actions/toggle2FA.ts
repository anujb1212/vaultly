"use server";

import { getServerSession } from "next-auth";
import db, { auditLogger } from "@repo/db/client";
import { authOptions } from "../auth";
import { redis } from "../redis/redis";

const VERIFIED_TTL_SEC = 5 * 60;

export type Toggle2FAResult =
  | { success: true; twoFactorEnabled: boolean }
  | { success: false; errorCode: "UNAUTHENTICATED" | "INTERNAL_ERROR"; message: string };

export async function toggle2FA(
  enable: boolean
): Promise<Toggle2FAResult> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const email = session?.user?.email;

  if (!userId || !email) {
    return { success: false, errorCode: "UNAUTHENTICATED", message: "Not signed in." };
  }

  try {
    await db.user.update({
      where: { id: Number(userId) },
      data: { twoFactorEnabled: enable },
    });

    // When enabling, immediately mark the current session as 2FA-verified
    // so the user isn't kicked out of the app. 2FA only gates future logins.
    if (enable) {
      await redis.setex(`2fa:verified:${Number(userId)}`, VERIFIED_TTL_SEC, "1");
    }

    await auditLogger.createAuditLog({
      userId: Number(userId),
      action: enable ? "TWOFA_ENABLED" : "TWOFA_DISABLED",
      entityType: "Two-Factor Auth",
      metadata: { email },
      newValue: { twoFactorEnabled: enable },
    });

    return { success: true, twoFactorEnabled: enable };
  } catch {
    return { success: false, errorCode: "INTERNAL_ERROR", message: "Something went wrong." };
  }
}
