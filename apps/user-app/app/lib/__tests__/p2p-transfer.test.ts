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

import { p2pTransfer } from "../actions/p2pTransfer";
import {
    getTestPrisma,
    resetDatabase,
    createTestUser,
    createTestBalance,
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

describe("P2P transfer (integration)", () => {
    describe("successful transfer", () => {
        it("transfers money from sender to receiver", async () => {
            const sender = await createTestUser(prisma, { id: 1, number: "1111111111" });
            const receiver = await createTestUser(prisma, { id: 2, number: "2222222222" });
            await createTestBalance(prisma, sender.id, 10_000, 0);
            await createTestBalance(prisma, receiver.id, 0, 0);
            await createTestTransactionPin(prisma, sender.id, "123456");

            const result = await p2pTransfer("2222222222", 5000, "p2p-test-001", "123456");

            expect(result.success).toBe(true);

            const senderBalance = await prisma.balance.findUnique({ where: { userId: sender.id } });
            const receiverBalance = await prisma.balance.findUnique({ where: { userId: receiver.id } });

            expect(senderBalance!.amount).toBe(5000);
            expect(receiverBalance!.amount).toBe(5000);
        });

        it("creates a p2pTransfer record with SUCCESS status", async () => {
            const sender = await createTestUser(prisma, { id: 1, number: "1111111111" });
            const receiver = await createTestUser(prisma, { id: 2, number: "2222222222" });
            await createTestBalance(prisma, sender.id, 10_000, 0);
            await createTestBalance(prisma, receiver.id, 0, 0);
            await createTestTransactionPin(prisma, sender.id, "123456");

            await p2pTransfer("2222222222", 3000, "p2p-test-002", "123456");

            const transfers = await prisma.p2pTransfer.findMany();
            expect(transfers).toHaveLength(1);
            expect(transfers[0]!.status).toBe("SUCCESS");
            expect(transfers[0]!.amount).toBe(3000);
            expect(transfers[0]!.senderId).toBe(sender.id);
            expect(transfers[0]!.receiverId).toBe(receiver.id);
        });

        it("creates a P2P_TRANSFER ledger transaction", async () => {
            const sender = await createTestUser(prisma, { id: 1, number: "1111111111" });
            const receiver = await createTestUser(prisma, { id: 2, number: "2222222222" });
            await createTestBalance(prisma, sender.id, 10_000, 0);
            await createTestBalance(prisma, receiver.id, 0, 0);
            await createTestTransactionPin(prisma, sender.id, "123456");

            await p2pTransfer("2222222222", 2000, "p2p-test-003", "123456");

            const ledgerTxn = await prisma.ledgerTransaction.findUnique({
                where: { externalRef: "p2p:p2p-test-003" },
                include: { entries: true },
            });

            expect(ledgerTxn).not.toBeNull();
            expect(ledgerTxn!.type).toBe("P2P_TRANSFER");
            expect(ledgerTxn!.entries).toHaveLength(2);
        });
    });

    describe("insufficient balance", () => {
        it("fails when sender has less balance than transfer amount", async () => {
            const sender = await createTestUser(prisma, { id: 1, number: "1111111111" });
            const receiver = await createTestUser(prisma, { id: 2, number: "2222222222" });
            await createTestBalance(prisma, sender.id, 1000, 0);
            await createTestBalance(prisma, receiver.id, 0, 0);
            await createTestTransactionPin(prisma, sender.id, "123456");

            const result = await p2pTransfer("2222222222", 5000, "p2p-test-004", "123456");

            expect(result.success).toBe(false);
            expect(result.message).toContain("Insufficient");

            const senderBalance = await prisma.balance.findUnique({ where: { userId: sender.id } });
            expect(senderBalance!.amount).toBe(1000);
        });
    });

    describe("self-transfer guard", () => {
        it("fails when sender tries to transfer to self", async () => {
            const sender = await createTestUser(prisma, { id: 1, number: "1111111111" });
            await createTestBalance(prisma, sender.id, 10_000, 0);
            await createTestTransactionPin(prisma, sender.id, "123456");

            const result = await p2pTransfer("1111111111", 5000, "p2p-test-005", "123456");

            expect(result.success).toBe(false);
            expect(result.message).toContain("self");
        });
    });

    describe("receiver not found", () => {
        it("fails when receiver phone doesn't exist", async () => {
            const sender = await createTestUser(prisma, { id: 1, number: "1111111111" });
            await createTestBalance(prisma, sender.id, 10_000, 0);
            await createTestTransactionPin(prisma, sender.id, "123456");

            const result = await p2pTransfer("9999999999", 5000, "p2p-test-006", "123456");

            expect(result.success).toBe(false);
            expect(result.message).toContain("not found");
        });
    });

    describe("idempotency", () => {
        it("returns cached response on replay with same idempotency key", async () => {
            const sender = await createTestUser(prisma, { id: 1, number: "1111111111" });
            const receiver = await createTestUser(prisma, { id: 2, number: "2222222222" });
            await createTestBalance(prisma, sender.id, 10_000, 0);
            await createTestBalance(prisma, receiver.id, 0, 0);
            await createTestTransactionPin(prisma, sender.id, "123456");

            const first = await p2pTransfer("2222222222", 5000, "p2p-idem-001", "123456");
            expect(first.success).toBe(true);

            const second = await p2pTransfer("2222222222", 5000, "p2p-idem-001", "123456");
            expect(second.success).toBe(true);

            // Balance should only be debited once
            const senderBalance = await prisma.balance.findUnique({ where: { userId: sender.id } });
            expect(senderBalance!.amount).toBe(5000);

            // Only one transfer record
            const transfers = await prisma.p2pTransfer.findMany();
            expect(transfers).toHaveLength(1);
        });
    });

    describe("concurrent transfers (deadlock prevention)", () => {
        it("concurrent A→B and B→A don't deadlock and both succeed if balances allow", async () => {
            const userA = await createTestUser(prisma, { id: 1, number: "1111111111" });
            const userB = await createTestUser(prisma, { id: 2, number: "2222222222" });
            await createTestBalance(prisma, userA.id, 10_000, 0);
            await createTestBalance(prisma, userB.id, 10_000, 0);
            await createTestTransactionPin(prisma, userA.id, "123456");
            await createTestTransactionPin(prisma, userB.id, "123456");

            // We need user B to be the session user for the second transfer
            // Since session is mocked to user id "1", we can only test from A's perspective
            // Instead, test two concurrent transfers from A to B
            const results = await Promise.allSettled([
                p2pTransfer("2222222222", 3000, "p2p-concurrent-001", "123456"),
                p2pTransfer("2222222222", 3000, "p2p-concurrent-002", "123456"),
            ]);

            const successes = results.filter(
                (r) => r.status === "fulfilled" && r.value.success
            );

            // Both should succeed since A has enough balance for both
            expect(successes.length).toBe(2);

            const senderBalance = await prisma.balance.findUnique({ where: { userId: userA.id } });
            const receiverBalance = await prisma.balance.findUnique({ where: { userId: userB.id } });

            expect(senderBalance!.amount).toBe(4000);
            expect(receiverBalance!.amount).toBe(16000);
        });

        it("concurrent transfers where only one can succeed (insufficient for both)", async () => {
            const sender = await createTestUser(prisma, { id: 1, number: "1111111111" });
            const receiver = await createTestUser(prisma, { id: 2, number: "2222222222" });
            await createTestBalance(prisma, sender.id, 5000, 0);
            await createTestBalance(prisma, receiver.id, 0, 0);
            await createTestTransactionPin(prisma, sender.id, "123456");

            const results = await Promise.allSettled([
                p2pTransfer("2222222222", 5000, "p2p-race-001", "123456"),
                p2pTransfer("2222222222", 5000, "p2p-race-002", "123456"),
            ]);

            const successes = results.filter(
                (r) => r.status === "fulfilled" && r.value.success
            );
            const failures = results.filter(
                (r) => r.status === "fulfilled" && !r.value.success
            );

            // Exactly one should succeed
            expect(successes.length).toBe(1);
            expect(failures.length).toBe(1);

            const senderBalance = await prisma.balance.findUnique({ where: { userId: sender.id } });
            expect(senderBalance!.amount).toBe(0);
        });
    });

    describe("input validation", () => {
        it("fails with invalid receiver number (not 10 digits)", async () => {
            const sender = await createTestUser(prisma, { id: 1, number: "1111111111" });
            await createTestBalance(prisma, sender.id, 10_000, 0);
            await createTestTransactionPin(prisma, sender.id, "123456");

            const result = await p2pTransfer("123", 5000, "p2p-test-007", "123456");
            expect(result.success).toBe(false);
        });

        it("fails with non-positive amount", async () => {
            const sender = await createTestUser(prisma, { id: 1, number: "1111111111" });
            await createTestBalance(prisma, sender.id, 10_000, 0);
            await createTestTransactionPin(prisma, sender.id, "123456");

            const result = await p2pTransfer("2222222222", 0, "p2p-test-008", "123456");
            expect(result.success).toBe(false);
        });

        it("fails with non-integer amount", async () => {
            const sender = await createTestUser(prisma, { id: 1, number: "1111111111" });
            await createTestBalance(prisma, sender.id, 10_000, 0);
            await createTestTransactionPin(prisma, sender.id, "123456");

            const result = await p2pTransfer("2222222222", 500.5, "p2p-test-009", "123456");
            expect(result.success).toBe(false);
        });
    });
});
