import crypto from "crypto";

export function computeSignatureHex(rawBody: Buffer, secret: string): string {
    return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function safeEq(a: string, b: string): boolean {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}
