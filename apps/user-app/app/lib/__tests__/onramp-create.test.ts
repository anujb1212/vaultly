import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

// Mock next-auth getServerSession
const mockSession = { user: { id: "1" } };
vi.mock("next-auth", () => ({
    getServerSession: vi.fn().mockResolvedValue(mockSession),
}));

// Mock next/cache revalidatePath
vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

// Mock rateLimit to always allow
vi.mock("../redis/rateLimit", () => ({
    rateLimit: vi.fn().mockResolvedValue({ allowed: true, current: 1, ttl: 0 }),
}));

// Mock server-only
vi.mock("server-only", () => ({}));

import { createOnRampTxn } from "../actions/createOnRampTxn";
import {
    getTestPrisma,
    resetDatabase,
    createTestUser,
    createTestBalance,
    createTestLinkedBankAccount,
    createTestTransactionPin,
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

describe("Onramp creation (integration)", () => {
    describe("successful creation", () => {
        it("locks bank funds and creates OnRampTransaction in Processing state", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 0, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 100_000, locked: 0 });
            await createTestTransactionPin(prisma, user.id, "123456");

            const result = await createOnRampTxn(10_000, "HDFC", "onramp-test-001", bank.id, "123456");

            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.token).toBeDefined();
            expect(result.amount).toBe(10_000);
            expect(result.provider).toBe("HDFC");

            const updatedBank = await prisma.linkedBankAccount.findUnique({ where: { id: bank.id } });
            expect(updatedBank!.locked).toBe(10_000);
            expect(updatedBank!.amount).toBe(100_000);

            const onramp = await prisma.onRampTransaction.findUnique({ where: { token: result.token } });
            expect(onramp).not.toBeNull();
            expect(onramp!.status).toBe("Processing");
            expect(onramp!.amount).toBe(10_000);
            expect(onramp!.linkedBankAccountId).toBe(bank.id);
        });

        it("finds bank account by provider name when linkedBankAccountId not provided", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 0, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, {
                amount: 100_000,
                displayName: "HDFC",
            });
            await createTestTransactionPin(prisma, user.id, "123456");

            const result = await createOnRampTxn(5_000, "HDFC", "onramp-test-002", undefined, "123456");

            expect(result.success).toBe(true);

            const updatedBank = await prisma.linkedBankAccount.findUnique({ where: { id: bank.id } });
            expect(updatedBank!.locked).toBe(5_000);
        });
    });

    describe("insufficient bank balance", () => {
        it("fails when bank account has insufficient available funds", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 0, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 5_000, locked: 0 });
            await createTestTransactionPin(prisma, user.id, "123456");

            const result = await createOnRampTxn(10_000, "HDFC", "onramp-test-003", bank.id, "123456");

            expect(result.success).toBe(false);
            expect(result.message).toContain("Insufficient");

            const updatedBank = await prisma.linkedBankAccount.findUnique({ where: { id: bank.id } });
            expect(updatedBank!.locked).toBe(0);
        });

        it("fails when available = amount - locked is less than requested", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 0, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 10_000, locked: 8_000 });
            await createTestTransactionPin(prisma, user.id, "123456");

            const result = await createOnRampTxn(5_000, "HDFC", "onramp-test-004", bank.id, "123456");

            expect(result.success).toBe(false);
            expect(result.message).toContain("Insufficient");

            const updatedBank = await prisma.linkedBankAccount.findUnique({ where: { id: bank.id } });
            expect(updatedBank!.locked).toBe(8_000);
        });
    });

    describe("linked account not found", () => {
        it("fails when linkedBankAccountId doesn't exist", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 0, 0);
            await createTestTransactionPin(prisma, user.id, "123456");

            const result = await createOnRampTxn(10_000, "HDFC", "onramp-test-005", 99999, "123456");

            expect(result.success).toBe(false);
            expect(result.message).toContain("not found");
        });
    });

    describe("idempotency", () => {
        it("returns cached response on replay with same key", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 0, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 100_000 });
            await createTestTransactionPin(prisma, user.id, "123456");

            const first = await createOnRampTxn(10_000, "HDFC", "onramp-idem-001", bank.id, "123456");
            expect(first.success).toBe(true);

            const second = await createOnRampTxn(10_000, "HDFC", "onramp-idem-001", bank.id, "123456");
            expect(second.success).toBe(true);

            if (!first.success || !second.success) return;
            expect(second.token).toBe(first.token);

            const updatedBank = await prisma.linkedBankAccount.findUnique({ where: { id: bank.id } });
            expect(updatedBank!.locked).toBe(10_000);

            const onramps = await prisma.onRampTransaction.findMany();
            expect(onramps).toHaveLength(1);
        });
    });

    describe("input validation", () => {
        it("fails with non-positive amount", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 0, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 100_000 });
            await createTestTransactionPin(prisma, user.id, "123456");

            const result = await createOnRampTxn(0, "HDFC", "onramp-test-006", bank.id, "123456");
            expect(result.success).toBe(false);
        });

        it("fails with non-integer amount", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 0, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 100_000 });
            await createTestTransactionPin(prisma, user.id, "123456");

            const result = await createOnRampTxn(100.5, "HDFC", "onramp-test-007", bank.id, "123456");
            expect(result.success).toBe(false);
        });

        it("fails with invalid provider name (too short)", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 0, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 100_000 });
            await createTestTransactionPin(prisma, user.id, "123456");

            const result = await createOnRampTxn(10_000, "H", "onramp-test-008", bank.id, "123456");
            expect(result.success).toBe(false);
        });
    });
});
