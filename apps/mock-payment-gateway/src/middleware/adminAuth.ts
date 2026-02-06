
function getClientIp(req: any): string {
    return String(
        req.headers["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
        req.socket?.remoteAddress ||
        ""
    );
}

export function adminAuth(req: any, res: any, next: any) {
    const requiredToken = process.env.ADMIN_TOKEN;
    if (!requiredToken) {
        return res.status(500).json({ message: "ADMIN_TOKEN not set" });
    }

    const provided = String(req.header("X-Admin-Token") ?? "");
    if (provided !== requiredToken) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const allowlist = String(process.env.ADMIN_IP_ALLOWLIST ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    if (allowlist.length > 0) {
        const ip = getClientIp(req);
        if (!allowlist.includes(ip)) {
            return res.status(403).json({ message: "Forbidden" });
        }
    }

    next();
}