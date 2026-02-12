export const config = {
    port: Number(process.env.PORT ?? 3003),
    webhookSecret: process.env.WEBHOOK_SECRET ?? "dev_secret",
} as const;
