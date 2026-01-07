"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma, { auditLogger, idempotencyManager } from "@repo/db/client";

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
    };

import { revalidatePath } from "next/cache";

export async function createOnRampTxn(
    amount: number,
    provider: string,
    idempotencyKey: string
): Promise<CreateOnRampTxnResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user?.id) {
        return {
            success: false,
            message: "Unauthenticated request",
        };
    }

    const userId = Number(session.user.id);

    const idempotencyCheck = await idempotencyManager.checkAndStore(
        idempotencyKey,
        userId,
        "ONRAMP_CREATE"
    )

    if (idempotencyCheck?.exists) {
        return idempotencyCheck.response as CreateOnRampTxnResult;
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const dummyToken = crypto.randomUUID();

            const onRampTxn = await tx.onRampTransaction.create({
                data: {
                    provider,
                    userId: Number(session?.user?.id),
                    amount: amount,
                    status: "Processing",
                    startTime: new Date(),
                    token: dummyToken,
                },
            });

            await auditLogger.createAuditLog({
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
                metadata: {
                    idempotencyKey
                }
            },
                tx
            )
            return {
                success: true,
                message: "On Ramp Transaction created successfully",
                token: onRampTxn.token,
                userId: onRampTxn.userId,
                amount: onRampTxn.amount,
                provider: onRampTxn.provider
            };
        })

        await idempotencyManager.updateResponse(idempotencyKey, result)

        // Trigger cache revalidation
        revalidatePath("/dashboard");
        revalidatePath("/transfer");

        return result;

    } catch (error) {
        console.error("OnRamp transaction error:", error);
        const errorResullt: CreateOnRampTxnResult = {
            success: false,
            message: "Failed to create transaction",
        };

        try {
            await idempotencyManager.updateResponse(idempotencyKey, errorResullt)
        } catch (err) {
            console.error("Failed to update idempotency record:", err);
        }
        return errorResullt;
    }
}