import db from "@repo/db/client";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { NextAuthOptions, User, Session } from "next-auth";
import { JWT } from "next-auth/jwt";

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

                // Find user by phone
                const existingUser = await db.user.findFirst({
                    where: { number: credentials.phone },
                });

                if (existingUser) {
                    // Compare input password with hashed password
                    const passwordValidation = await bcrypt.compare(
                        credentials.password,
                        existingUser.password
                    );

                    if (passwordValidation) {
                        return {
                            id: existingUser.id.toString(),
                            name: existingUser.name,
                            email: existingUser.email ?? null,
                            phone: existingUser.number,
                            emailVerified: false
                        };
                    }
                    return null;
                }

                // If user does not exist, create new one
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
                    };
                } catch (e) {
                    console.error(e);
                    return null;
                }
            },
        }),
    ],
    secret: process.env.JWT_SECRET || "secret",
    pages: {
        signIn: "/signin",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as string;
                token.phone = (user as any).phone ?? null;
                token.email = user.email ?? null;
                token.emailVerified = (user as any).emailVerified ?? false;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.phone = (token as any).phone ?? null;
                session.user.email = (token as any).email ?? null;
                session.user.emailVerified = (token as any).emailVerified ?? false;
            }
            return session;
        }
    },
};
