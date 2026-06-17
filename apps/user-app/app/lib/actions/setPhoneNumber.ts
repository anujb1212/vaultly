"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";
import { rateLimit } from "../redis/rateLimit";
import { revalidatePath } from "next/cache";

type SetPhoneResult =
    | { success: true; message: string }
    | {
        success: false;
        message: string;
        retryAfterSec?: number;
        errorCode: "UNAUTHENTICATED" | "INVALID_INPUT" | "RATE_LIMITED" | "PHONE_IN_USE" | "UNKNOWN";
    };

export async function setPhoneNumber(phone: string): Promise<SetPhoneResult> {
    const session = await getServerSession(authOptions);
    const userIdRaw = session?.user?.id;

    if (!userIdRaw) {
        return { success: false, message: "Unauthenticated", errorCode: "UNAUTHENTICATED" };
    }

    const userId = Number(userIdRaw);
    if (!Number.isFinite(userId) || userId <= 0) {
        return { success: false, message: "Unauthenticated", errorCode: "UNAUTHENTICATED" };
    }

    if (typeof phone !== "string" || !/^\d{10}$/.test(phone)) {
        return { success: false, message: "Phone number must be exactly 10 digits", errorCode: "INVALID_INPUT" };
    }

    const rl = await rateLimit({
        key: `rl:phone:set:user:${userId}`,
        limit: 3,
        windowSec: 3600,
    });

    if (!rl.allowed) {
        return {
            success: false,
            message: `Too many attempts. Retry after ${rl.ttl}s`,
            retryAfterSec: rl.ttl,
            errorCode: "RATE_LIMITED",
        };
    }

    const existing = await prisma.user.findFirst({
        where: { number: phone, id: { not: userId } },
        select: { id: true },
    });

    if (existing) {
        return { success: false, message: "Phone number already in use", errorCode: "PHONE_IN_USE" };
    }

    await prisma.user.update({
        where: { id: userId },
        data: { number: phone },
    });

    revalidatePath("/complete-profile");

    return { success: true, message: "Phone number added" };
}
