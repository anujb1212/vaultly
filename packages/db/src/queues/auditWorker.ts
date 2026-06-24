import { Worker } from "bullmq";
import { Prisma, PrismaClient } from "@prisma/client";
import { redisConnection } from "./redis";
import { QUEUE_PREFIX } from "./auditQueue";
import type { AuditLogEntry } from "../utils/auditLogger";

let workerSingleton: Worker | null = null;
let prismaForWorker: PrismaClient | null = null;

function getWorkerPrisma(): PrismaClient {
    if (!prismaForWorker) {
        prismaForWorker = new PrismaClient({
            datasources: { db: { url: process.env.DATABASE_URL } },
            log: [
                { emit: "stdout", level: "error" },
                { emit: "stdout", level: "warn" },
            ],
        });
    }
    return prismaForWorker;
}

export function startAuditWorker(): Worker {
    if (workerSingleton) return workerSingleton;

    const worker = new Worker(
        "audit-logs",
        async (job) => {
            const entry = job.data as AuditLogEntry;
            const prisma = getWorkerPrisma();

            await prisma.auditLog.create({
                data: {
                    userId: entry.userId,
                    action: entry.action,
                    entityType: entry.entityType,
                    entityId: entry.entityId,
                    oldValue: entry.oldValue ?? Prisma.JsonNull,
                    newValue: entry.newValue as Prisma.InputJsonValue,
                    metadata: (entry.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
                },
            });
        },
        {
            connection: redisConnection,
            prefix: QUEUE_PREFIX,
            concurrency: parseInt(process.env.AUDIT_WORKER_CONCURRENCY ?? "3"),
        }
    );

    worker.on("failed", (job, err) => {
        console.error("[Worker][audit-logs] Job failed:", {
            jobId: job?.id,
            action: (job?.data as AuditLogEntry)?.action,
            error: err.message,
            attempts: job?.attemptsMade,
        });
    });

    worker.on("error", (err) => {
        console.error("[Worker][audit-logs] Worker error:", err.message);
    });

    workerSingleton = worker;
    console.log("[Worker][audit-logs] Started (concurrency:", worker.opts.concurrency, ")");
    return workerSingleton;
}

export async function stopAuditWorker(): Promise<void> {
    if (workerSingleton) {
        await workerSingleton.close();
        workerSingleton = null;
    }
    if (prismaForWorker) {
        await prismaForWorker.$disconnect();
        prismaForWorker = null;
    }
}
