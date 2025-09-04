"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";

export async function createOnRampTxn(amount: number, provider: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.user?.id) {
        return {
            message: "Unauthenticated request"
        }
    }
    const dummyToken = crypto.randomUUID()
    await prisma.onRampTransaction.create({
        data: {
            provider,
            userId: Number(session?.user?.id),
            amount: amount,
            status: "Processing",
            startTime: new Date(),
            token: dummyToken               // like a txn ID
        }
    })
    return {
        message: "On Ramp Transaction created successfully"
    }
}