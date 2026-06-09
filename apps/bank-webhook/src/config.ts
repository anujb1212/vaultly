function requireEnv(key: string, fallback: string, requireInProd = false): string {
    const val = process.env[key] || fallback;
    if (requireInProd && process.env.NODE_ENV === "production" && !process.env[key]) {
        throw new Error(`[config] ${key} must be set in production`);
    }
    return val;
}

function parsePort(raw: string | undefined, fallback: number): number {
    const port = parseInt(raw || "", 10);
    if (!Number.isFinite(port) || port < 1 || port > 65535) return fallback;
    return port;
}

export const config = {
    port: parsePort(process.env.PORT, 3003),
    webhookSecret: requireEnv("WEBHOOK_SECRET", "dev_secret", true)
} as const;

export function validateConfig(): void {
    if (process.env.NODE_ENV === "production" && !process.env.WEBHOOK_SECRET) {
        throw new Error("WEBHOOK_SECRET must be set in production")
    }
}
