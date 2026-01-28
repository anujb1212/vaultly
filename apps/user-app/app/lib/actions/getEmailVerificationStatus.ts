"use server";

import { getServerSession } from "next-auth";
import db from "@repo/db/client";
import { authOptions } from "../auth";

export type GetEmailVerificationStatusResult =
    | { success: true; email: string | null; isVerified: boolean }
    | { success: false; errorCode: "UNAUTHENTICATED" | "INTERNAL_ERROR"; message: string };

export async function getEmailVerificationStatus(): Promise<GetEmailVerificationStatusResult> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) return {
        success: false,
        errorCode: "UNAUTHENTICATED",
        message: "Not signed in."
    };

    try {
        const me = await db.user.findUnique({
            where: { id: Number(userId) },
            select: { email: true, emailVerified: true },
        });

        return { success: true, email: me?.email ?? null, isVerified: me?.emailVerified ?? false };
    } catch {
        return { success: false, errorCode: "INTERNAL_ERROR", message: "Failed to load email status." };
    }
}
