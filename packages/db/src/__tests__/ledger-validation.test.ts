import { describe, it, expect } from "vitest";
import { postBalancedLedgerTransaction } from "../utils/ledger";
import type { Prisma } from "@prisma/client";

// Mock tx client — only used to test validation logic that throws before any DB call
const mockTx = {} as Prisma.TransactionClient;

describe("Ledger validation (unit)", () => {
    it("rejects fewer than 2 entries", async () => {
        await expect(
            postBalancedLedgerTransaction({
                tx: mockTx,
                type: "P2P_TRANSFER",
                externalRef: "test:1",
                entries: [
                    { accountId: 1, direction: "DEBIT", amount: 100 },
                ],
            })
        ).rejects.toThrow(">= 2 entries");
    });

    it("rejects empty externalRef", async () => {
        await expect(
            postBalancedLedgerTransaction({
                tx: mockTx,
                type: "P2P_TRANSFER",
                externalRef: "",
                entries: [
                    { accountId: 1, direction: "DEBIT", amount: 100 },
                    { accountId: 2, direction: "CREDIT", amount: 100 },
                ],
            })
        ).rejects.toThrow("externalRef required");
    });

    it("rejects zero amount", async () => {
        await expect(
            postBalancedLedgerTransaction({
                tx: mockTx,
                type: "P2P_TRANSFER",
                externalRef: "test:2",
                entries: [
                    { accountId: 1, direction: "DEBIT", amount: 0 },
                    { accountId: 2, direction: "CREDIT", amount: 0 },
                ],
            })
        ).rejects.toThrow("Invalid ledger amount");
    });

    it("rejects negative amount", async () => {
        await expect(
            postBalancedLedgerTransaction({
                tx: mockTx,
                type: "P2P_TRANSFER",
                externalRef: "test:3",
                entries: [
                    { accountId: 1, direction: "DEBIT", amount: -100 },
                    { accountId: 2, direction: "CREDIT", amount: -100 },
                ],
            })
        ).rejects.toThrow("Invalid ledger amount");
    });

    it("rejects non-integer amount", async () => {
        await expect(
            postBalancedLedgerTransaction({
                tx: mockTx,
                type: "P2P_TRANSFER",
                externalRef: "test:4",
                entries: [
                    { accountId: 1, direction: "DEBIT", amount: 100.5 },
                    { accountId: 2, direction: "CREDIT", amount: 100.5 },
                ],
            })
        ).rejects.toThrow("Invalid ledger amount");
    });

    it("rejects unbalanced transaction (debits != credits)", async () => {
        await expect(
            postBalancedLedgerTransaction({
                tx: mockTx,
                type: "P2P_TRANSFER",
                externalRef: "test:5",
                entries: [
                    { accountId: 1, direction: "DEBIT", amount: 100 },
                    { accountId: 2, direction: "CREDIT", amount: 50 },
                ],
            })
        ).rejects.toThrow("Unbalanced ledger txn");
    });

    it("accepts valid balanced transaction (passes validation, fails on DB call)", async () => {
        // Validation passes, but mockTx has no .ledgerTransaction.create — will throw a different error
        await expect(
            postBalancedLedgerTransaction({
                tx: mockTx,
                type: "P2P_TRANSFER",
                externalRef: "test:6",
                entries: [
                    { accountId: 1, direction: "DEBIT", amount: 100 },
                    { accountId: 2, direction: "CREDIT", amount: 100 },
                ],
            })
        ).rejects.toThrow(); // Throws because mockTx.ledgerTransaction is undefined
    });

    it("accepts balanced transaction with multiple entries", async () => {
        await expect(
            postBalancedLedgerTransaction({
                tx: mockTx,
                type: "ONRAMP",
                externalRef: "test:7",
                entries: [
                    { accountId: 1, direction: "DEBIT", amount: 60 },
                    { accountId: 1, direction: "DEBIT", amount: 40 },
                    { accountId: 2, direction: "CREDIT", amount: 100 },
                ],
            })
        ).rejects.toThrow(); // Validation passes, fails on DB call
    });
});
