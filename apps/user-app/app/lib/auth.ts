import "server-only";

import db, { auditLogger } from "@repo/db/client";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { NextAuthOptions, User } from "next-auth";

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
                if (!credentials) return null;

                const existingUser = await db.user.findFirst({
                    where: { number: credentials.phone },
                });

                if (existingUser) {
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
                        emailVerified: false,
                    } as any;
                }

                try {
                    const hashedPassword = await bcrypt.hash(credentials.password, 10);
                    const user = await db.user.create({
                        data: {
                            number: credentials.phone,
                            password: hashedPassword,
                        },
                    });

                    return {
                        id: user.id.toString(),
                        name: user.name,
                        email: user.email ?? null,
                        phone: user.number,
                        emailVerified: false,
                    } as any;
                } catch (e) {
                    console.error(e);
                    return null;
                }
            },
        }),
    ],

    secret: process.env.JWT_SECRET || "secret",
    pages: { signIn: "/signin" },

    session: { strategy: "jwt" },

    callbacks: {
        async jwt({ token, user }) {
            if (user?.id) {
                (token as any).userId = user.id;
                (token as any).phone = (user as any).phone ?? null;
                (token as any).email = (user as any).email ?? null;
                (token as any).emailVerified = (user as any).emailVerified ?? false;

                const created = await db.userSession.create({
                    data: {
                        userId: Number(user.id),
                        lastSeenAt: new Date(),
                    },
                    select: { id: true },
                });

                (token as any).sessionId = created.id;
                (token as any).lastSeenSyncAt = Math.floor(Date.now() / 1000);

                await auditLogger.createAuditLog({
                    userId: Number(user.id),
                    action: "SESSION_CREATED",
                    entityType: "UserSession",
                    newValue: { sessionId: created.id },
                    metadata: { sessionId: created.id },
                });

                return token;
            }

            const userIdRaw = (token as any).userId;
            const sessionIdRaw = (token as any).sessionId;

            if (userIdRaw && sessionIdRaw) {
                const userId = Number(userIdRaw);
                const sessionId = String(sessionIdRaw);

                const s = await db.userSession.findFirst({
                    where: { id: sessionId, userId },
                    select: { revokedAt: true, expiresAt: true },
                });

                const now = new Date();

                if (!s || s.revokedAt || (s.expiresAt && s.expiresAt <= now)) {
                    delete (token as any).userId;
                    delete (token as any).sessionId;
                    return token;
                }

                const nowSec = Math.floor(Date.now() / 1000);
                const lastSync =
                    typeof (token as any).lastSeenSyncAt === "number" ? (token as any).lastSeenSyncAt : 0;

                if (nowSec - lastSync >= LAST_SEEN_SYNC_SEC) {
                    await db.userSession.update({
                        where: { id: sessionId },
                        data: { lastSeenAt: new Date() },
                    });
                    (token as any).lastSeenSyncAt = nowSec;
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = ((token as any).userId as string) ?? undefined;
                (session.user as any).phone = (token as any).phone ?? null;
                (session.user as any).email = (token as any).email ?? null;
                (session.user as any).emailVerified = (token as any).emailVerified ?? false;
            }

            (session as any).sessionId = (token as any).sessionId ?? null;

            return session;
        },
    },
};
