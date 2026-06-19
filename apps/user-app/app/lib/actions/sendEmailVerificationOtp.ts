"use server";

import { getServerSession } from "next-auth";
import db, { auditLogger } from "@repo/db/client";
import { authOptions } from "../auth";
import { rateLimit } from "../redis/rateLimit";
import { generateOTP } from "../redis/otp";
import { resend, RESEND_FROM } from "../email/resendClient";

export type SendEmailVerificationOtpResult =
  | { success: true; expiresInSec: number }
  | {
      success: false;
      errorCode:
        | "UNAUTHENTICATED"
        | "EMAIL_REQUIRED"
        | "INVALID_EMAIL"
        | "EMAIL_TAKEN"
        | "ALREADY_VERIFIED"
        | "RATE_LIMITED"
        | "INTERNAL_ERROR";
      message: string;
      retryAfterSec?: number;
    };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const OTP_EXPIRY_SEC = 5 * 60;

export async function sendEmailVerificationOtp(
  inputEmail?: string
): Promise<SendEmailVerificationOtpResult> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { success: false, errorCode: "UNAUTHENTICATED", message: "Please sign in." };

  const burst = await rateLimit({
    key: `rl:email:verify:send:burst:user:${userId}`,
    limit: 1,
    windowSec: 60,
  });
  if (!burst.allowed) {
    return {
      success: false,
      errorCode: "RATE_LIMITED",
      message: "Please wait before requesting another code.",
      retryAfterSec: burst.ttl,
    };
  }

  const hourly = await rateLimit({
    key: `rl:email:verify:send:user:${userId}`,
    limit: 3,
    windowSec: 60 * 60,
  });
  if (!hourly.allowed) {
    return {
      success: false,
      errorCode: "RATE_LIMITED",
      message: "Too many requests. Try later.",
      retryAfterSec: hourly.ttl,
    };
  }

  try {
    const me = await db.user.findUnique({
      where: { id: Number(userId) },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!me) return { success: false, errorCode: "UNAUTHENTICATED", message: "Session invalid." };
    if (me.emailVerified) {
      return { success: false, errorCode: "ALREADY_VERIFIED", message: "Email already verified." };
    }

    const raw = (inputEmail ?? me.email ?? "").trim();
    if (!raw) return { success: false, errorCode: "EMAIL_REQUIRED", message: "Please enter your email." };

    const email = normalizeEmail(raw);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return { success: false, errorCode: "INVALID_EMAIL", message: "Invalid email address." };

    const conflict = await db.user.findFirst({
      where: { email, id: { not: Number(userId) } },
      select: { id: true },
    });
    if (conflict) return { success: false, errorCode: "EMAIL_TAKEN", message: "Email already in use." };

    await db.user.update({
      where: { id: Number(userId) },
      data: { email, emailVerified: false },
    });

    const code = await generateOTP("email:verify", userId);

    console.log("[dev] sendEmailVerificationOtp: RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
    console.log("[dev] sendEmailVerificationOtp: RESEND_FROM:", process.env.RESEND_FROM || "default (onboarding@resend.dev)");

    if (process.env.RESEND_API_KEY) {
      const { error, data } = await resend.emails.send({
        from: RESEND_FROM,
        to: [email],
        subject: "Your Vaultly verification code",
        html: emailOtpHtml(code, OTP_EXPIRY_SEC),
      });

      if (error) {
        console.error("[dev] sendEmailVerificationOtp: Resend API error:", JSON.stringify(error, null, 2));

        if (error.statusCode === 403 && /domain.*not verified/i.test(error.message || "")) {
          console.log("\n[dev] Email OTP for", email, ":", code, "(domain not verified on Resend)\n");
          console.log("[dev] sendEmailVerificationOtp: falling through to audit log + success (dev mode)");
        } else {
          return { success: false, errorCode: "INTERNAL_ERROR", message: `Failed to send email: ${error.message || "unknown error"}` };
        }
      }

      console.log("[dev] sendEmailVerificationOtp: email sent to", email, "(id:", data?.id, ")");
    } else {
      console.log("\n[dev] Email Verification OTP for", email, ":", code, "\n");
    }

    await auditLogger.createAuditLog({
      userId: Number(userId),
      action: "EMAIL_VERIFICATION_OTP_SENT",
      entityType: "Email Verification",
      metadata: { email },
      newValue: { email },
    });

    return { success: true, expiresInSec: OTP_EXPIRY_SEC };
  } catch (err) {
    console.error("[dev] sendEmailVerificationOtp: unexpected error:", err);
    return { success: false, errorCode: "INTERNAL_ERROR", message: "Something went wrong." };
  }
}

function emailOtpHtml(code: string, expiresMin: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 0; }
  .container { max-width: 480px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; padding: 40px; }
  .logo { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 24px; }
  .title { font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 12px; }
  .text { font-size: 15px; line-height: 24px; color: #4b5563; margin: 0 0 24px; }
  .code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111827; background: #f3f4f6; border-radius: 8px; padding: 16px 32px; display: inline-block; margin-bottom: 24px; }
  .expiry { font-size: 13px; color: #9ca3af; }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="logo">Vaultly</div>
    <div class="title">Verify your email address</div>
    <div class="text">Use the code below to verify your email for your Vaultly account.</div>
    <div class="code">${code}</div>
    <div class="expiry">This code expires in ${expiresMin} minutes.</div>
  </div>
</div>
</body>
</html>`;
}
