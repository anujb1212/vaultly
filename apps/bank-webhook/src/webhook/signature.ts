import crypto from "crypto";

export function computeSignatureHex(rawBody: Buffer, secret: string): string {
    return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function safeEq(a: string, b: string): boolean {
    const buffa = Buffer.from(String(a), "hex");
    const buffb = Buffer.from(String(b), "hex");

    if (buffa.length !== 32 || buffb.length !== 32) return false;

    return crypto.timingSafeEqual(buffa, buffb);
}
