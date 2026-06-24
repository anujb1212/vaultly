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

// Mock global fetch (gateway enqueue)
const mockFetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } })
);
vi.stubGlobal("fetch", mockFetch);

import { withdrawToLinkedAccount } from "../actions/withdraw";
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
    mockFetch.mockClear();
    mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } })
    );
});

describe("Withdrawal / offramp (integration)", () => {
    describe("successful withdrawal", () => {
        it("locks funds and creates OffRampTransaction in Processing state", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 50_000, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 100_000 });
            await createTestTransactionPin(prisma, user.id, "123456");

            const result = await withdrawToLinkedAccount(bank.id, 10_000, "withdraw-test-001", "123456");

            expect(result.success).toBe(true);
            if (!result.success) return;
            expect(result.token).toBe("withdraw-test-001");

            const balance = await prisma.balance.findUnique({ where: { userId: user.id } });
            expect(balance!.amount).toBe(50_000);
            expect(balance!.locked).toBe(10_000);

            const offramp = await prisma.offRampTransaction.findUnique({ where: { token: "withdraw-test-001" } });
            expect(offramp).not.toBeNull();
            expect(offramp!.status).toBe("Processing");
            expect(offramp!.amount).toBe(10_000);
        });

        it("enqueues webhook to gateway", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 50_000, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 100_000 });
            await createTestTransactionPin(prisma, user.id, "123456");

            await withdrawToLinkedAccount(bank.id, 10_000, "withdraw-test-002", "123456");

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const call = mockFetch.mock.calls[0];
            expect(call[0]).toContain("/api/process-withdraw");
        });
    });

    describe("insufficient balance", () => {
        it("fails when available balance (amount - locked) is less than withdrawal", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 10_000, 5_000);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 100_000 });
            await createTestTransactionPin(prisma, user.id, "123456");

            const result = await withdrawToLinkedAccount(bank.id, 10_000, "withdraw-test-003", "123456");

            expect(result.success).toBe(false);
            if (result.success) return;
            expect(result.errorCode).toBe("INSUFFICIENT_BALANCE");

            const balance = await prisma.balance.findUnique({ where: { userId: user.id } });
            expect(balance!.locked).toBe(5_000);
        });
    });

    describe("minimum amount", () => {
        it("fails for amount below minimum (₹100 = 10000 paise)", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 50_000, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 100_000 });
            await createTestTransactionPin(prisma, user.id, "123456");

            const result = await withdrawToLinkedAccount(bank.id, 5_000, "withdraw-test-004", "123456");

            expect(result.success).toBe(false);
            if (result.success) return;
            expect(result.errorCode).toBe("INVALID_AMOUNT");
        });
    });

    describe("linked account not found", () => {
        it("fails when linked bank account doesn't belong to user", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 50_000, 0);
            await createTestTransactionPin(prisma, user.id, "123456");

            const result = await withdrawToLinkedAccount(99999, 10_000, "withdraw-test-005", "123456");

            expect(result.success).toBe(false);
            if (result.success) return;
            expect(result.errorCode).toBe("ACCOUNT_NOT_FOUND");
        });
    });

    describe("idempotency", () => {
        it("returns cached response on replay with same key", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 50_000, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 100_000 });
            await createTestTransactionPin(prisma, user.id, "123456");

            const first = await withdrawToLinkedAccount(bank.id, 10_000, "withdraw-idem-001", "123456");
            expect(first.success).toBe(true);

            mockFetch.mockClear();
            const second = await withdrawToLinkedAccount(bank.id, 10_000, "withdraw-idem-001", "123456");
            expect(second.success).toBe(true);

            // Should not have called gateway again
            expect(mockFetch).not.toHaveBeenCalled();

            // Locked should only be incremented once
            const balance = await prisma.balance.findUnique({ where: { userId: user.id } });
            expect(balance!.locked).toBe(10_000);
        });
    });

    describe("gateway enqueue failure rollback", () => {
        it("rolls back locked funds and marks txn as Failure when gateway is unreachable", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 50_000, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 100_000 });
            await createTestTransactionPin(prisma, user.id, "123456");

            // Mock fetch to fail
            mockFetch.mockResolvedValue(
                new Response("Internal Server Error", { status: 500 })
            );

            const result = await withdrawToLinkedAccount(bank.id, 10_000, "withdraw-rollback-001", "123456");

            expect(result.success).toBe(false);

            const balance = await prisma.balance.findUnique({ where: { userId: user.id } });
            expect(balance!.locked).toBe(0);

            const offramp = await prisma.offRampTransaction.findUnique({ where: { token: "withdraw-rollback-001" } });
            expect(offramp!.status).toBe("Failure");
            expect(offramp!.failureReasonCode).toBe("GATEWAY_ENQUEUE_FAILED");
        });
    });

    describe("input validation", () => {
        it("fails with invalid bank account id", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 50_000, 0);
            await createTestTransactionPin(prisma, user.id, "123456");

            const result = await withdrawToLinkedAccount(0, 10_000, "withdraw-test-006", "123456");
            expect(result.success).toBe(false);
            if (result.success) return;
            expect(result.errorCode).toBe("ACCOUNT_NOT_FOUND");
        });

        it("fails with non-positive amount", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestBalance(prisma, user.id, 50_000, 0);
            const bank = await createTestLinkedBankAccount(prisma, user.id, { amount: 100_000 });
            await createTestTransactionPin(prisma, user.id, "123456");

            const result = await withdrawToLinkedAccount(bank.id, 0, "withdraw-test-007", "123456");
            expect(result.success).toBe(false);
        });
    });
});
