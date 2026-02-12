"use server";

import { getServerSession } from "next-auth";
import crypto from "crypto";
import db, { auditLogger } from "@repo/db/client";
import { authOptions } from "../auth";

import { rateLimit } from "../redis/rateLimit";
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

        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="utf-8">
            <title>Verify your email address</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; background-color: #f9fafb; margin: 0; padding: 0; }
                .container { max-width: 580px; margin: 0 auto; padding: 40px 20px; }
                .card { background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; padding: 40px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05); }
                .logo { font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.5px; margin-bottom: 24px; }
                .h1 { font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 16px; }
                .p { font-size: 15px; line-height: 24px; color: #4b5563; margin: 0 0 24px; }
                .btn { display: inline-block; background-color: #000000; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; }
                .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; text-align: center; }
                .link { color: #6b7280; text-decoration: none; }
                .divider { border-top: 1px solid #e5e7eb; margin: 32px 0 24px; }
                .subtext { font-size: 12px; color: #6b7280; word-break: break-all; }
            </style>
            </head>
            <body>
            <div class="container">
                <div class="card">
                <div class="logo">${appName}</div>
                <div class="h1">Verify your email address</div>
                <div class="p">
                    Please confirm that you want to use this as your ${appName} account email address. Once it's done, you will be able to start buying and selling.
                </div>
                <div style="margin-bottom: 32px;">
                    <a href="${verifyUrl}" class="btn">Verify my email</a>
                </div>
                <div class="p" style="margin-bottom: 0;">
                    Or paste this link into your browser:
                </div>
                <div class="subtext" style="margin-top: 8px;">
                    <a href="${verifyUrl}" class="link">${verifyUrl}</a>
                </div>
                <div class="divider"></div>
                <div class="subtext">
                    This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.
                </div>
                </div>
                <div class="footer">
                &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
                </div>
            </div>
            </body>
            </html>
            `;

        const { error } = await resend.emails.send({
            from: RESEND_FROM,
            to: [email],
            subject: "Verify your email for Vaultly",
            html: emailHtml,
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
