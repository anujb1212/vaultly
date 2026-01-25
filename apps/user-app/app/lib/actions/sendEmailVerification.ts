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

        const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
        const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

        const { error } = await resend.emails.send({
            from: RESEND_FROM,
            to: [email],
            subject: "Verify your email for Vaultly",
            html: `
        <p>Click to verify your email:</p>
        <p><a href="${verifyUrl}">Verify email</a></p>
        <p>If you didn’t request this, ignore this email.</p>
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
