import type { Request, Response, NextFunction } from "express";

export function adminAuth(req: Request, res: Response, next: NextFunction) {
    const expected = process.env.ADMIN_API_TOKEN;
    if (!expected) return res.status(500).json({ message: "ADMIN_API_TOKEN_NOT_SET" });

    const auth = String(req.header("Authorization") ?? "");
    const tokenFromAuth = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
    const token = tokenFromAuth || String(req.header("X-Admin-Token") ?? "");

    if (!token || token !== expected) {
        return res.status(401).json({ message: "UNAUTHORIZED" });
    }

    next();
}
