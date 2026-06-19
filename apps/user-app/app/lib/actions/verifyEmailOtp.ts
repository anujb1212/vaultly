"use server";

import { getServerSession } from "next-auth";
import db, { auditLogger } from "@repo/db/client";
import { authOptions } from "../auth";
import { verifyOTP } from "../redis/otp";

export type VerifyEmailOtpResult =
  | { success: true }
  | {
      success: false;
      errorCode: "UNAUTHENTICATED" | "CODE_REQUIRED" | "INVALID_OR_EXPIRED" | "TOO_MANY_ATTEMPTS" | "INTERNAL_ERROR";
      message: string;
      remaining?: number;
    };

export async function verifyEmailOtp(
  code: string
): Promise<VerifyEmailOtpResult> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { success: false, errorCode: "UNAUTHENTICATED", message: "Not signed in." };

  const trimmed = (code ?? "").trim();
  if (!trimmed || !/^\d{6}$/.test(trimmed)) {
    return { success: false, errorCode: "CODE_REQUIRED", message: "Enter a valid 6-digit code." };
  }

  try {
    const { success, remaining } = await verifyOTP("email:verify", userId, trimmed);

    if (!success) {
      if (remaining === 0) {
        return { success: false, errorCode: "TOO_MANY_ATTEMPTS", message: "Too many attempts. Request a new code.", remaining: 0 };
      }
      return { success: false, errorCode: "INVALID_OR_EXPIRED", message: "Invalid or expired code.", remaining };
    }

    const me = await db.user.findUnique({
      where: { id: Number(userId) },
      select: { email: true, emailVerified: true },
    });

    if (!me || me.emailVerified) {
      return { success: true };
    }

    await db.user.update({
      where: { id: Number(userId) },
      data: { emailVerified: true },
    });

    await auditLogger.createAuditLog({
      userId: Number(userId),
      action: "EMAIL_VERIFIED",
      entityType: "Email Verification",
      metadata: { email: me.email },
      newValue: { verified: true },
    });

    return { success: true };
  } catch {
    return { success: false, errorCode: "INTERNAL_ERROR", message: "Something went wrong." };
  }
}
