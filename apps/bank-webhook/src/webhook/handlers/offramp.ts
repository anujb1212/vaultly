import type { Prisma } from "@prisma/client";
import { asJsonObject } from "../../utils/json";
import { postOfframpLedger } from "@repo/db/client";

type Outcome =
    | { kind: "not_found" }
    | { kind: "user_mismatch" }
    | { kind: "amount_mismatch" }
    | { kind: "account_mismatch" }
    | { kind: "already_processed" }
    | {
        kind: "processed_offramp_failure";
        userId: number;
        offRampTxnId: number;
        token: string;
        amount: number;
        failureReasonCode: string;
        failureReasonMessage?: string;
        webhookEventId?: string;
    }
    | {
        kind: "processed_offramp_success";
        userId: number;
        offRampTxnId: number;
        token: string;
        amount: number;
        ledgerTransactionId: number;
        webhookEventId?: string;
    };

export async function handleOfframpWebhookTx(args: {
    tx: Prisma.TransactionClient;
    body: {
        token: string;
        user_identifier: string;
        amount: number;
        status: "Success" | "Failure";
        failureReasonCode?: string;
        failureReasonMessage?: string;
        linkedBankAccountId?: number;
    };
    now: Date;
    webhookEventId?: string;
    webhookPayload: any;
}): Promise<Outcome> {
    const { tx, body, now, webhookEventId, webhookPayload } = args;
    const userIdFromBody = Number(body.user_identifier);

    const txn = await tx.offRampTransaction.findUnique({ where: { token: body.token } });
    if (!txn) return { kind: "not_found" };
    if (txn.userId !== userIdFromBody) return { kind: "user_mismatch" };
    if (txn.amount !== body.amount) return { kind: "amount_mismatch" };
    if (body.linkedBankAccountId && txn.linkedBankAccountId !== body.linkedBankAccountId) {
        return { kind: "account_mismatch" };
    }

    if (txn.status === "Success") return { kind: "already_processed" };

    const canOverrideFailureWithSuccess =
        txn.status === "Failure" &&
        txn.failureReasonCode === "BANK_TIMEOUT" &&
        body.status === "Success";

    if (txn.status === "Failure" && body.status === "Failure") return { kind: "already_processed" };
    if (txn.status === "Failure" && body.status === "Success" && !canOverrideFailureWithSuccess) {
        return { kind: "already_processed" };
    }

    const prevMeta = asJsonObject(txn.metadata);

    if (body.status === "Failure") {
        const claimed = await tx.offRampTransaction.updateMany({
            where: {
                token: body.token,
                userId: txn.userId,
                status: "Processing",
            },
            data: {
                status: "Failure",
                completedAt: now,
                failureReasonCode: body.failureReasonCode ?? "UNKNOWN",
                failureReasonMessage: body.failureReasonMessage,
                metadata: {
                    ...prevMeta,
                    webhookReceivedAt: now.toISOString(),
                    webhookPayload,
                },
            },
        });

        if (claimed.count === 0) return { kind: "already_processed" };

        const shouldRelease = (body.failureReasonCode ?? "UNKNOWN") !== "BANK_TIMEOUT";

        if (shouldRelease) {
            await tx.balance.upsert({
                where: { userId: txn.userId },
                update: {},
                create: { userId: txn.userId, amount: 0, locked: 0 },
            });

            await tx.$queryRaw`
        SELECT * FROM "Balance"
        WHERE "userId" = ${txn.userId}
        FOR UPDATE
      `;

            await tx.balance.update({
                where: { userId: txn.userId },
                data: { locked: { decrement: body.amount } },
            });
        }

        return {
            kind: "processed_offramp_failure",
            userId: txn.userId,
            offRampTxnId: txn.id,
            token: body.token,
            amount: body.amount,
            failureReasonCode: body.failureReasonCode ?? "UNKNOWN",
            failureReasonMessage: body.failureReasonMessage,
            webhookEventId,
        };
    }

    const claimed = await tx.offRampTransaction.updateMany({
        where: {
            token: body.token,
            userId: txn.userId,
            status: canOverrideFailureWithSuccess ? { in: ["Processing", "Failure"] } : "Processing",
        },
        data: {
            status: "Success",
            completedAt: now,
            failureReasonCode: null,
            failureReasonMessage: null,
            metadata: {
                ...prevMeta,
                webhookReceivedAt: now.toISOString(),
                webhookPayload,
            },
        },
    });

    if (claimed.count === 0) return { kind: "already_processed" };

    await tx.balance.upsert({
        where: { userId: txn.userId },
        update: {},
        create: { userId: txn.userId, amount: 0, locked: 0 },
    });

    await tx.$queryRaw`
    SELECT * FROM "Balance"
    WHERE "userId" = ${txn.userId}
    FOR UPDATE
  `;

    await tx.$queryRaw`
    SELECT * FROM "LinkedBankAccount"
    WHERE "id" = ${txn.linkedBankAccountId} AND "userId" = ${txn.userId}
    FOR UPDATE
  `;

    const wallet = await tx.balance.findUnique({ where: { userId: txn.userId } });
    if (!wallet) throw new Error("Wallet not initialized");
    if (wallet.locked < body.amount) throw new Error("Inconsistent wallet lock (locked < amount)");

    const linked = await tx.linkedBankAccount.findFirst({
        where: { id: txn.linkedBankAccountId, userId: txn.userId },
    });
    if (!linked) throw new Error("Linked account not found for offramp");

    const ledgerTxn = await postOfframpLedger({
        tx,
        idempotencyKey: txn.token,
        userId: txn.userId,
        amount: body.amount,
        providerKey: String(txn.providerKey),
        linkedBankAccountId: txn.linkedBankAccountId,
    });

    await tx.balance.update({
        where: { userId: txn.userId },
        data: {
            amount: { decrement: body.amount },
            locked: { decrement: body.amount },
        },
    });

    await tx.linkedBankAccount.update({
        where: { id: linked.id },
        data: { amount: { increment: body.amount } },
    });

    return {
        kind: "processed_offramp_success",
        userId: txn.userId,
        offRampTxnId: txn.id,
        token: body.token,
        amount: body.amount,
        ledgerTransactionId: ledgerTxn.id,
        webhookEventId,
    };
}
