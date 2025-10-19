"use server";

import prisma from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { revalidatePath } from "next/cache";

export async function p2pTransfer(to: string, amount: number) {
    const session = await getServerSession(authOptions);
    const sender = session?.user?.id;

    if (!sender) {
        return {
            success: false,
            message: "Error while sending",
        };
    }

    const receiver = await prisma.user.findFirst({
        where: { number: to },
    });

    if (!receiver) {
        return {
            success: false,
            message: "User not found",
        };
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(
                sender
            )} FOR UPDATE`;

            const fromBalance = await tx.balance.findUnique({
                where: { userId: Number(sender) },
            });

            if (!fromBalance || fromBalance.amount < amount) {
                throw new Error("Insufficient Balance");
            }

            await tx.balance.update({
                where: { userId: Number(sender) },
                data: { amount: { decrement: amount } },
            });

            await tx.balance.update({
                where: { userId: receiver.id },
                data: { amount: { increment: amount } },
            });

            await tx.p2pTransfer.create({
                data: {
                    senderId: Number(sender),
                    receiverId: receiver.id,
                    amount,
                    timestamp: new Date(),
                },
            });
        });

        // Trigger cache revalidation
        revalidatePath("/dashboard");
        revalidatePath("/p2ptransfer");

        return {
            success: true,
            message: "Transfer successful",
        };
    } catch (error: any) {
        console.error("P2P transfer error:", error);
        return {
            success: false,
            message: error.message || "Transfer failed",
        };
    }
}
