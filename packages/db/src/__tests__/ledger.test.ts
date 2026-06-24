import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import {
    postBalancedLedgerTransaction,
    postOnrampLedger,
    postP2PLedger,
    postOfframpLedger,
    ensureUserCashAccount,
    ensurePlatformClearingAccount,
} from "../utils/ledger";
import {
    getTestPrisma,
    resetDatabase,
    createTestUser,
} from "./setup";

const prisma = getTestPrisma();

beforeAll(async () => {
    await prisma.$connect();
});

afterAll(async () => {
    await prisma.$disconnect();
});

beforeEach(async () => {
    await resetDatabase(prisma);
});

describe("Ledger system (integration)", () => {
    describe("postBalancedLedgerTransaction", () => {
        it("creates a balanced transaction with entries", async () => {
            const user1 = await createTestUser(prisma, { id: 1 });
            const user2 = await createTestUser(prisma, { id: 2 });

            const acct1 = await ensureUserCashAccount(prisma as any, user1.id);
            const acct2 = await ensureUserCashAccount(prisma as any, user2.id);

            const txn = await prisma.$transaction(async (tx) => {
                return postBalancedLedgerTransaction({
                    tx,
                    type: "P2P_TRANSFER",
                    externalRef: "p2p:test-001",
                    entries: [
                        { accountId: acct1.id, direction: "DEBIT", amount: 5000 },
                        { accountId: acct2.id, direction: "CREDIT", amount: 5000 },
                    ],
                });
            });

            expect(txn.id).toBeDefined();
            expect(txn.externalRef).toBe("p2p:test-001");
            expect(txn.type).toBe("P2P_TRANSFER");

            const entries = await prisma.ledgerEntry.findMany({
                where: { transactionId: txn.id },
            });
            expect(entries).toHaveLength(2);
            expect(entries.find((e) => e.direction === "DEBIT")?.amount).toBe(5000);
            expect(entries.find((e) => e.direction === "CREDIT")?.amount).toBe(5000);
        });

        it("returns existing transaction on duplicate externalRef (idempotency)", async () => {
            const user1 = await createTestUser(prisma, { id: 1 });
            const user2 = await createTestUser(prisma, { id: 2 });

            const acct1 = await ensureUserCashAccount(prisma as any, user1.id);
            const acct2 = await ensureUserCashAccount(prisma as any, user2.id);

            const ref = "p2p:dup-001";

            const first = await prisma.$transaction(async (tx) => {
                return postBalancedLedgerTransaction({
                    tx,
                    type: "P2P_TRANSFER",
                    externalRef: ref,
                    entries: [
                        { accountId: acct1.id, direction: "DEBIT", amount: 1000 },
                        { accountId: acct2.id, direction: "CREDIT", amount: 1000 },
                    ],
                });
            });

            const second = await prisma.$transaction(async (tx) => {
                return postBalancedLedgerTransaction({
                    tx,
                    type: "P2P_TRANSFER",
                    externalRef: ref,
                    entries: [
                        { accountId: acct1.id, direction: "DEBIT", amount: 1000 },
                        { accountId: acct2.id, direction: "CREDIT", amount: 1000 },
                    ],
                });
            });

            expect(second.id).toBe(first.id);
        });

        it("throws on externalRef collision with different type", async () => {
            const user1 = await createTestUser(prisma, { id: 1 });
            const user2 = await createTestUser(prisma, { id: 2 });

            const acct1 = await ensureUserCashAccount(prisma as any, user1.id);
            const acct2 = await ensureUserCashAccount(prisma as any, user2.id);

            const ref = "collision-001";

            await prisma.$transaction(async (tx) => {
                return postBalancedLedgerTransaction({
                    tx,
                    type: "P2P_TRANSFER",
                    externalRef: ref,
                    entries: [
                        { accountId: acct1.id, direction: "DEBIT", amount: 1000 },
                        { accountId: acct2.id, direction: "CREDIT", amount: 1000 },
                    ],
                });
            });

            await expect(
                prisma.$transaction(async (tx) => {
                    return postBalancedLedgerTransaction({
                        tx,
                        type: "ONRAMP",
                        externalRef: ref,
                        entries: [
                            { accountId: acct1.id, direction: "DEBIT", amount: 1000 },
                            { accountId: acct2.id, direction: "CREDIT", amount: 1000 },
                        ],
                    });
                })
            ).rejects.toThrow("type mismatch");
        });

        it("throws on externalRef collision with different entries", async () => {
            const user1 = await createTestUser(prisma, { id: 1 });
            const user2 = await createTestUser(prisma, { id: 2 });

            const acct1 = await ensureUserCashAccount(prisma as any, user1.id);
            const acct2 = await ensureUserCashAccount(prisma as any, user2.id);

            const ref = "collision-002";

            await prisma.$transaction(async (tx) => {
                return postBalancedLedgerTransaction({
                    tx,
                    type: "P2P_TRANSFER",
                    externalRef: ref,
                    entries: [
                        { accountId: acct1.id, direction: "DEBIT", amount: 1000 },
                        { accountId: acct2.id, direction: "CREDIT", amount: 1000 },
                    ],
                });
            });

            await expect(
                prisma.$transaction(async (tx) => {
                    return postBalancedLedgerTransaction({
                        tx,
                        type: "P2P_TRANSFER",
                        externalRef: ref,
                        entries: [
                            { accountId: acct1.id, direction: "DEBIT", amount: 2000 },
                            { accountId: acct2.id, direction: "CREDIT", amount: 2000 },
                    ],
                    });
                })
            ).rejects.toThrow("entries mismatch");
        });

        it("stores metadata correctly", async () => {
            const user1 = await createTestUser(prisma, { id: 1 });
            const user2 = await createTestUser(prisma, { id: 2 });

            const acct1 = await ensureUserCashAccount(prisma as any, user1.id);
            const acct2 = await ensureUserCashAccount(prisma as any, user2.id);

            const txn = await prisma.$transaction(async (tx) => {
                return postBalancedLedgerTransaction({
                    tx,
                    type: "P2P_TRANSFER",
                    externalRef: "p2p:meta-001",
                    metadata: { custom: "data", count: 42 },
                    entries: [
                        { accountId: acct1.id, direction: "DEBIT", amount: 100 },
                        { accountId: acct2.id, direction: "CREDIT", amount: 100 },
                    ],
                });
            });

            const fetched = await prisma.ledgerTransaction.findUnique({
                where: { id: txn.id },
            });
            expect(fetched?.metadata).toEqual({ custom: "data", count: 42 });
        });
    });

    describe("postOnrampLedger", () => {
        it("creates balanced ONRAMP ledger (clearing DEBIT, user CREDIT)", async () => {
            const user = await createTestUser(prisma, { id: 1 });

            const txn = await prisma.$transaction(async (tx) => {
                return postOnrampLedger({
                    tx,
                    token: "onramp-token-001",
                    userId: user.id,
                    amount: 5000,
                    provider: "HDFC",
                });
            });

            const entries = await prisma.ledgerEntry.findMany({
                where: { transactionId: txn.id },
                include: { account: true },
            });

            expect(entries).toHaveLength(2);
            const debit = entries.find((e) => e.direction === "DEBIT")!;
            const credit = entries.find((e) => e.direction === "CREDIT")!;

            expect(debit.account.accountType).toBe("PLATFORM_CLEARING");
            expect(credit.account.userId).toBe(user.id);
            expect(credit.account.accountType).toBe("USER_CASH");
            expect(debit.amount).toBe(5000);
            expect(credit.amount).toBe(5000);
        });

        it("is idempotent on same token", async () => {
            const user = await createTestUser(prisma, { id: 1 });

            const first = await prisma.$transaction(async (tx) => {
                return postOnrampLedger({
                    tx, token: "onramp-dup-001", userId: user.id, amount: 3000, provider: "HDFC",
                });
            });

            const second = await prisma.$transaction(async (tx) => {
                return postOnrampLedger({
                    tx, token: "onramp-dup-001", userId: user.id, amount: 3000, provider: "HDFC",
                });
            });

            expect(second.id).toBe(first.id);
        });
    });

    describe("postP2PLedger", () => {
        it("creates balanced P2P ledger (sender DEBIT, receiver CREDIT)", async () => {
            const sender = await createTestUser(prisma, { id: 1 });
            const receiver = await createTestUser(prisma, { id: 2 });

            const txn = await prisma.$transaction(async (tx) => {
                return postP2PLedger({
                    tx,
                    idempotencyKey: "p2p-key-001",
                    senderId: sender.id,
                    receiverId: receiver.id,
                    amount: 2500,
                });
            });

            const entries = await prisma.ledgerEntry.findMany({
                where: { transactionId: txn.id },
                include: { account: true },
            });

            expect(entries).toHaveLength(2);
            const debit = entries.find((e) => e.direction === "DEBIT")!;
            const credit = entries.find((e) => e.direction === "CREDIT")!;

            expect(debit.account.userId).toBe(sender.id);
            expect(credit.account.userId).toBe(receiver.id);
            expect(debit.amount).toBe(2500);
            expect(credit.amount).toBe(2500);
        });

        it("is idempotent on same idempotencyKey", async () => {
            const sender = await createTestUser(prisma, { id: 1 });
            const receiver = await createTestUser(prisma, { id: 2 });

            const first = await prisma.$transaction(async (tx) => {
                return postP2PLedger({
                    tx, idempotencyKey: "p2p-dup-001", senderId: sender.id, receiverId: receiver.id, amount: 1000,
                });
            });

            const second = await prisma.$transaction(async (tx) => {
                return postP2PLedger({
                    tx, idempotencyKey: "p2p-dup-001", senderId: sender.id, receiverId: receiver.id, amount: 1000,
                });
            });

            expect(second.id).toBe(first.id);
        });
    });

    describe("postOfframpLedger", () => {
        it("creates balanced OFFRAMP ledger (user DEBIT, clearing CREDIT)", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            const bank = await prisma.linkedBankAccount.create({
                data: {
                    userId: user.id,
                    providerKey: "HDFC",
                    displayName: "Test",
                    maskedAccount: "****1234",
                    amount: 100000,
                    locked: 0,
                },
            });

            const txn = await prisma.$transaction(async (tx) => {
                return postOfframpLedger({
                    tx,
                    idempotencyKey: "offramp-key-001",
                    userId: user.id,
                    amount: 2000,
                    providerKey: "HDFC",
                    linkedBankAccountId: bank.id,
                });
            });

            const entries = await prisma.ledgerEntry.findMany({
                where: { transactionId: txn.id },
                include: { account: true },
            });

            expect(entries).toHaveLength(2);
            const debit = entries.find((e) => e.direction === "DEBIT")!;
            const credit = entries.find((e) => e.direction === "CREDIT")!;

            expect(debit.account.userId).toBe(user.id);
            expect(debit.account.accountType).toBe("USER_CASH");
            expect(credit.account.accountType).toBe("PLATFORM_CLEARING");
            expect(debit.amount).toBe(2000);
            expect(credit.amount).toBe(2000);
        });
    });

    describe("ensureUserCashAccount", () => {
        it("creates account on first call, returns same on second (upsert)", async () => {
            const user = await createTestUser(prisma, { id: 1 });

            const acct1 = await prisma.$transaction(async (tx) => {
                return ensureUserCashAccount(tx, user.id);
            });
            const acct2 = await prisma.$transaction(async (tx) => {
                return ensureUserCashAccount(tx, user.id);
            });

            expect(acct1.id).toBe(acct2.id);
            expect(acct1.userId).toBe(user.id);
            expect(acct1.accountType).toBe("USER_CASH");
        });
    });

    describe("ensurePlatformClearingAccount", () => {
        it("creates system account on first call, returns same on second", async () => {
            const acct1 = await prisma.$transaction(async (tx) => {
                return ensurePlatformClearingAccount(tx);
            });
            const acct2 = await prisma.$transaction(async (tx) => {
                return ensurePlatformClearingAccount(tx);
            });

            expect(acct1.id).toBe(acct2.id);
            expect(acct1.userId).toBeNull();
            expect(acct1.accountType).toBe("PLATFORM_CLEARING");
            expect(acct1.systemKey).toBe("PLATFORM_CLEARING:INR");
        });
    });
});
