import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { computeSignatureHex, safeEq } from "../webhook/signature";

const SECRET = "test-webhook-secret";

describe("Signature verification (unit)", () => {
    describe("computeSignatureHex", () => {
        it("produces correct HMAC-SHA256 hex", () => {
            const body = Buffer.from('{"type":"ONRAMP"}');
            const expected = crypto.createHmac("sha256", SECRET).update(body).digest("hex");
            expect(computeSignatureHex(body, SECRET)).toBe(expected);
        });

        it("produces 64-char hex string (32 bytes)", () => {
            const sig = computeSignatureHex(Buffer.from("test"), SECRET);
            expect(sig).toHaveLength(64);
            expect(sig).toMatch(/^[0-9a-f]{64}$/);
        });

        it("different body produces different signature", () => {
            const sig1 = computeSignatureHex(Buffer.from("body1"), SECRET);
            const sig2 = computeSignatureHex(Buffer.from("body2"), SECRET);
            expect(sig1).not.toBe(sig2);
        });

        it("different secret produces different signature", () => {
            const sig1 = computeSignatureHex(Buffer.from("body"), "secret1");
            const sig2 = computeSignatureHex(Buffer.from("body"), "secret2");
            expect(sig1).not.toBe(sig2);
        });
    });

    describe("safeEq", () => {
        it("returns true for matching signatures", () => {
            const sig = computeSignatureHex(Buffer.from("test"), SECRET);
            expect(safeEq(sig, sig)).toBe(true);
        });

        it("returns false for different signatures", () => {
            const sig1 = computeSignatureHex(Buffer.from("body1"), SECRET);
            const sig2 = computeSignatureHex(Buffer.from("body2"), SECRET);
            expect(safeEq(sig1, sig2)).toBe(false);
        });

        it("returns false for wrong-length signature (not 32 bytes)", () => {
            const sig = computeSignatureHex(Buffer.from("test"), SECRET);
            expect(safeEq(sig, "abc123")).toBe(false);
        });

        it("returns false for empty string", () => {
            const sig = computeSignatureHex(Buffer.from("test"), SECRET);
            expect(safeEq(sig, "")).toBe(false);
        });

        it("returns false for invalid hex input", () => {
            const sig = computeSignatureHex(Buffer.from("test"), SECRET);
            expect(safeEq(sig, "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz")).toBe(false);
        });

        it("returns false when both inputs are wrong length", () => {
            expect(safeEq("short", "short")).toBe(false);
        });
    });
});
