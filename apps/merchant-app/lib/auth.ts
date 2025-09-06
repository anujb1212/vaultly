import { NextAuthOptions, User, Account } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import db from "@repo/db/client";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn(params: { user: User; account: Account | null }): Promise<boolean> {
      const { user, account } = params;

      // Check user email exist and account is not null before using
      if (!user?.email || !account) return false;

      await db.merchant.upsert({
        select: { id: true },
        where: { email: user.email },
        create: {
          email: user.email,
          name: user.name ?? "",
          auth_type: account.provider === "google" ? "Google" : "Github",
        },
        update: {
          name: user.name ?? "",
          auth_type: account.provider === "google" ? "Google" : "Github",
        },
      });

      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "secret",
  debug: true,
};
