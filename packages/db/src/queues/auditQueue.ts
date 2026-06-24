import { Queue } from "bullmq";
import { redisConnection } from "./redis";
import type { AuditLogEntry } from "../utils/auditLogger";

const ENV = process.env.NODE_ENV ?? "development";
export const QUEUE_PREFIX = `{vaultly-${ENV}}`;

export const auditQueue = new Queue("audit-logs", {
    connection: redisConnection,
    prefix: QUEUE_PREFIX,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});

auditQueue.on("error", (err) => {
    console.error("[Queue][audit-logs] Error:", err.message);
});

export async function enqueueAuditLog(entry: AuditLogEntry): Promise<void> {
    await auditQueue.add("audit-log", entry);
}
