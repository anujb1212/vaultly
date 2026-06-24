import { describe, it, expect } from "vitest";
import { webhookBodySchema } from "../webhook/schema";

describe("Webhook schema validation (unit)", () => {
    const validOnramp = {
        type: "ONRAMP" as const,
        token: "abc-123",
        user_identifier: "42",
        amount: 10000,
        status: "Success" as const,
    };

    const validOfframp = {
        type: "OFFRAMP" as const,
        token: "abc-456",
        user_identifier: "42",
        amount: 5000,
        status: "Failure" as const,
        linkedBankAccountId: 1,
    };

    it("parses valid ONRAMP payload", () => {
        const result = webhookBodySchema.safeParse(validOnramp);
        expect(result.success).toBe(true);
    });

    it("parses valid OFFRAMP payload with linkedBankAccountId", () => {
        const result = webhookBodySchema.safeParse(validOfframp);
        expect(result.success).toBe(true);
    });

    it("parses ONRAMP with optional failure fields", () => {
        const result = webhookBodySchema.safeParse({
            ...validOnramp,
            status: "Failure",
            failureReasonCode: "BANK_TIMEOUT",
            failureReasonMessage: "Bank did not respond",
        });
        expect(result.success).toBe(true);
    });

    it("rejects missing type field", () => {
        const { type, ...noType } = validOnramp;
        const result = webhookBodySchema.safeParse(noType);
        expect(result.success).toBe(false);
    });

    it("rejects invalid type (not ONRAMP/OFFRAMP)", () => {
        const result = webhookBodySchema.safeParse({ ...validOnramp, type: "INVALID" });
        expect(result.success).toBe(false);
    });

    it("rejects non-positive amount", () => {
        const result = webhookBodySchema.safeParse({ ...validOnramp, amount: 0 });
        expect(result.success).toBe(false);
    });

    it("rejects negative amount", () => {
        const result = webhookBodySchema.safeParse({ ...validOnramp, amount: -100 });
        expect(result.success).toBe(false);
    });

    it("rejects amount exceeding max (₹1,00,00,000)", () => {
        const result = webhookBodySchema.safeParse({ ...validOnramp, amount: 100_000_000_01 });
        expect(result.success).toBe(false);
    });

    it("rejects non-integer amount", () => {
        const result = webhookBodySchema.safeParse({ ...validOnramp, amount: 100.5 });
        expect(result.success).toBe(false);
    });

    it("rejects OFFRAMP without linkedBankAccountId", () => {
        const { linkedBankAccountId, ...noLinked } = validOfframp;
        const result = webhookBodySchema.safeParse(noLinked);
        expect(result.success).toBe(false);
    });

    it("rejects OFFRAMP with non-positive linkedBankAccountId", () => {
        const result = webhookBodySchema.safeParse({ ...validOfframp, linkedBankAccountId: 0 });
        expect(result.success).toBe(false);
    });

    it("rejects empty token", () => {
        const result = webhookBodySchema.safeParse({ ...validOnramp, token: "" });
        expect(result.success).toBe(false);
    });

    it("rejects empty user_identifier", () => {
        const result = webhookBodySchema.safeParse({ ...validOnramp, user_identifier: "" });
        expect(result.success).toBe(false);
    });

    it("rejects invalid status value", () => {
        const result = webhookBodySchema.safeParse({ ...validOnramp, status: "Pending" });
        expect(result.success).toBe(false);
    });

    it("accepts amount at exactly max boundary", () => {
        const result = webhookBodySchema.safeParse({ ...validOnramp, amount: 100_000_000_00 });
        expect(result.success).toBe(true);
    });
});
