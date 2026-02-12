import crypto from "crypto";

export function computeSignatureHex(rawBody: Buffer, secret: string): string {
    return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function safeEq(a: string, b: string): boolean {
    const buffa = Buffer.from(String(a));
    const buffb = Buffer.from(String(b));
    if (buffa.length !== buffb.length) return false;
    return crypto.timingSafeEqual(buffa, buffb);
}
