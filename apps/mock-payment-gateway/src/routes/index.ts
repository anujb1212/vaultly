import { Router } from "express";
import { adminDlqRouter } from "./api/adminDlq";
import { processPaymentRouter } from "./api/processPayment";
import { processWithdrawRouter } from "./api/processWithdraw";
import Redis from "ioredis";
import { redisConnection } from "../config/redis";

export const routesRouter = Router();

routesRouter.get("/health", async (_req, res) => {
    try {
        const redis = new Redis(redisConnection);
        await redis.ping();
        await redis.quit();
        res.json({ status: "ok", redis: "ok" });
    } catch (err) {
        res.status(503).json({
            status: "degraded",
            redis: "unreachable",
            error: (err instanceof Error ? err.message : "unknown"),
        });
    }
});

routesRouter.use("/api", processPaymentRouter);
routesRouter.use("/api", processWithdrawRouter);
routesRouter.use("/api/admin", adminDlqRouter);
