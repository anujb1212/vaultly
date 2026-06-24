import { Queue } from "bullmq";
import { redisConnection } from "./redis";
import type { SecurityEventInput } from "../utils/securityInsights";

const ENV = process.env.NODE_ENV ?? "development";
export const QUEUE_PREFIX = `{vaultly-${ENV}}`;

export const securityQueue = new Queue("security-events", {
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

securityQueue.on("error", (err) => {
    console.error("[Queue][security-events] Error:", err.message);
});

export async function enqueueSecurityEvent(input: SecurityEventInput): Promise<void> {
    await securityQueue.add("security-event", input);
}
