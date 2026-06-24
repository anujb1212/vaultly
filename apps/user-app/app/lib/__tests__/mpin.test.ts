import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

// Mock rateLimit to always allow — we're testing PIN logic, not rate limiting
vi.mock("../../redis/rateLimit", () => ({
    rateLimit: vi.fn().mockResolvedValue({ allowed: true, current: 1, ttl: 0 }),
}));

// Mock server-only package
vi.mock("server-only", () => ({}));

import { verifyMpinOrThrow, VerifyMpinError } from "../security/verifyMpin";
import {
    getTestPrisma,
    resetDatabase,
    createTestUser,
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

describe("MPIN verification (integration)", () => {
    describe("correct PIN", () => {
        it("succeeds with correct 6-digit PIN", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestTransactionPin(prisma, user.id, "123456");

            await expect(
                verifyMpinOrThrow({ userId: user.id, mpin: "123456", context: { action: "P2P_TRANSFER" } })
            ).resolves.toBeUndefined();
        });

        it("resets failedAttempts to 0 on successful verify after failures", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestTransactionPin(prisma, user.id, "123456", { failedAttempts: 3 });

            await verifyMpinOrThrow({ userId: user.id, mpin: "123456", context: { action: "P2P_TRANSFER" } });

            const pin = await prisma.transactionPin.findUnique({ where: { userId: user.id } });
            expect(pin!.failedAttempts).toBe(0);
            expect(pin!.lockedUntil).toBeNull();
        });
    });

    describe("wrong PIN", () => {
        it("throws PIN_INVALID on wrong PIN", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestTransactionPin(prisma, user.id, "123456");

            await expect(
                verifyMpinOrThrow({ userId: user.id, mpin: "999999", context: { action: "P2P_TRANSFER" } })
            ).rejects.toThrow(VerifyMpinError);

            try {
                await verifyMpinOrThrow({ userId: user.id, mpin: "999999", context: { action: "P2P_TRANSFER" } });
            } catch (e) {
                expect(e instanceof VerifyMpinError).toBe(true);
                expect((e as VerifyMpinError).code).toBe("PIN_INVALID");
            }
        });

        it("increments failedAttempts on each wrong attempt", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestTransactionPin(prisma, user.id, "123456");

            for (let i = 0; i < 3; i++) {
                try {
                    await verifyMpinOrThrow({ userId: user.id, mpin: "000000", context: { action: "P2P_TRANSFER" } });
                } catch {}
            }

            const pin = await prisma.transactionPin.findUnique({ where: { userId: user.id } });
            expect(pin!.failedAttempts).toBe(3);
            expect(pin!.lockedUntil).toBeNull();
        });
    });

    describe("lockout", () => {
        it("locks after 5 consecutive failures", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestTransactionPin(prisma, user.id, "123456");

            for (let i = 0; i < 5; i++) {
                try {
                    await verifyMpinOrThrow({ userId: user.id, mpin: "000000", context: { action: "P2P_TRANSFER" } });
                } catch {}
            }

            const pin = await prisma.transactionPin.findUnique({ where: { userId: user.id } });
            expect(pin!.failedAttempts).toBe(5);
            expect(pin!.lockedUntil).not.toBeNull();
            expect(pin!.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
        });

        it("rejects with PIN_LOCKED when already locked", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
            await createTestTransactionPin(prisma, user.id, "123456", {
                failedAttempts: 5,
                lockedUntil: lockUntil,
            });

            try {
                await verifyMpinOrThrow({ userId: user.id, mpin: "123456", context: { action: "P2P_TRANSFER" } });
                expect.fail("Should have thrown");
            } catch (e) {
                expect(e instanceof VerifyMpinError).toBe(true);
                expect((e as VerifyMpinError).code).toBe("PIN_LOCKED");
                expect((e as VerifyMpinError).retryAfterSec).toBeGreaterThan(0);
            }
        });

        it("allows verification after lock expires", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            const lockUntil = new Date(Date.now() - 1000); // expired
            await createTestTransactionPin(prisma, user.id, "123456", {
                failedAttempts: 5,
                lockedUntil: lockUntil,
            });

            await expect(
                verifyMpinOrThrow({ userId: user.id, mpin: "123456", context: { action: "P2P_TRANSFER" } })
            ).resolves.toBeUndefined();

            const pin = await prisma.transactionPin.findUnique({ where: { userId: user.id } });
            expect(pin!.failedAttempts).toBe(0);
            expect(pin!.lockedUntil).toBeNull();
        });
    });

    describe("validation", () => {
        it("throws PIN_REQUIRED when mpin is undefined", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestTransactionPin(prisma, user.id, "123456");

            try {
                await verifyMpinOrThrow({ userId: user.id, mpin: undefined, context: { action: "P2P_TRANSFER" } });
                expect.fail("Should have thrown");
            } catch (e) {
                expect(e instanceof VerifyMpinError).toBe(true);
                expect((e as VerifyMpinError).code).toBe("PIN_REQUIRED");
            }
        });

        it("throws PIN_INVALID for non-6-digit PIN", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestTransactionPin(prisma, user.id, "123456");

            try {
                await verifyMpinOrThrow({ userId: user.id, mpin: "12345", context: { action: "P2P_TRANSFER" } });
                expect.fail("Should have thrown");
            } catch (e) {
                expect(e instanceof VerifyMpinError).toBe(true);
                expect((e as VerifyMpinError).code).toBe("PIN_INVALID");
            }
        });

        it("throws PIN_NOT_SET when no PIN exists for user", async () => {
            const user = await createTestUser(prisma, { id: 1 });

            try {
                await verifyMpinOrThrow({ userId: user.id, mpin: "123456", context: { action: "P2P_TRANSFER" } });
                expect.fail("Should have thrown");
            } catch (e) {
                expect(e instanceof VerifyMpinError).toBe(true);
                expect((e as VerifyMpinError).code).toBe("PIN_NOT_SET");
            }
        });
    });

    describe("concurrent attempts", () => {
        it("multiple concurrent wrong PINs don't exceed lockout threshold incorrectly", async () => {
            const user = await createTestUser(prisma, { id: 1 });
            await createTestTransactionPin(prisma, user.id, "123456");

            // Fire 3 concurrent wrong attempts
            const results = await Promise.allSettled([
                verifyMpinOrThrow({ userId: user.id, mpin: "000000", context: { action: "P2P_TRANSFER" } }),
                verifyMpinOrThrow({ userId: user.id, mpin: "000000", context: { action: "P2P_TRANSFER" } }),
                verifyMpinOrThrow({ userId: user.id, mpin: "000000", context: { action: "P2P_TRANSFER" } }),
            ]);

            const failures = results.filter((r) => r.status === "rejected");
            expect(failures.length).toBe(3);

            const pin = await prisma.transactionPin.findUnique({ where: { userId: user.id } });
            // Should have incremented (exact count depends on serialization, but should be <= 3)
            expect(pin!.failedAttempts).toBeGreaterThan(0);
            expect(pin!.failedAttempts).toBeLessThanOrEqual(3);
        });
    });
});
