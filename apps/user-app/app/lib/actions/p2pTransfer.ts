"use server";

import prisma, { auditLogger, idempotencyManager, postP2PLedger } from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { revalidatePath } from "next/cache";
import { rateLimit } from "../rateLimit";
import { verifyMpinOrThrow, VerifyMpinError } from "../security/verifyMpin";

type P2PTransferResult =
    | { success: true; message: string }
    | {
        success: false;
        message: string;
        retryAfterSec?: number;
        errorCode?:
        | "UNAUTHENTICATED"
        | "RATE_LIMITED"
        | "PIN_REQUIRED"
        | "PIN_NOT_SET"
        | "PIN_LOCKED"
        | "PIN_INVALID"
        | "UNKNOWN";
    };

export async function p2pTransfer(
    to: string,
    amount: number,
    idempotencyKey: string,
    mpin?: string
): Promise<P2PTransferResult> {
    const session = await getServerSession(authOptions);
    const sender = session?.user?.id;

    if (!sender) {
        return { success: false, message: "Error while sending", errorCode: "UNAUTHENTICATED" };
    }

    const senderId = Number(sender);
    if (!Number.isFinite(senderId) || senderId <= 0) {
        return { success: false, message: "Unauthenticated request", errorCode: "UNAUTHENTICATED" };
    }

    if (typeof to !== "string" || !/^\d{10}$/.test(to)) {
        return { success: false, message: "Invalid receiver number", errorCode: "UNKNOWN" };
    }

    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
        return { success: false, message: "Invalid amount", errorCode: "UNKNOWN" };
    }

    const rl = await rateLimit({
        key: `rl:p2p:create:user:${senderId}`,
        limit: 10,
        windowSec: 60,
    });

    if (!rl.allowed) {
        return {
            success: false,
            message: `Too many requests. Try again in ${rl.ttl}s`,
            retryAfterSec: rl.ttl,
            errorCode: "RATE_LIMITED",
        };
    }

    try {
        await verifyMpinOrThrow({ userId: senderId, mpin, context: { action: "P2P_TRANSFER" } });
    } catch (e) {
        if (e instanceof VerifyMpinError) {
            return {
                success: false,
                message: e.message,
                retryAfterSec: e.retryAfterSec,
                errorCode: e.code,
            };
        }
        return { success: false, message: "PIN verification failed", errorCode: "UNKNOWN" };
    }

    const idempotencyCheck = await idempotencyManager.checkAndStore(idempotencyKey, senderId, "P2P_TRANSFER");

    if (idempotencyCheck?.exists && idempotencyCheck.response != null) {
        return idempotencyCheck.response as P2PTransferResult;
    }

    const receiver = await prisma.user.findFirst({
        where: { number: to },
    });

    if (!receiver) {
        const errorResult: P2PTransferResult = { success: false, message: "User not found", errorCode: "UNKNOWN" };
        await idempotencyManager.updateResponse(idempotencyKey, errorResult);
        return errorResult;
    }

    if (receiver.id === senderId) {
        const errorResult: P2PTransferResult = { success: false, message: "Cannot transfer to self", errorCode: "UNKNOWN" };
        await idempotencyManager.updateResponse(idempotencyKey, errorResult);
        return errorResult;
    }

    try {
        const result = await prisma.$transaction(
            async (tx) => {
                await tx.balance.upsert({
                    where: { userId: senderId },
                    update: {},
                    create: { userId: senderId, amount: 0, locked: 0 },
                });

                await tx.balance.upsert({
                    where: { userId: receiver.id },
                    update: {},
                    create: { userId: receiver.id, amount: 0, locked: 0 },
                });

                const [firstId, secondId] = [senderId, receiver.id].sort((a, b) => a - b);

                await tx.$queryRaw`
          SELECT * FROM "Balance"
          WHERE "userId" IN (${firstId}, ${secondId})
          FOR UPDATE
        `;

                const fromBalance = await tx.balance.findUnique({ where: { userId: senderId } });
                if (!fromBalance || fromBalance.amount < amount) throw new Error("Insufficient Balance");

                const toBalance = await tx.balance.findUnique({ where: { userId: receiver.id } });

                const ledgerTxn = await postP2PLedger({
                    tx,
                    idempotencyKey,
                    senderId,
                    receiverId: receiver.id,
                    amount,
                });

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
                            ledgerTransactionId: ledgerTxn.id,
                            senderBalanceBefore: fromBalance.amount,
                            senderBalanceAfter: updatedSenderBalance.amount,
                            receiverBalanceBefore: toBalance?.amount ?? 0,
                            receiverBalanceAfter: updatedReceiverBalance.amount,
                        },
                    },
                });

                await auditLogger.logBalanceChange(
                    senderId,
                    fromBalance.amount,
                    updatedSenderBalance.amount,
                    "P2P_TRANSFER_DEBIT",
                    { transferId: transferRecord.id, receiverId: receiver.id, receiverNumber: receiver.number },
                    tx
                );

                await auditLogger.logBalanceChange(
                    receiver.id,
                    toBalance?.amount ?? 0,
                    updatedReceiverBalance.amount,
                    "P2P_TRANSFER_CREDIT",
                    { transferId: transferRecord.id, senderId, receiverNumber: receiver.number },
                    tx
                );

                await auditLogger.logTransfer(
                    senderId,
                    transferRecord.id,
                    { amount, to: receiver.number },
                    { idempotencyKey },
                    tx
                );

                return { success: true, message: "Transfer successful" } as const;
            },
            { timeout: 10000, maxWait: 5000 }
        );

        await idempotencyManager.updateResponse(idempotencyKey, result);

        revalidatePath("/dashboard");
        revalidatePath("/p2ptransfer");

        return result;
    } catch (error: any) {
        console.error("P2P transfer error:", error);

        const errorResult: P2PTransferResult = {
            success: false,
            message: error.message || "Transfer failed",
            errorCode: "UNKNOWN",
        };

        try {
            await idempotencyManager.updateResponse(idempotencyKey, errorResult);
        } catch (err) {
            console.error("Failed to update idempotency record:", err);
        }

        return errorResult;
    }
}
