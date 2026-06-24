import { createServer } from "./server";
import { config } from "./config";
import db, { startAuditWorker, startSecurityWorker, stopAuditWorker, stopSecurityWorker } from "@repo/db/client";

const app = createServer();

const server = app.listen(config.port, () => {
    console.log(`[bank-webhook] listening on 0.0.0.0:${config.port}`);
});

startAuditWorker();
startSecurityWorker();

server.timeout = 15_000;

server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
        console.error(`[bank-webhook] port ${config.port} already in use`);
    } else {
        console.error("[bank-webhook] server error:", err);
    }
    process.exit(1);
});

async function shutdown(signal: string) {
    console.log(`[bank-webhook] ${signal} received, shutting down`);
    server.close(async () => {
        await stopAuditWorker();
        await stopSecurityWorker();
        await db.$disconnect();
        console.log("[bank-webhook] shutdown complete");
        process.exit(0);
    });

    //If graceful shutdown takes too long
    setTimeout(() => {
        console.error("[bank-webhook] forced shutdown after timeout");
        process.exit(1);
    }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
