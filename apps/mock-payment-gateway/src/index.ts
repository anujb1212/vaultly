import cors from "cors";
import express from "express";
import { routesRouter } from "./routes";
import { startWebhookWorker } from "./bullmq/worker";
import { getDLQJobs, replayDLQJob } from "./dlq/dlqStore";

const app = express();
app.use(express.json());

const PORT = 3004;

app.use(
    cors({
        origin: process.env.CORS_ORIGIN ?? "http://localhost:3001",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "X-Admin-Token", "X-Admin-Actor"],
    })
);

startWebhookWorker();

const AUTO_REDRIVE_ENABLED = String(process.env.DLQ_AUTO_REDRIVE_ENABLED ?? "false") === "true";
const AUTO_REDRIVE_INTERVAL_MS = Number(process.env.DLQ_AUTO_REDRIVE_INTERVAL_MS ?? 60_000);
const AUTO_REDRIVE_LIMIT_PER_RUN = Number(process.env.DLQ_AUTO_REDRIVE_LIMIT_PER_RUN ?? 10);
const AUTO_REDRIVE_MAX_REPLAYS_PER_JOB = Number(process.env.DLQ_AUTO_REDRIVE_MAX_REPLAYS_PER_JOB ?? 3);

if (AUTO_REDRIVE_ENABLED) {
    setInterval(async () => {
        try {
            const jobs = await getDLQJobs({ limit: 200, offset: 0, includeArchived: false });
            const candidates = jobs
                .filter((j) => j.failureClass === "transient")
                .filter((j) => (j.replayCount ?? 0) < AUTO_REDRIVE_MAX_REPLAYS_PER_JOB)
                .slice(0, AUTO_REDRIVE_LIMIT_PER_RUN);


            for (const j of candidates) {
                await replayDLQJob({
                    dlqJobId: String(j.id),
                    actor: "auto-redrive",
                    reason: "AUTO_REDRIVE_TRANSIENT",
                    archiveAfter: false,
                    preserveWebhookEventId: true,
                });
            }
        } catch (e) {
            console.error("[DLQ][AutoRedrive] failed:", e);
        }
    }, Number.isFinite(AUTO_REDRIVE_INTERVAL_MS) ? AUTO_REDRIVE_INTERVAL_MS : 60_000);
}

app.use(routesRouter);

app.listen(PORT, () => {
    console.log(`Mock Gateway running on http://localhost:${PORT}`);
});
