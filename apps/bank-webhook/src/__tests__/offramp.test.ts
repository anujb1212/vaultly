import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { handleOfframpWebhookTx } from "../webhook/handlers/offramp";
import {
    getTestPrisma,
    resetDatabase,
    createTestUser,
    createTestBalance,
    createTestLinkedBankAccount,
    createTestOffRampTxn,
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

describe("Offramp webhook handler (integration)", () => {
    describe("success path", () => {
        it("processes a valid Success webhook, debits user balance, credits linked bank", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 10_000, 5000);
            const bank = await createTestLinkedBankAccount(prisma, user.id, {
                amount: 50_000,
                locked: 0,
            });
            await createTestOffRampTxn(prisma, {
                userId: user.id,
                token: "offramp-success-001",
                amount: 5000,
                linkedBankAccountId: bank.id,
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOfframpWebhookTx({
                    tx,
                    body: {
                        token: "offramp-success-001",
                        user_identifier: String(user.id),
                        amount: 5000,
                        status: "Success",
                        linkedBankAccountId: bank.id,
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("processed_offramp_success");
            if (result.kind !== "processed_offramp_success") return;
            expect(result.amount).toBe(5000);
            expect(result.newBalanceAmount).toBe(5000);

            const updatedTxn = await prisma.offRampTransaction.findUnique({ where: { token: "offramp-success-001" } });
            expect(updatedTxn!.status).toBe("Success");

            const balance = await prisma.balance.findUnique({ where: { userId: user.id } });
            expect(balance!.amount).toBe(5000);
            expect(balance!.locked).toBe(0);

            const updatedBank = await prisma.linkedBankAccount.findUnique({ where: { id: bank.id } });
            expect(updatedBank!.amount).toBe(55_000);
        });

        it("creates OFFRAMP ledger transaction", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 10_000, 3000);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 50_000 });
            await createTestOffRampTxn(prisma, {
                userId: user.id,
                token: "offramp-ledger-001",
                amount: 3000,
                linkedBankAccountId: bank.id,
            });

            await prisma.$transaction(async (tx) => {
                return handleOfframpWebhookTx({
                    tx,
                    body: {
                        token: "offramp-ledger-001",
                        user_identifier: String(user.id),
                        amount: 3000,
                        status: "Success",
                        linkedBankAccountId: bank.id,
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            const ledgerTxn = await prisma.ledgerTransaction.findUnique({
                where: { externalRef: "offramp:offramp-ledger-001" },
                include: { entries: true },
            });

            expect(ledgerTxn).not.toBeNull();
            expect(ledgerTxn!.type).toBe("OFFRAMP");
            expect(ledgerTxn!.entries).toHaveLength(2);
        });
    });

    describe("failure path", () => {
        it("marks txn as Failure and releases locked wallet funds (non-timeout)", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 10_000, 5000);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 50_000 });
            await createTestOffRampTxn(prisma, {
                userId: user.id,
                token: "offramp-fail-001",
                amount: 5000,
                linkedBankAccountId: bank.id,
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOfframpWebhookTx({
                    tx,
                    body: {
                        token: "offramp-fail-001",
                        user_identifier: String(user.id),
                        amount: 5000,
                        status: "Failure",
                        failureReasonCode: "REJECTED",
                        linkedBankAccountId: bank.id,
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("processed_offramp_failure");

            const updatedTxn = await prisma.offRampTransaction.findUnique({ where: { token: "offramp-fail-001" } });
            expect(updatedTxn!.status).toBe("Failure");
            expect(updatedTxn!.failureReasonCode).toBe("REJECTED");

            const balance = await prisma.balance.findUnique({ where: { userId: user.id } });
            expect(balance!.locked).toBe(0);
            expect(balance!.amount).toBe(10_000);
        });

        it("does NOT release locked funds on BANK_TIMEOUT", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 10_000, 5000);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 50_000 });
            await createTestOffRampTxn(prisma, {
                userId: user.id,
                token: "offramp-timeout-001",
                amount: 5000,
                linkedBankAccountId: bank.id,
            });

            await prisma.$transaction(async (tx) => {
                return handleOfframpWebhookTx({
                    tx,
                    body: {
                        token: "offramp-timeout-001",
                        user_identifier: String(user.id),
                        amount: 5000,
                        status: "Failure",
                        failureReasonCode: "BANK_TIMEOUT",
                        linkedBankAccountId: bank.id,
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            const balance = await prisma.balance.findUnique({ where: { userId: user.id } });
            expect(balance!.locked).toBe(5000);
        });
    });

    describe("idempotency / dedup", () => {
        it("returns already_processed when txn is already Success", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 50_000 });
            await createTestOffRampTxn(prisma, {
                userId: user.id,
                token: "offramp-dup-001",
                amount: 5000,
                linkedBankAccountId: bank.id,
                status: "Success",
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOfframpWebhookTx({
                    tx,
                    body: {
                        token: "offramp-dup-001",
                        user_identifier: String(user.id),
                        amount: 5000,
                        status: "Success",
                        linkedBankAccountId: bank.id,
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("already_processed");
        });

        it("BANK_TIMEOUT failure can be overridden by later Success", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 10_000, 5000);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 50_000 });
            await createTestOffRampTxn(prisma, {
                userId: user.id,
                token: "offramp-override-001",
                amount: 5000,
                linkedBankAccountId: bank.id,
                status: "Failure",
                failureReasonCode: "BANK_TIMEOUT",
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOfframpWebhookTx({
                    tx,
                    body: {
                        token: "offramp-override-001",
                        user_identifier: String(user.id),
                        amount: 5000,
                        status: "Success",
                        linkedBankAccountId: bank.id,
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("processed_offramp_success");

            const balance = await prisma.balance.findUnique({ where: { userId: user.id } });
            expect(balance!.amount).toBe(5000);
            expect(balance!.locked).toBe(0);
        });

        it("non-BANK_TIMEOUT failure cannot be overridden by Success", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 50_000 });
            await createTestOffRampTxn(prisma, {
                userId: user.id,
                token: "offramp-no-override-001",
                amount: 5000,
                linkedBankAccountId: bank.id,
                status: "Failure",
                failureReasonCode: "REJECTED",
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOfframpWebhookTx({
                    tx,
                    body: {
                        token: "offramp-no-override-001",
                        user_identifier: String(user.id),
                        amount: 5000,
                        status: "Success",
                        linkedBankAccountId: bank.id,
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("already_processed");
        });
    });

    describe("validation", () => {
        it("returns not_found for unknown token", async () => {
            const result = await prisma.$transaction(async (tx) => {
                return handleOfframpWebhookTx({
                    tx,
                    body: {
                        token: "nonexistent",
                        user_identifier: "1",
                        amount: 1000,
                        status: "Success",
                        linkedBankAccountId: 1,
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("not_found");
        });

        it("returns user_mismatch when user_identifier doesn't match", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 50_000 });
            await createTestOffRampTxn(prisma, {
                userId: user.id,
                token: "offramp-mismatch-001",
                amount: 1000,
                linkedBankAccountId: bank.id,
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOfframpWebhookTx({
                    tx,
                    body: {
                        token: "offramp-mismatch-001",
                        user_identifier: "999",
                        amount: 1000,
                        status: "Success",
                        linkedBankAccountId: bank.id,
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("user_mismatch");
        });

        it("returns amount_mismatch when amount doesn't match", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 50_000 });
            await createTestOffRampTxn(prisma, {
                userId: user.id,
                token: "offramp-amount-001",
                amount: 1000,
                linkedBankAccountId: bank.id,
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOfframpWebhookTx({
                    tx,
                    body: {
                        token: "offramp-amount-001",
                        user_identifier: String(user.id),
                        amount: 2000,
                        status: "Success",
                        linkedBankAccountId: bank.id,
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("amount_mismatch");
        });

        it("returns account_mismatch when linkedBankAccountId doesn't match", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 50_000 });
            await createTestOffRampTxn(prisma, {
                userId: user.id,
                token: "offramp-acct-001",
                amount: 1000,
                linkedBankAccountId: bank.id,
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOfframpWebhookTx({
                    tx,
                    body: {
                        token: "offramp-acct-001",
                        user_identifier: String(user.id),
                        amount: 1000,
                        status: "Success",
                        linkedBankAccountId: 99999,
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("account_mismatch");
        });
    });

    describe("insufficient locked funds", () => {
        it("returns insufficient_funds when locked < amount on Success", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 10_000, 1000);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 50_000 });
            await createTestOffRampTxn(prisma, {
                userId: user.id,
                token: "offramp-insufficient-001",
                amount: 5000,
                linkedBankAccountId: bank.id,
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOfframpWebhookTx({
                    tx,
                    body: {
                        token: "offramp-insufficient-001",
                        user_identifier: String(user.id),
                        amount: 5000,
                        status: "Success",
                        linkedBankAccountId: bank.id,
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("insufficient_funds");
        });
    });

    describe("concurrent webhooks", () => {
        it("only one Success webhook processes, balance debited once", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 10_000, 5000);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 50_000 });
            await createTestOffRampTxn(prisma, {
                userId: user.id,
                token: "offramp-concurrent-001",
                amount: 5000,
                linkedBankAccountId: bank.id,
            });

            const results = await Promise.allSettled([
                prisma.$transaction(async (tx) => {
                    return handleOfframpWebhookTx({
                        tx,
                        body: { token: "offramp-concurrent-001", user_identifier: String(user.id), amount: 5000, status: "Success", linkedBankAccountId: bank.id },
                        now: new Date(),
                        webhookPayload: {},
                    });
                }),
                prisma.$transaction(async (tx) => {
                    return handleOfframpWebhookTx({
                        tx,
                        body: { token: "offramp-concurrent-001", user_identifier: String(user.id), amount: 5000, status: "Success", linkedBankAccountId: bank.id },
                        now: new Date(),
                        webhookPayload: {},
                    });
                }),
            ]);

            const successes = results.filter(
                (r) => r.status === "fulfilled" && r.value.kind === "processed_offramp_success"
            );

            expect(successes.length).toBe(1);

            const balance = await prisma.balance.findUnique({ where: { userId: user.id } });
            expect(balance!.amount).toBe(5000);
        });
    });
});
