"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";
import { revalidatePath } from "next/cache";

export async function createOnRampTxn(amount: number, provider: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user?.id) {
        return {
            success: false,
            message: "Unauthenticated request",
        };
    }

    try {
        const dummyToken = crypto.randomUUID();
        await prisma.onRampTransaction.create({
            data: {
                provider,
                userId: Number(session?.user?.id),
                amount: amount,
                status: "Processing",
                startTime: new Date(),
                token: dummyToken,
            },
        });

        // Trigger cache revalidation
        revalidatePath("/dashboard");
        revalidatePath("/transfer");

        return {
            success: true,
            message: "On Ramp Transaction created successfully",
        };
    } catch (error) {
        console.error("OnRamp transaction error:", error);
        return {
            success: false,
            message: "Failed to create transaction",
        };
    }
}