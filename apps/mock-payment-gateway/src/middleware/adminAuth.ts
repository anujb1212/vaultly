import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

const ADMIN_TOKEN_ENV = "ADMIN_API_TOKEN";

export function validateAdminAuthConfig(): void {
    if (!process.env[ADMIN_TOKEN_ENV]) {
        throw new Error(`FATAL: ${ADMIN_TOKEN_ENV} environment variable is not set`);
    }
}

export function adminAuth(req: Request, res: Response, next: NextFunction) {
    const expected = process.env.ADMIN_API_TOKEN;
    if (!expected) return res.status(500).json({ message: "ADMIN_API_TOKEN_NOT_SET" });

    const auth = req.header("Authorization") ?? "";
    const tokenFromAuth = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
    const token = tokenFromAuth || (req.header("X-Admin-Token") ?? "");

    const expectedBuf = Buffer.from(expected, "utf8");
    const tokenBuf = Buffer.from(token, "utf8");
    const valid =
        expectedBuf.length === tokenBuf.length &&
        crypto.timingSafeEqual(expectedBuf, tokenBuf);

    if (!token || !valid) {
        return res.status(401).json({ message: "UNAUTHORIZED" });
    }

    next();
}
