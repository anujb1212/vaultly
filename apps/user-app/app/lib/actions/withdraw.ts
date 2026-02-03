"use server";

import prisma, {
    auditLogger,
    idempotencyManager,
    postOfframpLedger,
    emitSecurityEvent,
    bucketizeAmount,
} from "@repo/db/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { rateLimit } from "../redis/rateLimit";
import { verifyMpinOrThrow, VerifyMpinError } from "../security/verifyMpin";
import { revalidatePath } from "next/cache";

type WithdrawResult =
    | { success: true; message: string; token: string; transactionId: number }
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
        | "ACCOUNT_NOT_FOUND"
        | "INVALID_AMOUNT"
        | "INSUFFICIENT_BALANCE"
        | "UNKNOWN";
    };

export async function withdrawToLinkedAccount(
    linkedBankAccountId: number,
    amountPaise: number,
    idempotencyKey: string,
    mpin?: string
): Promise<WithdrawResult> {
    const session = await getServerSession(authOptions);
    const userRaw = session?.user?.id;

    if (!userRaw) return { success: false, message: "Unauthenticated request", errorCode: "UNAUTHENTICATED" };

    const userId = Number(userRaw);
    if (!Number.isFinite(userId) || userId <= 0) {
        return { success: false, message: "Unauthenticated request", errorCode: "UNAUTHENTICATED" };
    }

    if (!Number.isFinite(linkedBankAccountId) || linkedBankAccountId <= 0 || !Number.isInteger(linkedBankAccountId)) {
        return { success: false, message: "Invalid bank account selection", errorCode: "ACCOUNT_NOT_FOUND" };
    }

    if (!Number.isFinite(amountPaise) || amountPaise <= 0 || !Number.isInteger(amountPaise)) {
        return { success: false, message: "Invalid amount", errorCode: "INVALID_AMOUNT" };
    }

    if (amountPaise < 10_000) {
        return { success: false, message: "Minimum withdrawal is ₹100", errorCode: "INVALID_AMOUNT" };
    }

    const rl = await rateLimit({
        key: `rl:offramp:withdraw:user:${userId}`,
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
        await verifyMpinOrThrow({ userId, mpin, context: { action: "OFFRAMP_WITHDRAW" } });
    } catch (e) {
        if (e instanceof VerifyMpinError) {
            return { success: false, message: e.message, retryAfterSec: e.retryAfterSec, errorCode: e.code };
        }
        return { success: false, message: "PIN verification failed", errorCode: "UNKNOWN" };
    }

    const idempotencyCheck = await idempotencyManager.checkAndStore(idempotencyKey, userId, "OFFRAMP_WITHDRAW");
    if (idempotencyCheck?.exists && idempotencyCheck.response != null) {
        return idempotencyCheck.response as WithdrawResult;
    }

    const amountBucket = bucketizeAmount(amountPaise);

    try {
        await emitSecurityEvent(prisma as any, {
            userId,
            type: "OFFRAMP_INITIATED",
            source: "user-app",
            sourceId: `offramp:init:${idempotencyKey}`,
            metadata: { amountBucket },
        });
    } catch {
        // ignore
    }

    try {
        const result = await prisma.$transaction(
            async (tx) => {
                await tx.balance.upsert({
                    where: { userId },
                    update: {},
                    create: { userId, amount: 0, locked: 0 },
                });

                await tx.$queryRaw`
          SELECT * FROM "Balance"
          WHERE "userId" = ${userId}
          FOR UPDATE
        `;

                await tx.$queryRaw`
          SELECT * FROM "LinkedBankAccount"
          WHERE "id" = ${linkedBankAccountId} AND "userId" = ${userId}
          FOR UPDATE
        `;

                const wallet = await tx.balance.findUnique({ where: { userId } });
                if (!wallet) throw new Error("Wallet not initialized");

                const linked = await tx.linkedBankAccount.findFirst({
                    where: { id: linkedBankAccountId, userId },
                });

                if (!linked) {
                    return { success: false, message: "Linked account not found", errorCode: "ACCOUNT_NOT_FOUND" } as const;
                }

                const available = wallet.amount - wallet.locked;
                if (available < amountPaise) {
                    return { success: false, message: "Insufficient wallet balance", errorCode: "INSUFFICIENT_BALANCE" } as const;
                }

                const ledgerTxn = await postOfframpLedger({
                    tx,
                    idempotencyKey,
                    userId,
                    amount: amountPaise,
                    providerKey: String(linked.providerKey),
                    linkedBankAccountId: linked.id,
                });

                const updatedWallet = await tx.balance.update({
                    where: { userId },
                    data: { amount: { decrement: amountPaise } },
                });

                const updatedLinked = await tx.linkedBankAccount.update({
                    where: { id: linked.id },
                    data: { amount: { increment: amountPaise } },
                });

                const now = new Date();

                const offramp = await tx.offRampTransaction.create({
                    data: {
                        status: "Success",
                        token: idempotencyKey,
                        userId,
                        linkedBankAccountId: linked.id,
                        providerKey: linked.providerKey as any,
                        amount: amountPaise,
                        startTime: now,
                        completedAt: now,
                        metadata: {
                            idempotencyKey,
                            ledgerTransactionId: ledgerTxn.id,
                            walletBefore: { amount: wallet.amount, locked: wallet.locked },
                            walletAfter: { amount: updatedWallet.amount, locked: updatedWallet.locked },
                            linkedBefore: { amount: linked.amount, locked: linked.locked },
                            linkedAfter: { amount: updatedLinked.amount, locked: updatedLinked.locked },
                        },
                    },
                    select: { id: true, token: true },
                });

                await auditLogger.logBalanceChange(
                    userId,
                    wallet.amount,
                    updatedWallet.amount,
                    "OFFRAMP_WITHDRAW_DEBIT",
                    { offrampId: offramp.id, linkedBankAccountId: linked.id, providerKey: linked.providerKey },
                    tx as any
                );

                await auditLogger.createAuditLog(
                    {
                        userId,
                        action: "LINKED_ACCOUNT_CREDIT",
                        entityType: "LinkedBankAccount",
                        entityId: linked.id,
                        oldValue: { amount: linked.amount, locked: linked.locked },
                        newValue: { amount: updatedLinked.amount, locked: updatedLinked.locked },
                        metadata: { offrampId: offramp.id, providerKey: linked.providerKey },
                    },
                    tx as any
                );

                try {
                    await emitSecurityEvent(tx as any, {
                        userId,
                        type: "OFFRAMP_COMPLETED",
                        source: "user-app",
                        sourceId: `offramp:success:${offramp.id}`,
                        metadata: { amountBucket, linkedBankAccountId: linked.id },
                    });
                } catch {
                    // ignore
                }

                return { success: true, message: "Withdrawal successful", token: offramp.token, transactionId: offramp.id } as const;
            },
            { timeout: 20000, maxWait: 10000 }
        );

        await idempotencyManager.updateResponse(idempotencyKey, result);

        revalidatePath("/withdraw");
        revalidatePath("/dashboard");
        revalidatePath("/transactions");

        return result;
    } catch (error: any) {
        console.error("Offramp withdraw error:", error);

        try {
            await emitSecurityEvent(prisma as any, {
                userId,
                type: "OFFRAMP_FAILED",
                source: "user-app",
                sourceId: `offramp:fail:${idempotencyKey}`,
                metadata: { amountBucket, reason: "tx_failed" },
            });
        } catch {
            // ignore
        }

        const errorResult: WithdrawResult = {
            success: false,
            message: error?.message || "Withdrawal failed",
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
