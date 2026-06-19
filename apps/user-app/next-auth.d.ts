import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    phone?: string | null;
    email?: string | null;
    emailVerified?: boolean;
    pinIsSet?: boolean;
    isAdmin?: boolean;
    image?: string | null;
    twoFactorEnabled?: boolean;
    is2FAVerified?: boolean;
  }

  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      emailVerified?: boolean;
      pinIsSet?: boolean;
      isAdmin?: boolean;
      image?: string | null;
      twoFactorEnabled?: boolean;
      is2FAVerified?: boolean;
    } & DefaultSession["user"];

    sessionId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    phone?: string | null;
    email?: string | null;
    emailVerified?: boolean;
    pinIsSet?: boolean;
    isAdmin?: boolean;
    sessionId?: string;
    lastSeenSyncAt?: number;
    twoFactorEnabled?: boolean;
    is2FAVerified?: boolean;
  }
}
