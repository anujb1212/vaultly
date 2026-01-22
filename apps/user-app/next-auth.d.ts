import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    phone?: string | null;
    email?: string | null;
    emailVerified?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      emailVerified?: boolean;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    phone?: string | null;
    email?: string | null;
    emailVerified?: boolean;
  }
}
