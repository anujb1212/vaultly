"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";

export async function p2pTransfer(to: string, amount: number) {
    const session = await getServerSession(authOptions);
    const sender = session?.user?.id;
    if (!sender) {
        return {
            message: "Error while sending"
        }
    }
    const receiver = await prisma.user.findFirst({
        where: {
            number: to
        }
    });

    if (!receiver) {
        return {
            message: "User not found"
        }
    }
    await prisma.$transaction(async (tx) => {
        const fromBalance = await tx.balance.findUnique({
            where: { userId: Number(sender) },
        });
        if (!fromBalance || fromBalance.amount < amount) {
            throw new Error('Insufficient Balance');
        }

        await tx.balance.update({
            where: { userId: Number(sender) },
            data: { amount: { decrement: amount } },
        });

        await tx.balance.update({
            where: { userId: receiver.id },
            data: { amount: { increment: amount } },
        });
    });
}