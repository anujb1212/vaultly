"use server";

import prisma, { auditLogger, idempotencyManager } from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { revalidatePath } from "next/cache";

export async function p2pTransfer(
    to: string,
    amount: number,
    idempotencyKey: string
) {
    const session = await getServerSession(authOptions);
    const sender = session?.user?.id;

    if (!sender) {
        return {
            success: false,
            message: "Error while sending",
        };
    }

    const senderId = Number(sender)

    const idempotencyCheck = await idempotencyManager.checkAndStore(
        idempotencyKey,
        senderId,
        "P2P_TRANSFER"
    )

    if (idempotencyCheck?.exists) {
        return idempotencyCheck.response as {
            success: boolean;
            message: string;
        }
    }

    const receiver = await prisma.user.findFirst({
        where: {
            number: to
        },
    });

    if (!receiver) {
        const errorResult = {
            success: false,
            message: "User not found",
        };

        await idempotencyManager.updateResponse(idempotencyKey, errorResult);
        return errorResult;
    }

    if (receiver.id === senderId) {
        const errorResult = {
            success: false,
            message: "Cannot transfer to self",
        };

        await idempotencyManager.updateResponse(idempotencyKey, errorResult);
        return errorResult;
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const [firstId, secondId] = [senderId, receiver.id].sort((a, b) => a - b);

            await tx.$queryRaw`
                SELECT * FROM "Balance" 
                WHERE "userId" IN (${firstId}, ${secondId}) 
                FOR UPDATE`

            const fromBalance = await tx.balance.findUnique({
                where: { userId: senderId },
            });

            if (!fromBalance || fromBalance.amount < amount) {
                throw new Error("Insufficient Balance");
            }

            const toBalance = await tx.balance.findUnique({
                where: { userId: receiver.id },
            });

            if (!toBalance) {
                await tx.balance.create({
                    data: {
                        userId: receiver.id,
                        amount: 0,
                        locked: 0,
                    },
                });
            }

            const updatedSenderBalance = await tx.balance.update({
                where: { userId: senderId },
                data: { amount: { decrement: amount } },
            });

            const updatedReceiverBalance = await tx.balance.update({
                where: { userId: receiver.id },
                data: { amount: { increment: amount } },
            });

            const transferRecord = await tx.p2pTransfer.create({
                data: {
                    senderId,
                    receiverId: receiver.id,
                    amount,
                    timestamp: new Date(),
                    status: "SUCCESS",
                    metadata: {
                        idempotencyKey,
                        senderBalanceBefore: fromBalance.amount,
                        senderBalanceAfter: updatedSenderBalance.amount,
                        receiverBalanceBefore: toBalance?.amount ?? 0,
                        receiverBalanceAfter: updatedReceiverBalance.amount,
                    }
                },
            });

            await auditLogger.logBalanceChange(
                senderId,
                fromBalance.amount,
                updatedSenderBalance.amount,
                "P2P_TRANSFER_DEBIT",
                {
                    transferId: transferRecord.id,
                    receiverId: receiver.id,
                    receiverNumber: receiver.number,
                },
                tx
            )

            await auditLogger.logBalanceChange(
                receiver.id,
                toBalance?.amount ?? 0,
                updatedReceiverBalance.amount,
                "P2P_TRANSFER_CREDIT",
                {
                    transferId: transferRecord.id,
                    senderId: senderId,
                    senderNumber: to,
                },
                tx
            )

            await auditLogger.logTransfer(
                senderId,
                transferRecord.id,
                {
                    amount,
                    to: receiver.number,
                },
                {
                    idempotencyKey
                },
                tx
            )

            return {
                success: true,
                message: "Transfer successful",
            };
        }, {
            timeout: 10000,
            maxWait: 5000
        })

        await idempotencyManager.updateResponse(idempotencyKey, result)

        revalidatePath("/dashboard");
        revalidatePath("/p2ptransfer");

        return result;
    } catch (error: any) {
        console.error("P2P transfer error:", error);
        const errorResult = {
            success: false,
            message: error.message || "Transfer failed",
        };

        try {
            await idempotencyManager.updateResponse(idempotencyKey, errorResult)
        } catch (err) {
            console.error("Failed to update idempotency record:", err);
        }

        return errorResult;
    }
}