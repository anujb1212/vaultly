"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma, { auditLogger, idempotencyManager, emitSecurityEvent, bucketizeAmount } from "@repo/db/client";
import { revalidatePath } from "next/cache";
import { rateLimit } from "../rateLimit";
import crypto from "crypto";
import { verifyMpinOrThrow, VerifyMpinError } from "../security/verifyMpin";

type CreateOnRampTxnResult =
    | {
        success: true;
        message: string;
        token: string;
        userId: number;
        amount: number;
        provider: string;
    }
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

export async function createOnRampTxn(
    amount: number,
    provider: string,
    idempotencyKey: string,
    mpin?: string
): Promise<CreateOnRampTxnResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user?.id) {
        return {
            success: false,
            message: "Unauthenticated request",
            errorCode: "UNAUTHENTICATED",
        };
    }

    const userId = Number(session.user.id);
    if (!Number.isFinite(userId) || userId <= 0) {
        return {
            success: false,
            message: "Unauthenticated request",
            errorCode: "UNAUTHENTICATED",
        };
    }

    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
        return { success: false, message: "Invalid amount", errorCode: "UNKNOWN" };
    }

    if (typeof provider !== "string" || provider.length < 2 || provider.length > 40) {
        return { success: false, message: "Invalid provider", errorCode: "UNKNOWN" };
    }

    const rl = await rateLimit({
        key: `rl:onramp:create:user:${userId}`,
        limit: 5,
        windowSec: 60,
    });

    if (!rl.allowed) {
        return {
            success: false,
            message: `Too many requests. Retry after ${rl.ttl}s`,
            retryAfterSec: rl.ttl,
            errorCode: "RATE_LIMITED",
        };
    }

    try {
        await verifyMpinOrThrow({ userId, mpin, context: { action: "ONRAMP_CREATE" } });
    } catch (e) {
        if (e instanceof VerifyMpinError) {
            return { success: false, message: e.message, retryAfterSec: e.retryAfterSec, errorCode: e.code };
        }
        return { success: false, message: "PIN verification failed", errorCode: "UNKNOWN" };
    }

    const idempotencyCheck = await idempotencyManager.checkAndStore(idempotencyKey, userId, "ONRAMP_CREATE");

    if (idempotencyCheck?.exists && idempotencyCheck.response != null) {
        return idempotencyCheck.response as CreateOnRampTxnResult;
    }

    const amountBucket = bucketizeAmount(amount);

    try {
        const result = await prisma.$transaction(async (tx) => {
            const dummyToken = crypto.randomUUID();

            const onRampTxn = await tx.onRampTransaction.create({
                data: {
                    provider,
                    userId,
                    amount,
                    status: "Processing",
                    startTime: new Date(),
                    token: dummyToken,
                },
                select: { id: true, token: true, userId: true, amount: true, provider: true },
            });

            await auditLogger.createAuditLog(
                {
                    userId,
                    action: "ONRAMP_INITIATED",
                    entityType: "OnRampTransaction",
                    entityId: onRampTxn.id,
                    newValue: {
                        token: onRampTxn.token,
                        amount,
                        provider,
                        status: "Processing",
                    },
                    metadata: { idempotencyKey },
                },
                tx as any
            );

            try {
                await emitSecurityEvent(tx as any, {
                    userId,
                    type: "ONRAMP_INITIATED",
                    source: "user-app",
                    sourceId: `onramp:init:${idempotencyKey}`,
                    metadata: {
                        provider,
                        amountBucket,
                    },
                });
            } catch {
                // ignore
            }

            return {
                success: true,
                message: "On Ramp Transaction created successfully",
                token: onRampTxn.token,
                userId: onRampTxn.userId,
                amount: onRampTxn.amount,
                provider: onRampTxn.provider,
            } as const;
        });

        await idempotencyManager.updateResponse(idempotencyKey, result);

        revalidatePath("/dashboard");
        revalidatePath("/transfer");

        return result;
    } catch (error: any) {
        console.error("OnRamp transaction error:", error);

        try {
            await emitSecurityEvent(prisma as any, {
                userId,
                type: "ONRAMP_FAILED",
                source: "user-app",
                sourceId: `onramp:fail:${idempotencyKey}`,
                metadata: {
                    provider,
                    amountBucket,
                    reason: "tx_failed",
                },
            });
        } catch {
            // ignore
        }

        const errorResult: CreateOnRampTxnResult = {
            success: false,
            message: "Failed to create transaction",
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
