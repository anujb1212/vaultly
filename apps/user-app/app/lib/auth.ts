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
                            email: existingUser.number,
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
                        email: user.number,
                    };
                } catch (e) {
                    console.error(e);
                    return null;
                }
            },
        }),
    ],
    secret: process.env.JWT_SECRET || "secret",
    callbacks: {
        async jwt({
            token,
            user,
        }: {
            token: JWT;
            user?: User | null;
        }): Promise<JWT> {
            if (user) {
                token.id = user.id as string;
            }
            return token;
        },
        async session({
            session,
            token,
        }: {
            session: Session;
            token: JWT;
        }): Promise<Session> {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
};
