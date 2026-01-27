import "server-only";

import db, { auditLogger } from "@repo/db/client";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import type { NextAuthOptions, User } from "next-auth";

const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;
const LAST_SEEN_SYNC_SEC = 5 * 60;

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                phone: {
                    label: "Phone number",
                    type: "text",
                    placeholder: "1231231231",
                    required: true,
                },
                password: { label: "Password", type: "password", required: true },
            },

            async authorize(
                credentials: Record<"phone" | "password", string> | undefined
            ): Promise<User | null> {
                if (!credentials?.phone || !credentials?.password) return null;

                const existingUser = await db.user.findFirst({
                    where: { number: credentials.phone },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        number: true,
                        password: true,
                        emailVerified: true,
                        transactionPin: { select: { userId: true } },
                    },
                });

                if (!existingUser) return null;

                const passwordValidation = await bcrypt.compare(
                    credentials.password,
                    existingUser.password
                );
                if (!passwordValidation) return null;

                return {
                    id: existingUser.id.toString(),
                    name: existingUser.name,
                    email: existingUser.email ?? null,
                    phone: existingUser.number,
                    emailVerified: Boolean(existingUser.emailVerified),
                    pinIsSet: Boolean(existingUser.transactionPin?.userId),
                } as any;
            },
        }),
    ],

    secret: process.env.JWT_SECRET || "secret",
    pages: { signIn: "/signin" },

    session: {
        strategy: "jwt",
        maxAge: SESSION_MAX_AGE_SEC,
    },

    callbacks: {
        async jwt({ token, user, trigger }) {
            const now = new Date();
            const nowSec = Math.floor(Date.now() / 1000);

            if (user?.id) {
                const userId = String(user.id);

                (token as any).userId = userId;
                (token as any).phone = (user as any).phone ?? null;
                (token as any).email = (user as any).email ?? null;
                (token as any).emailVerified = (user as any).emailVerified ?? false;
                (token as any).pinIsSet = (user as any).pinIsSet ?? false;

                const created = await db.userSession.create({
                    data: {
                        userId: Number(userId),
                        createdAt: now,
                        lastSeenAt: now,
                        expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_SEC * 1000),
                    },
                    select: { id: true },
                });

                (token as any).sessionId = created.id;
                (token as any).lastSeenSyncAt = nowSec;

                await auditLogger.createAuditLog({
                    userId: Number(userId),
                    action: "SESSION_CREATED",
                    entityType: "User Session",
                    newValue: { sessionId: created.id },
                    metadata: { sessionId: created.id },
                });

                return token;
            }

            const userIdRaw = (token as any).userId;
            const sessionIdRaw = (token as any).sessionId;

            if (!userIdRaw || !sessionIdRaw) return token;

            const userIdNum = Number(userIdRaw);
            const sessionId = String(sessionIdRaw);

            if (!Number.isFinite(userIdNum)) {
                delete (token as any).userId;
                delete (token as any).sessionId;
                delete (token as any).phone;
                delete (token as any).email;
                delete (token as any).emailVerified;
                delete (token as any).pinIsSet;
                delete (token as any).lastSeenSyncAt;
                return token;
            }

            const s = await db.userSession.findFirst({
                where: { id: sessionId, userId: userIdNum },
                select: { revokedAt: true, expiresAt: true },
            });

            if (!s || s.revokedAt || (s.expiresAt && s.expiresAt <= now)) {
                delete (token as any).userId;
                delete (token as any).sessionId;
                delete (token as any).phone;
                delete (token as any).email;
                delete (token as any).emailVerified;
                delete (token as any).pinIsSet;
                delete (token as any).lastSeenSyncAt;
                return token;
            }

            const lastSync =
                typeof (token as any).lastSeenSyncAt === "number"
                    ? (token as any).lastSeenSyncAt
                    : 0;

            if (nowSec - lastSync >= LAST_SEEN_SYNC_SEC) {
                await db.userSession.update({
                    where: { id: sessionId },
                    data: { lastSeenAt: now },
                });
                (token as any).lastSeenSyncAt = nowSec;
            }

            if (trigger === "update") {
                const fresh = await db.user.findUnique({
                    where: { id: userIdNum },
                    select: {
                        email: true,
                        emailVerified: true,
                        transactionPin: { select: { userId: true } },
                    },
                });

                (token as any).email = fresh?.email ?? (token as any).email ?? null;
                (token as any).emailVerified = Boolean(fresh?.emailVerified);
                (token as any).pinIsSet = Boolean(fresh?.transactionPin?.userId);
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = ((token as any).userId as string) ?? undefined;
                (session.user as any).phone = (token as any).phone ?? null;
                (session.user as any).email = (token as any).email ?? null;
                (session.user as any).emailVerified = (token as any).emailVerified ?? false;
                (session.user as any).pinIsSet = (token as any).pinIsSet ?? false;
            }

            (session as any).sessionId = (token as any).sessionId ?? null;
            return session;
        },
    },
};
