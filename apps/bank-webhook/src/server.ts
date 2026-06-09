import express from "express";
import { webhookRouter } from "./webhook/router";
import db from "@repo/db/client";

declare module "http" {
    interface IncomingMessage {
        rawBody?: Buffer;
    }
}

export function createServer() {
    const app = express();

    app.use(
        express.json({
            limit: "10kb",
            type: "application/json",
            verify: (req, _res, buf) => {
                req.rawBody = buf;
            },
        })
    );

    app.get("/health", async (_req, res) => {
        try {
            await db.$queryRaw`SELECT 1`;
            res.json({ status: "ok" });
        } catch {
            res.status(503).json({ status: "degraded", reason: "database unreachable" });
        }
    });

    app.use(webhookRouter);

    app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error("[server] unhandled error:", err);
        res.status(500).json({ message: "Internal server error" });
    });

    return app;
}
