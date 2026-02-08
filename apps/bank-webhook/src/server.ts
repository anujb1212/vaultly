import express from "express";
import { webhookRouter } from "./webhook/router";

export function createServer() {
    const app = express();

    app.use(
        express.json({
            verify: (req: any, _res, buf) => {
                req.rawBody = buf;
            },
        })
    );

    app.get("/health", (_req, res) => res.json({ status: "ok" }));

    app.use(webhookRouter);

    return app;
}
