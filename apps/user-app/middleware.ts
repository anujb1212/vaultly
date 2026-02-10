import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/signin" },
  secret: process.env.JWT_SECRET || "secret",
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transfer/:path*",
    "/transactions/:path*",
    "/p2ptransfer/:path*",
    "/admin/:path"
  ],
};
