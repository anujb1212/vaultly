"use server";

import { getServerSession } from "next-auth";
import crypto from "crypto";
import db, { auditLogger } from "@repo/db/client";
import { authOptions } from "../auth";

import { rateLimit } from "../rateLimit";
import { resend, RESEND_FROM } from "../email/resendClient";

export type SendEmailVerificationResult =
    | { success: true }
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

export async function sendEmailVerification(inputEmail?: string): Promise<SendEmailVerificationResult> {
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
            message: "Please wait before requesting another email.",
            retryAfterSec: burst.ttl
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
            retryAfterSec: hourly.ttl
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

        await db.emailVerificationToken.updateMany({
            where: { userId: Number(userId), consumedAt: null },
            data: { consumedAt: new Date() },
        });

        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        await db.emailVerificationToken.create({
            data: {
                userId: Number(userId),
                email,
                tokenHash,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            },
        });

        const baseUrl = process.env.APP_URL ?? "http://localhost:3001";
        const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

        const appName = "Vaultly";

        const { error } = await resend.emails.send({
            from: RESEND_FROM,
            to: [email],
            subject: "Verify your email for Vaultly",
            html: `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#0b0b0f;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:14px;padding:20px;">
        <div style="font-size:14px;font-weight:700;color:#ffffff;letter-spacing:0.2px;">
          ${appName}
        </div>

        <div style="margin-top:14px;font-size:16px;font-weight:700;color:#ffffff;">
          Verify your email
        </div>

        <div style="margin-top:8px;font-size:13px;line-height:18px;color:#d1d5db;">
          Click the button below to verify your email address. This link expires in 24 hours.
        </div>

        <table cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
          <tr>
            <td bgcolor="#22c55e" style="border-radius:10px;">
              <a href="${verifyUrl}" target="_blank"
                style="display:inline-block;padding:10px 14px;border:1px solid #22c55e;border-radius:10px;font-size:13px;font-weight:700;color:#0b0b0f;text-decoration:none;">
                Verify email
              </a>
            </td>
          </tr>
        </table>

        <div style="margin-top:14px;font-size:12px;line-height:18px;color:#9ca3af;">
          If the button does not work, copy and paste this link into your browser:
        </div>

        <div style="margin-top:6px;font-size:12px;line-height:18px;color:#93c5fd;word-break:break-all;">
          ${verifyUrl}
        </div>

        <div style="margin-top:16px;font-size:12px;line-height:18px;color:#9ca3af;">
          If you did not request this, you can ignore this email.
        </div>
      </div>
    </div>
  `,
        });

        if (error) return { success: false, errorCode: "INTERNAL_ERROR", message: "Failed to send email." };

        await auditLogger.createAuditLog({
            userId: Number(userId),
            action: "EMAIL_VERIFICATION_SENT",
            entityType: "Email Verification",
            metadata: { email },
            newValue: { email }
        });

        return { success: true };
    } catch {
        return { success: false, errorCode: "INTERNAL_ERROR", message: "Something went wrong." };
    }
}
