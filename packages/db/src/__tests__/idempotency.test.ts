import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import { IdempotencyManager } from "../utils/idempotency";
import { getTestPrisma, resetDatabase, createTestUser } from "./setup";

const prisma = getTestPrisma();
let idemManager: IdempotencyManager;

beforeAll(async () => {
    await prisma.$connect();
    idemManager = new IdempotencyManager(prisma);
});

afterAll(async () => {
    await prisma.$disconnect();
});

beforeEach(async () => {
    await resetDatabase(prisma);
});

describe("IdempotencyManager (integration)", () => {
    describe("checkAndStore", () => {
        it("returns exists=false on first call (creates key)", async () => {
            const user = await createTestUser(prisma, { id: 1 });

            const result = await idemManager.checkAndStore("test-key-001", user.id, "P2P_TRANSFER");

            expect(result.exists).toBe(false);

            const stored = await prisma.idempotencyKey.findUnique({ where: { key: "test-key-001" } });
            expect(stored).not.toBeNull();
            expect(stored!.userId).toBe(user.id);
            expect(stored!.action).toBe("P2P_TRANSFER");
        });

        it("returns exists=true with cached response on second call", async () => {
            const user = await createTestUser(prisma, { id: 1 });

            await idemManager.checkAndStore("test-key-002", user.id, "P2P_TRANSFER");
            await idemManager.updateResponse("test-key-002", { success: true, txnId: 42 });

            const result = await idemManager.checkAndStore("test-key-002", user.id, "P2P_TRANSFER");

            expect(result.exists).toBe(true);
            expect(result.response).toEqual({ success: true, txnId: 42 });
        });

        it("returns exists=false when response is null (in-flight request)", async () => {
            const user = await createTestUser(prisma, { id: 1 });

            // First call creates the key with null response
            await idemManager.checkAndStore("test-key-003", user.id, "P2P_TRANSFER");

            // Second call before updateResponse — response is still null
            const result = await idemManager.checkAndStore("test-key-003", user.id, "P2P_TRANSFER");

            expect(result.exists).toBe(false);
        });

        it("returns exists=false and refreshes expired key", async () => {
            const user = await createTestUser(prisma, { id: 1 });

            // Create a key that's already expired
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() - 1); // 1 hour ago

            await prisma.idempotencyKey.create({
                data: {
                    key: "test-key-expired",
                    userId: user.id,
                    action: "P2P_TRANSFER",
                    response: { old: "data" },
                    expiresAt,
                },
            });

            const result = await idemManager.checkAndStore("test-key-expired", user.id, "P2P_TRANSFER");

            expect(result.exists).toBe(false);

            const updated = await prisma.idempotencyKey.findUnique({ where: { key: "test-key-expired" } });
            expect(updated!.expiresAt.getTime()).toBeGreaterThan(Date.now());
        });

        it("works within a transaction (txClient)", async () => {
            const user = await createTestUser(prisma, { id: 1 });

            const result = await prisma.$transaction(async (tx) => {
                return idemManager.checkAndStore("test-key-tx-001", user.id, "P2P_TRANSFER", 24, tx);
            });

            expect(result.exists).toBe(false);

            const stored = await prisma.idempotencyKey.findUnique({ where: { key: "test-key-tx-001" } });
            expect(stored).not.toBeNull();
        });

        it("respects custom TTL", async () => {
            const user = await createTestUser(prisma, { id: 1 });

            await idemManager.checkAndStore("test-key-ttl", user.id, "P2P_TRANSFER", 48);

            const stored = await prisma.idempotencyKey.findUnique({ where: { key: "test-key-ttl" } });
            const now = new Date();
            const diffHours = (stored!.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

            expect(diffHours).toBeGreaterThan(47);
            expect(diffHours).toBeLessThan(49);
        });
    });

    describe("updateResponse", () => {
        it("stores JSON response on existing key", async () => {
            const user = await createTestUser(prisma, { id: 1 });

            await idemManager.checkAndStore("test-key-update-001", user.id, "P2P_TRANSFER");
            await idemManager.updateResponse("test-key-update-001", { result: "ok", id: 99 });

            const stored = await prisma.idempotencyKey.findUnique({ where: { key: "test-key-update-001" } });
            expect(stored!.response).toEqual({ result: "ok", id: 99 });
        });

        it("works within a transaction", async () => {
            const user = await createTestUser(prisma, { id: 1 });

            await idemManager.checkAndStore("test-key-update-tx", user.id, "P2P_TRANSFER");

            await prisma.$transaction(async (tx) => {
                await idemManager.updateResponse("test-key-update-tx", { tx: true }, tx);
            });

            const stored = await prisma.idempotencyKey.findUnique({ where: { key: "test-key-update-tx" } });
            expect(stored!.response).toEqual({ tx: true });
        });
    });

    describe("cleanup", () => {
        it("deletes only expired keys", async () => {
            const user = await createTestUser(prisma, { id: 1 });

            const expiredAt = new Date();
            expiredAt.setHours(expiredAt.getHours() - 1);
            const futureAt = new Date();
            futureAt.setHours(futureAt.getHours() + 24);

            await prisma.idempotencyKey.create({
                data: { key: "expired-1", userId: user.id, action: "A", response: {}, expiresAt: expiredAt },
            });
            await prisma.idempotencyKey.create({
                data: { key: "expired-2", userId: user.id, action: "B", response: {}, expiresAt: expiredAt },
            });
            await prisma.idempotencyKey.create({
                data: { key: "valid-1", userId: user.id, action: "C", response: {}, expiresAt: futureAt },
            });

            const deleted = await idemManager.cleanup();

            expect(deleted).toBe(2);

            const remaining = await prisma.idempotencyKey.findMany();
            expect(remaining).toHaveLength(1);
            expect(remaining[0]!.key).toBe("valid-1");
        });
    });

    describe("concurrent same-key", () => {
        it("only one call gets exists=false, others get cached response", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            const key = "concurrent-key-001";

            // First call creates the key
            await idemManager.checkAndStore(key, user.id, "P2P_TRANSFER");
            await idemManager.updateResponse(key, { done: true });

            // Simulate concurrent calls
            const results = await Promise.all([
                idemManager.checkAndStore(key, user.id, "P2P_TRANSFER"),
                idemManager.checkAndStore(key, user.id, "P2P_TRANSFER"),
                idemManager.checkAndStore(key, user.id, "P2P_TRANSFER"),
            ]);

            for (const r of results) {
                expect(r.exists).toBe(true);
                expect(r.response).toEqual({ done: true });
            }
        });
    });
});
