import { Router } from "express";
import { z } from "zod";
import { adminAuth } from "../../middleware/adminAuth";
import { archiveDLQJob, getDLQJobs, replayDLQJob, resolveDLQJobRef, } from "../../dlq/dlqStore";

export const adminDlqRouter = Router();

adminDlqRouter.get("/admin/dlq/list", adminAuth, async (req, res) => {
    const limit = Number(req.query.limit ?? 50);
    const offset = Number(req.query.offset ?? 0);
    const includeArchived = String(req.query.includeArchived ?? "false") === "true";

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

adminDlqRouter.post("/admin/dlq/replay", adminAuth, async (req, res) => {
    const parsed = ReplaySingleSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ message: "INVALID_REQUEST", issues: parsed.error.issues });
    }

    const actor = String(req.header("X-Admin-Actor") ?? "admin");
    const { dlqJobId, token, webhookEventId, reason, archiveAfter, preserveWebhookEventId } = parsed.data;

    const job = await resolveDLQJobRef({ dlqJobId, token, webhookEventId });
    if (!job?.id) return res.status(404).json({ message: "DLQ_JOB_NOT_FOUND" });

    const out = await replayDLQJob({
        dlqJobId: String(job.id),
        actor,
        reason: reason ?? "MANUAL_REPLAY",
        archiveAfter,
        preserveWebhookEventId,
    });

    if (!out.ok) return res.status(400).json(out);
    return res.json(out);
});

const ReplayBulkSchema = z.object({
    failureClass: z.enum(["transient", "permanent", "unknown"]).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    sleepMs: z.coerce.number().int().min(0).max(5_000).default(100),
    archiveAfter: z.boolean().optional().default(true),
    reason: z.string().optional(),
});

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

adminDlqRouter.post("/admin/dlq/replay-bulk", adminAuth, async (req, res) => {
    const parsed = ReplayBulkSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ message: "INVALID_REQUEST", issues: parsed.error.issues });
    }

    const actor = String(req.header("X-Admin-Actor") ?? "admin");
    const { failureClass, limit, sleepMs, archiveAfter, reason } = parsed.data;

    const jobs = await getDLQJobs({ limit: 500, offset: 0, includeArchived: false });
    const filtered = jobs
        .filter((j) => (failureClass ? j.failureClass === failureClass : true))
        .slice(0, limit);

    const results: Array<any> = [];
    for (const j of filtered) {
        const out = await replayDLQJob({
            dlqJobId: String(j.id),
            actor,
            reason: reason ?? "BULK_REPLAY",
            archiveAfter,
            preserveWebhookEventId: true,
        });
        results.push({ dlqJobId: j.id, ...out });
        if (sleepMs > 0) await sleep(sleepMs);
    }

    return res.json({ requested: limit, replayed: results.length, results });
});

const ArchiveSchema = z.object({
    dlqJobId: z.string(),
    reason: z.string().optional(),
});

adminDlqRouter.post("/admin/dlq/archive", adminAuth, async (req, res) => {
    const parsed = ArchiveSchema.safeParse(req.body);
    if (!parsed.success) {
        return res
            .status(400)
            .json({ message: "INVALID_REQUEST", issues: parsed.error.issues });
    }

    const actor = String(req.header("X-Admin-Actor") ?? "admin");
    const out = await archiveDLQJob({
        dlqJobId: parsed.data.dlqJobId,
        actor,
        reason: parsed.data.reason ?? "MANUAL_ARCHIVE",
    });

    if (!out.ok) return res.status(404).json(out);
    return res.json(out);
});
