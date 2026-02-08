import { Router } from "express";
import { adminDlqRouter } from "./api/adminDlq";
import { processPaymentRouter } from "./api/processPayment";
import { processWithdrawRouter } from "./api/processWithdraw";

export const routesRouter = Router();

routesRouter.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

routesRouter.use("/api", processPaymentRouter);
routesRouter.use("/api", processWithdrawRouter);
routesRouter.use("/api", adminDlqRouter);
