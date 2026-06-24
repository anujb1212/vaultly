import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { redisConnection } from "./redis";
import { QUEUE_PREFIX } from "./securityQueue";
import { processSecurityEvent } from "../utils/securityInsights";
import type { SecurityEventInput } from "../utils/securityInsights";

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

export function startSecurityWorker(): Worker {
    if (workerSingleton) return workerSingleton;

    const worker = new Worker(
        "security-events",
        async (job) => {
            const input = job.data as SecurityEventInput;
            const prisma = getWorkerPrisma();

            await processSecurityEvent(prisma, input);
        },
        {
            connection: redisConnection,
            prefix: QUEUE_PREFIX,
            concurrency: parseInt(process.env.SECURITY_WORKER_CONCURRENCY ?? "3"),
        }
    );

    worker.on("failed", (job, err) => {
        console.error("[Worker][security-events] Job failed:", {
            jobId: job?.id,
            type: (job?.data as SecurityEventInput)?.type,
            error: err.message,
            attempts: job?.attemptsMade,
        });
    });

    worker.on("error", (err) => {
        console.error("[Worker][security-events] Worker error:", err.message);
    });

    workerSingleton = worker;
    console.log("[Worker][security-events] Started (concurrency:", worker.opts.concurrency, ")");
    return workerSingleton;
}

export async function stopSecurityWorker(): Promise<void> {
    if (workerSingleton) {
        await workerSingleton.close();
        workerSingleton = null;
    }
    if (prismaForWorker) {
        await prismaForWorker.$disconnect();
        prismaForWorker = null;
    }
}
