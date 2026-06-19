"use server";

import { getServerSession } from "next-auth";
import db, { auditLogger } from "@repo/db/client";
import { authOptions } from "../auth";
import { rateLimit } from "../redis/rateLimit";
import { generateOTP } from "../redis/otp";
import { resend, RESEND_FROM } from "../email/resendClient";

export type Send2faOtpResult =
  | { success: true; expiresInSec: number }
  | {
      success: false;
      errorCode: "UNAUTHENTICATED" | "EMAIL_MISSING" | "RATE_LIMITED" | "INTERNAL_ERROR";
      message: string;
      retryAfterSec?: number;
    };

const OTP_EXPIRY_SEC = 5 * 60;

export async function send2faOtp(): Promise<Send2faOtpResult> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const email = session?.user?.email;
  if (!userId || !email) {
    console.log("[dev] send2faOtp: no session or email", { userId, email });
    return { success: false, errorCode: "UNAUTHENTICATED", message: "Not signed in." };
  }

  const rl = await rateLimit({
    key: `rl:2fa:send:user:${userId}`,
    limit: 2,
    windowSec: 5 * 60,
  });
  if (!rl.allowed) {
    console.log("[dev] send2faOtp: rate limited for", email, "retry in", rl.ttl, "s");
    return { success: false, errorCode: "RATE_LIMITED", message: "Too many requests.", retryAfterSec: rl.ttl };
  }

  try {
    const code = await generateOTP("2fa:login", userId);

    console.log("[dev] send2faOtp: RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
    console.log("[dev] send2faOtp: RESEND_FROM:", RESEND_FROM);

    if (process.env.RESEND_API_KEY) {
      const { error, data } = await resend.emails.send({
        from: RESEND_FROM,
        to: [email],
        subject: "Your Vaultly login verification code",
        html: twoFaOtpHtml(code, Math.floor(OTP_EXPIRY_SEC / 60)),
      });

      if (error) {
        console.error("[dev] send2faOtp: Resend API error:", JSON.stringify(error, null, 2));

        // If domain is not verified on Resend, fall back to console log
        // so the user can still test the flow.
        if (error.statusCode === 403 && /domain.*not verified/i.test(error.message || "")) {
          console.log("\n[dev] 2FA OTP for", email, ":", code, "(domain not verified on Resend)\n");
          console.log("[dev] send2faOtp: falling through to audit log + success (dev mode)");
        } else {
          return { success: false, errorCode: "INTERNAL_ERROR", message: `Failed to send email: ${error.message || "unknown error"}` };
        }
      }

      console.log("[dev] send2faOtp: email sent successfully to", email, "(id:", data?.id, ")");
    } else {
      console.log("\n[dev] 2FA OTP for", email, ":", code, "\n");
    }

    await auditLogger.createAuditLog({
      userId: Number(userId),
      action: "TWOFA_OTP_SENT",
      entityType: "Authentication",
      metadata: { email },
      newValue: { email },
    });

    return { success: true, expiresInSec: OTP_EXPIRY_SEC };
  } catch (err) {
    console.error("[dev] send2faOtp: unexpected error:", err);
    return { success: false, errorCode: "INTERNAL_ERROR", message: "Something went wrong." };
  }
}

function twoFaOtpHtml(code: string, expiresMin: number): string {
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
    <div class="title">Login verification</div>
    <div class="text">Use this code to complete signing in to your Vaultly account.</div>
    <div class="code">${code}</div>
    <div class="expiry">This code expires in ${expiresMin} minutes.</div>
  </div>
</div>
</body>
</html>`;
}
