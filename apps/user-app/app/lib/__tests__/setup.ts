import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcrypt";

const TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    "postgresql://postgres:prisma@localhost:5433/vaultly_test";

let prisma: PrismaClient;

export function getTestPrisma(): PrismaClient {
    if (!prisma) {
        prisma = new PrismaClient({
            datasources: { db: { url: TEST_DATABASE_URL } },
            log: [{ emit: "stdout", level: "error" }],
        });
    }
    return prisma;
}

const TABLE_ORDER = [
    "AISecurityInsight",
    "SecuritySignal",
    "SecurityEvent",
    "AuditLog",
    "IdempotencyKey",
    "LedgerEntry",
    "LedgerTransaction",
    "LedgerAccount",
    "OffRampTransaction",
    "OnRampTransaction",
    "p2pTransfer",
    "ArbitiumBridgeTransaction",
    "LinkedBankAccount",
    "Balance",
    "EmailVerificationToken",
    "UserSession",
    "TransactionPin",
    "User",
    "Merchant",
];

export async function resetDatabase(client?: PrismaClient) {
    const db = client ?? getTestPrisma();
    await db.$executeRawUnsafe('SET session_replication_role = "replica"');
    for (const table of TABLE_ORDER) {
        await db.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
    }
    await db.$executeRawUnsafe('SET session_replication_role = "origin"');
}

export async function createTestUser(
    client: PrismaClient,
    overrides: Partial<{ id: number; number: string; email: string; password: string }> = {}
) {
    return client.user.create({
        data: {
            ...(overrides.id ? { id: overrides.id } : {}),
            number: overrides.number ?? `9000000${Math.floor(Math.random() * 10000)}`,
            email: overrides.email ?? `test${Math.floor(Math.random() * 100000)}@test.com`,
            password: overrides.password ?? "$2b$12$placeholderhashplaceholderhashplaceholderhashplaceholder",
        },
    });
}

export async function createTestBalance(
    client: PrismaClient,
    userId: number,
    amount: number = 0,
    locked: number = 0
) {
    return client.balance.create({
        data: { userId, amount, locked },
    });
}

export async function createTestLinkedBankAccount(
    client: PrismaClient,
    userId: number,
    overrides: Partial<{ amount: number; locked: number; providerKey: string; id: number; displayName: string }> = {}
) {
    return client.linkedBankAccount.create({
        data: {
            ...(overrides.id ? { id: overrides.id } : {}),
            userId,
            providerKey: (overrides.providerKey ?? "HDFC") as any,
            displayName: overrides.displayName ?? "HDFC",
            maskedAccount: "****1234",
            amount: overrides.amount ?? 100_000_00,
            locked: overrides.locked ?? 0,
        },
    });
}

export async function createTestTransactionPin(
    client: PrismaClient,
    userId: number,
    pin: string = "123456",
    overrides: Partial<{ failedAttempts: number; lockedUntil: Date | null }> = {}
) {
    const pinHash = await bcrypt.hash(pin, 12);
    return client.transactionPin.create({
        data: {
            userId,
            pinHash,
            failedAttempts: overrides.failedAttempts ?? 0,
            lockedUntil: overrides.lockedUntil ?? null,
        },
    });
}
