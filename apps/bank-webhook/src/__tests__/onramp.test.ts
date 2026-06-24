import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { handleOnrampWebhookTx } from "../webhook/handlers/onramp";
import {
    getTestPrisma,
    resetDatabase,
    createTestUser,
    createTestBalance,
    createTestLinkedBankAccount,
    createTestOnRampTxn,
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

describe("Onramp webhook handler (integration)", () => {
    describe("success path", () => {
        it("processes a valid Success webhook, credits user balance, debits linked bank", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 0, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, {
                amount: 100_000,
                locked: 5000,
            });
            const txn = await createTestOnRampTxn(prisma, {
                userId: user.id,
                token: "onramp-success-001",
                amount: 5000,
                linkedBankAccountId: bank.id,
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOnrampWebhookTx({
                    tx,
                    body: {
                        token: "onramp-success-001",
                        user_identifier: String(user.id),
                        amount: 5000,
                        status: "Success",
                    },
                    now: new Date(),
                    webhookPayload: { raw: "payload" },
                });
            });

            expect(result.kind).toBe("processed_onramp_success");
            if (result.kind !== "processed_onramp_success") return;
            expect(result.amount).toBe(5000);
            expect(result.userId).toBe(user.id);

            const updatedTxn = await prisma.onRampTransaction.findUnique({ where: { token: "onramp-success-001" } });
            expect(updatedTxn!.status).toBe("Success");
            expect(updatedTxn!.completedAt).not.toBeNull();

            const balance = await prisma.balance.findUnique({ where: { userId: user.id } });
            expect(balance!.amount).toBe(5000);

            const updatedBank = await prisma.linkedBankAccount.findUnique({ where: { id: bank.id } });
            expect(updatedBank!.amount).toBe(95_000);
            expect(updatedBank!.locked).toBe(0);
        });

        it("creates ledger transaction with ONRAMP type", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 0, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, {
                amount: 100_000,
                locked: 3000,
            });
            await createTestOnRampTxn(prisma, {
                userId: user.id,
                token: "onramp-ledger-001",
                amount: 3000,
                linkedBankAccountId: bank.id,
            });

            await prisma.$transaction(async (tx) => {
                return handleOnrampWebhookTx({
                    tx,
                    body: {
                        token: "onramp-ledger-001",
                        user_identifier: String(user.id),
                        amount: 3000,
                        status: "Success",
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            const ledgerTxn = await prisma.ledgerTransaction.findUnique({
                where: { externalRef: "onramp:onramp-ledger-001" },
                include: { entries: true },
            });

            expect(ledgerTxn).not.toBeNull();
            expect(ledgerTxn!.type).toBe("ONRAMP");
            expect(ledgerTxn!.entries).toHaveLength(2);
        });

        it("works without linked bank account (no bank debit)", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 0, 0);
            await createTestOnRampTxn(prisma, {
                userId: user.id,
                token: "onramp-nobank-001",
                amount: 2000,
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOnrampWebhookTx({
                    tx,
                    body: {
                        token: "onramp-nobank-001",
                        user_identifier: String(user.id),
                        amount: 2000,
                        status: "Success",
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("processed_onramp_success");

            const balance = await prisma.balance.findUnique({ where: { userId: user.id } });
            expect(balance!.amount).toBe(2000);
        });
    });

    describe("failure path", () => {
        it("marks txn as Failure and releases locked bank funds (non-timeout)", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            const bank = await createTestLinkedBankAccount(prisma, user.id, {
                amount: 100_000,
                locked: 5000,
            });
            await createTestOnRampTxn(prisma, {
                userId: user.id,
                token: "onramp-fail-001",
                amount: 5000,
                linkedBankAccountId: bank.id,
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOnrampWebhookTx({
                    tx,
                    body: {
                        token: "onramp-fail-001",
                        user_identifier: String(user.id),
                        amount: 5000,
                        status: "Failure",
                        failureReasonCode: "INSUFFICIENT_FUNDS",
                        failureReasonMessage: "Not enough balance",
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("processed_onramp_failure");
            if (result.kind !== "processed_onramp_failure") return;
            expect(result.failureReasonCode).toBe("INSUFFICIENT_FUNDS");

            const updatedTxn = await prisma.onRampTransaction.findUnique({ where: { token: "onramp-fail-001" } });
            expect(updatedTxn!.status).toBe("Failure");
            expect(updatedTxn!.failureReasonCode).toBe("INSUFFICIENT_FUNDS");

            const updatedBank = await prisma.linkedBankAccount.findUnique({ where: { id: bank.id } });
            expect(updatedBank!.locked).toBe(0);
            expect(updatedBank!.amount).toBe(100_000);
        });

        it("does NOT release locked funds on BANK_TIMEOUT", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            const bank = await createTestLinkedBankAccount(prisma, user.id, {
                amount: 100_000,
                locked: 5000,
            });
            await createTestOnRampTxn(prisma, {
                userId: user.id,
                token: "onramp-timeout-001",
                amount: 5000,
                linkedBankAccountId: bank.id,
            });

            await prisma.$transaction(async (tx) => {
                return handleOnrampWebhookTx({
                    tx,
                    body: {
                        token: "onramp-timeout-001",
                        user_identifier: String(user.id),
                        amount: 5000,
                        status: "Failure",
                        failureReasonCode: "BANK_TIMEOUT",
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            const updatedBank = await prisma.linkedBankAccount.findUnique({ where: { id: bank.id } });
            expect(updatedBank!.locked).toBe(5000);
        });
    });

    describe("idempotency / dedup", () => {
        it("returns already_processed when txn is already Success", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 5000, 0);
            await createTestOnRampTxn(prisma, {
                userId: user.id,
                token: "onramp-dup-001",
                amount: 5000,
                status: "Success",
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOnrampWebhookTx({
                    tx,
                    body: {
                        token: "onramp-dup-001",
                        user_identifier: String(user.id),
                        amount: 5000,
                        status: "Success",
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("already_processed");
        });

        it("returns already_processed when txn is Failure and webhook is also Failure", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestOnRampTxn(prisma, {
                userId: user.id,
                token: "onramp-dup-fail-001",
                amount: 5000,
                status: "Failure",
                failureReasonCode: "REJECTED",
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOnrampWebhookTx({
                    tx,
                    body: {
                        token: "onramp-dup-fail-001",
                        user_identifier: String(user.id),
                        amount: 5000,
                        status: "Failure",
                        failureReasonCode: "REJECTED",
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("already_processed");
        });

        it("BANK_TIMEOUT failure can be overridden by later Success webhook", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 0, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, {
                amount: 100_000,
                locked: 5000,
            });
            await createTestOnRampTxn(prisma, {
                userId: user.id,
                token: "onramp-override-001",
                amount: 5000,
                status: "Failure",
                failureReasonCode: "BANK_TIMEOUT",
                linkedBankAccountId: bank.id,
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOnrampWebhookTx({
                    tx,
                    body: {
                        token: "onramp-override-001",
                        user_identifier: String(user.id),
                        amount: 5000,
                        status: "Success",
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("processed_onramp_success");

            const updatedTxn = await prisma.onRampTransaction.findUnique({ where: { token: "onramp-override-001" } });
            expect(updatedTxn!.status).toBe("Success");
            expect(updatedTxn!.failureReasonCode).toBeNull();

            const balance = await prisma.balance.findUnique({ where: { userId: user.id } });
            expect(balance!.amount).toBe(5000);
        });

        it("non-BANK_TIMEOUT failure cannot be overridden by Success", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestOnRampTxn(prisma, {
                userId: user.id,
                token: "onramp-no-override-001",
                amount: 5000,
                status: "Failure",
                failureReasonCode: "REJECTED",
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOnrampWebhookTx({
                    tx,
                    body: {
                        token: "onramp-no-override-001",
                        user_identifier: String(user.id),
                        amount: 5000,
                        status: "Success",
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
                return handleOnrampWebhookTx({
                    tx,
                    body: {
                        token: "nonexistent",
                        user_identifier: "1",
                        amount: 1000,
                        status: "Success",
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("not_found");
        });

        it("returns user_mismatch when user_identifier doesn't match", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestOnRampTxn(prisma, {
                userId: user.id,
                token: "onramp-mismatch-001",
                amount: 1000,
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOnrampWebhookTx({
                    tx,
                    body: {
                        token: "onramp-mismatch-001",
                        user_identifier: "999",
                        amount: 1000,
                        status: "Success",
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("user_mismatch");
        });

        it("returns amount_mismatch when amount doesn't match", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestOnRampTxn(prisma, {
                userId: user.id,
                token: "onramp-amount-001",
                amount: 1000,
            });

            const result = await prisma.$transaction(async (tx) => {
                return handleOnrampWebhookTx({
                    tx,
                    body: {
                        token: "onramp-amount-001",
                        user_identifier: String(user.id),
                        amount: 2000,
                        status: "Success",
                    },
                    now: new Date(),
                    webhookPayload: {},
                });
            });

            expect(result.kind).toBe("amount_mismatch");
        });
    });

    describe("concurrent webhooks", () => {
        it("only one Success webhook processes, others get already_processed", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 0, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, {
                amount: 100_000,
                locked: 5000,
            });
            await createTestOnRampTxn(prisma, {
                userId: user.id,
                token: "onramp-concurrent-001",
                amount: 5000,
                linkedBankAccountId: bank.id,
            });

            // Fire two concurrent transactions
            const results = await Promise.allSettled([
                prisma.$transaction(async (tx) => {
                    return handleOnrampWebhookTx({
                        tx,
                        body: { token: "onramp-concurrent-001", user_identifier: String(user.id), amount: 5000, status: "Success" },
                        now: new Date(),
                        webhookPayload: {},
                    });
                }),
                prisma.$transaction(async (tx) => {
                    return handleOnrampWebhookTx({
                        tx,
                        body: { token: "onramp-concurrent-001", user_identifier: String(user.id), amount: 5000, status: "Success" },
                        now: new Date(),
                        webhookPayload: {},
                    });
                }),
            ]);

            const successes = results.filter(
                (r) => r.status === "fulfilled" && r.value.kind === "processed_onramp_success"
            );
            const alreadyProcessed = results.filter(
                (r) => r.status === "fulfilled" && r.value.kind === "already_processed"
            );

            // At least one should succeed, the other should be already_processed or rejected
            expect(successes.length + alreadyProcessed.length).toBeGreaterThanOrEqual(1);

            // Balance should only be credited once
            const balance = await prisma.balance.findUnique({ where: { userId: user.id } });
            expect(balance!.amount).toBe(5000);
        });
    });
});
