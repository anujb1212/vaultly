import { Prisma, LedgerEntryDirection, LedgerTxnType } from "@prisma/client";

export const DEFAULT_CURRENCY = "INR";

function isUniqueViolation(e: any) {
    return e?.code === "P2002";
}

function normalizeEntriesForCompare(
    entries: Array<{ accountId: number; direction: LedgerEntryDirection; amount: number; currency: string }>
) {
    return entries
        .map((e) => ({
            accountId: e.accountId,
            direction: e.direction,
            amount: e.amount,
            currency: e.currency,
        }))
        .sort((a, b) => {
            if (a.accountId !== b.accountId) return a.accountId - b.accountId;
            if (a.direction !== b.direction) return a.direction < b.direction ? -1 : 1;
            if (a.currency !== b.currency) return a.currency < b.currency ? -1 : 1;
            return a.amount - b.amount;
        });
}

function assertExistingTxnMatches(args: {
    externalRef: string;
    expectedType: LedgerTxnType;
    expectedEntries: Array<{ accountId: number; direction: LedgerEntryDirection; amount: number; currency: string }>;
    existing: {
        type: LedgerTxnType;
        entries: Array<{ accountId: number; direction: LedgerEntryDirection; amount: number; currency: string }>;
    };
}) {
    if (args.existing.type !== args.expectedType) {
        throw new Error(`Idempotency collision: externalRef=${args.externalRef} type mismatch`);
    }

    const expected = normalizeEntriesForCompare(args.expectedEntries);
    const actual = normalizeEntriesForCompare(args.existing.entries);

    if (expected.length !== actual.length) {
        throw new Error(`Idempotency collision: externalRef=${args.externalRef} entries length mismatch`);
    }

    for (let i = 0; i < expected.length; i++) {
        const a = expected[i]!;
        const b = actual[i]!;
        if (
            a.accountId !== b.accountId ||
            a.direction !== b.direction ||
            a.amount !== b.amount ||
            a.currency !== b.currency
        ) {
            throw new Error(`Idempotency collision: externalRef=${args.externalRef} entries mismatch`);
        }
    }
}

export async function ensureUserCashAccount(
    tx: Prisma.TransactionClient,
    userId: number,
    currency = DEFAULT_CURRENCY
) {
    return tx.ledgerAccount.upsert({
        where: { userId_accountType_currency: { userId, accountType: "USER_CASH", currency } },
        update: {},
        create: { userId, accountType: "USER_CASH", currency },
    });
}

export async function ensurePlatformClearingAccount(tx: Prisma.TransactionClient, currency = DEFAULT_CURRENCY) {
    const systemKey = `PLATFORM_CLEARING:${currency}`;
    return tx.ledgerAccount.upsert({
        where: { systemKey },
        update: {},
        create: { systemKey, userId: null, accountType: "PLATFORM_CLEARING", currency },
    });
}

export async function postBalancedLedgerTransaction(args: {
    tx: Prisma.TransactionClient;
    type: LedgerTxnType;
    externalRef: string;
    currency?: string;
    metadata?: Prisma.JsonObject;
    entries: Array<{ accountId: number; direction: LedgerEntryDirection; amount: number }>;
}) {
    const currency = args.currency ?? DEFAULT_CURRENCY;

    if (!args.externalRef) throw new Error("externalRef required");
    if (args.entries.length < 2) throw new Error("Ledger txn must have >= 2 entries");

    let debits = 0;
    let credits = 0;

    for (const e of args.entries) {
        if (!Number.isInteger(e.amount) || e.amount <= 0) throw new Error("Invalid ledger amount");
        if (e.direction === "DEBIT") debits += e.amount;
        if (e.direction === "CREDIT") credits += e.amount;
    }

    if (debits !== credits) throw new Error(`Unbalanced ledger txn: debits=${debits} credits=${credits}`);

    const expectedEntries = args.entries.map((e) => ({
        accountId: e.accountId,
        direction: e.direction,
        amount: e.amount,
        currency,
    }));

    try {
        const txn = await args.tx.ledgerTransaction.create({
            data: {
                type: args.type,
                externalRef: args.externalRef,
                metadata: args.metadata,
                entries: {
                    createMany: {
                        data: args.entries.map((e) => ({
                            accountId: e.accountId,
                            direction: e.direction,
                            amount: e.amount,
                            currency,
                        })),
                    },
                },
            },
        });

        return txn;
    } catch (e: any) {
        if (!isUniqueViolation(e)) throw e;

        const existing = await args.tx.ledgerTransaction.findUnique({
            where: { externalRef: args.externalRef },
            include: { entries: true },
        });

        if (!existing) throw e;
        if (existing.entries.length === 0) throw new Error("Ledger txn exists but has no entries (inconsistent state)");

        assertExistingTxnMatches({
            externalRef: args.externalRef,
            expectedType: args.type,
            expectedEntries,
            existing: { type: existing.type, entries: existing.entries },
        });

        return existing;
    }
}

export async function postOnrampLedger(args: {
    tx: Prisma.TransactionClient;
    token: string;
    userId: number;
    amount: number;
    provider: string;
    webhookEventId?: string;
    currency?: string;
}) {
    const currency = args.currency ?? DEFAULT_CURRENCY;

    const userCash = await ensureUserCashAccount(args.tx, args.userId, currency);
    const clearing = await ensurePlatformClearingAccount(args.tx, currency);

    return postBalancedLedgerTransaction({
        tx: args.tx,
        type: "ONRAMP",
        externalRef: `onramp:${args.token}`,
        currency,
        metadata: { token: args.token, provider: args.provider, webhookEventId: args.webhookEventId ?? null },
        entries: [
            { accountId: clearing.id, direction: "DEBIT", amount: args.amount },
            { accountId: userCash.id, direction: "CREDIT", amount: args.amount },
        ],
    });
}

export async function postP2PLedger(args: {
    tx: Prisma.TransactionClient;
    idempotencyKey: string;
    senderId: number;
    receiverId: number;
    amount: number;
    currency?: string;
}) {
    const currency = args.currency ?? DEFAULT_CURRENCY;

    const senderCash = await ensureUserCashAccount(args.tx, args.senderId, currency);
    const receiverCash = await ensureUserCashAccount(args.tx, args.receiverId, currency);

    return postBalancedLedgerTransaction({
        tx: args.tx,
        type: "P2P_TRANSFER",
        externalRef: `p2p:${args.idempotencyKey}`,
        currency,
        metadata: { idempotencyKey: args.idempotencyKey, senderId: args.senderId, receiverId: args.receiverId },
        entries: [
            { accountId: senderCash.id, direction: "DEBIT", amount: args.amount },
            { accountId: receiverCash.id, direction: "CREDIT", amount: args.amount },
        ],
    });
}
