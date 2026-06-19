"use server";

import { getServerSession } from "next-auth";
import db, { auditLogger } from "@repo/db/client";
import { authOptions } from "../auth";
import { verifyOTP } from "../redis/otp";
import { redis } from "../redis/redis";

const VERIFIED_TTL_SEC = 5 * 60;

export type Verify2faResult =
  | { success: true }
  | {
      success: false;
      errorCode: "UNAUTHENTICATED" | "CODE_REQUIRED" | "INVALID_OR_EXPIRED" | "TOO_MANY_ATTEMPTS" | "INTERNAL_ERROR";
      message: string;
      remaining?: number;
    };

export async function verify2faLogin(code: string): Promise<Verify2faResult> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { success: false, errorCode: "UNAUTHENTICATED", message: "Not signed in." };

  const trimmed = (code ?? "").trim();
  if (!trimmed || !/^\d{6}$/.test(trimmed)) {
    return { success: false, errorCode: "CODE_REQUIRED", message: "Enter a valid 6-digit code." };
  }

  try {
    const { success, remaining } = await verifyOTP("2fa:login", userId, trimmed);

    if (!success) {
      if (remaining === 0) {
        return { success: false, errorCode: "TOO_MANY_ATTEMPTS", message: "Too many attempts. Request a new code.", remaining: 0 };
      }
      return { success: false, errorCode: "INVALID_OR_EXPIRED", message: "Invalid or expired code.", remaining };
    }

    await redis.setex(`2fa:verified:${userId}`, VERIFIED_TTL_SEC, "1");

    await auditLogger.createAuditLog({
      userId: Number(userId),
      action: "TWOFA_VERIFIED",
      entityType: "Authentication",
      metadata: {},
      newValue: { verified: true },
    });

    return { success: true };
  } catch {
    return { success: false, errorCode: "INTERNAL_ERROR", message: "Something went wrong." };
  }
}
