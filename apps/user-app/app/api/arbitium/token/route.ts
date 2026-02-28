import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../lib/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const ARBITIUM_URL = process.env.NEXT_PUBLIC_ARBITIUM_URL ?? "http://localhost:5173";

export async function GET(req: NextRequest) {
    if (!JWT_SECRET) {
        return NextResponse.json(
            { error: "JWT_SECRET not configured" },
            { status: 500 }
        );
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        const signInUrl = new URL("/signin", req.url);
        signInUrl.searchParams.set(
            "callbackUrl",
            req.url
        );
        return NextResponse.redirect(signInUrl);
    }

    const redirectTo = req.nextUrl.searchParams.get("redirectTo") ?? ARBITIUM_URL;

    if (!redirectTo.startsWith(ARBITIUM_URL)) {
        return NextResponse.json(
            { error: "Invalid redirectTo origin" },
            { status: 400 }
        );
    }

    const token = jwt.sign(
        {
            userId: session.user.id,
            email: session.user.email ?? null,
            phone: session.user.phone ?? null,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    const destination = new URL(redirectTo);
    destination.searchParams.set("arbitium_token", token);

    return NextResponse.redirect(destination);
}
