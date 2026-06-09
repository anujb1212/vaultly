import { Router } from "express";
import { z } from "zod";
import { adminAuth } from "../../middleware/adminAuth";
import { archiveDLQJob, getDLQJobs, replayDLQJob, resolveDLQJobRef, } from "../../dlq/dlqStore";

export const adminDlqRouter = Router();

const ListQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    includeArchived: z.coerce.boolean().default(false),
});

adminDlqRouter.get("/dlq/list", adminAuth, async (req, res) => {
    const parsed = ListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({
            message: "INVALID_REQUEST",
            issues: parsed.error.issues
        });
    }

    const { limit, offset, includeArchived } = parsed.data;

    const jobs = await getDLQJobs({ limit, offset, includeArchived });
    return res.json({ count: jobs.length, jobs });
});

const ReplaySingleSchema = z.object({
    dlqJobId: z.string().optional(),
    token: z.string().optional(),
    webhookEventId: z.string().optional(),
    reason: z.string().optional(),
    archiveAfter: z.boolean().optional().default(true),
    preserveWebhookEventId: z.boolean().optional().default(true),
});

adminDlqRouter.post("/dlq/replay", adminAuth, async (req, res) => {
    const parsed = ReplaySingleSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ message: "INVALID_REQUEST", issues: parsed.error.issues });
    }

    const rawActor = String(req.header("X-Admin-Actor") ?? "admin");
    const actor = rawActor.slice(0, 100).replace(/[^\w@.\-]/g, "_");

    const { dlqJobId, token, webhookEventId, reason, archiveAfter, preserveWebhookEventId } = parsed.data;

    const job = await resolveDLQJobRef({ dlqJobId, token, webhookEventId });
    if (!job) return res.status(404).json({ message: "DLQ_JOB_NOT_FOUND" });

    const out = await replayDLQJob({
        dlqJobId: String(job.id),
        actor,
        reason: reason ?? "MANUAL_REPLAY",
        archiveAfter,
        preserveWebhookEventId,
    });

    if (!out.ok) {
        const status = out.error === "DLQ_JOB_NOT_FOUND" ? 404
            : out.error === "DLQ_JOB_ARCHIVED" ? 409
                : out.error === "REPLAY_ENQUEUE_FAILED" ? 503
                    : 400;
        return res.status(status).json(out);
    }

    return res.json(out);
});

const ReplayBulkSchema = z.object({
    failureClass: z.enum(["transient", "permanent", "unknown"]).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    sleepMs: z.coerce.number().int().min(0).max(1_000).default(100),
    archiveAfter: z.boolean().optional().default(true),
    reason: z.string().optional(),
});

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

adminDlqRouter.post("/dlq/replay-bulk", adminAuth, async (req, res) => {
    const parsed = ReplayBulkSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ message: "INVALID_REQUEST", issues: parsed.error.issues });
    }

    const rawActor = String(req.header("X-Admin-Actor") ?? "admin");
    const actor = rawActor.slice(0, 100).replace(/[^\w@.\-]/g, "_");

    const { failureClass, limit, sleepMs, archiveAfter, reason } = parsed.data;

    const jobs = await getDLQJobs({ limit: 200, offset: 0, includeArchived: false });

    const filtered = jobs
        .filter((j) => (failureClass ? j.failureClass === failureClass : true))
        .slice(0, limit);

    const results: Array<any> = [];
    let redisDown = false

    for (const j of filtered) {
        try {
            const out = await replayDLQJob({
                dlqJobId: String(j.id),
                actor,
                reason: reason ?? "BULK_REPLAY",
                archiveAfter,
                preserveWebhookEventId: true,
            });

            results.push({ dlqJobId: j.id, ...out });

            if (!out.ok && out.error === "REPLAY_ENQUEUE_FAILED") {
                redisDown = true;
                break; // Redis down 
            }

        } catch (loopErr) {
            results.push({ dlqJobId: j.id, ok: false, error: "UNEXPECTED_ERROR" });
        }

        if (sleepMs > 0) await sleep(sleepMs);
    }

    return res.json({
        requested: limit,
        replayed: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
        results,
        ...(redisDown && { warning: "Stopped early — Redis unavailable" }),
        ...(jobs.length === 200 && {
            warning: "DLQ may have more jobs — pagination not supported, run again",
        })
    })
});

const ArchiveSchema = z.object({
    dlqJobId: z.string(),
    reason: z.string().optional(),
});

adminDlqRouter.post("/dlq/archive", adminAuth, async (req, res) => {
    const parsed = ArchiveSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ message: "INVALID_REQUEST", issues: parsed.error.issues });
    }

    const rawActor = String(req.header("X-Admin-Actor") ?? "admin");
    const actor = rawActor.slice(0, 100).replace(/[^\w@.\-]/g, "_");

    const out = await archiveDLQJob({
        dlqJobId: parsed.data.dlqJobId,
        actor,
        reason: parsed.data.reason ?? "MANUAL_ARCHIVE",
    });

    if (!out.ok) return res.status(404).json(out);
    return res.json(out);
});
