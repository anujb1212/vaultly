import crypto from "crypto";
import { Job } from "bullmq";
import { dlqQueue, webhookQueue } from "../bullmq/queues";
import type { ReplayHistoryEntry, WebhookJobData } from "../bullmq/jobTypes";

function generateWebhookEventId(): string {
    return crypto.randomUUID();
}

export async function getDLQJobs(opts?: {
    states?: Array<"waiting" | "active" | "completed" | "failed" | "delayed" | "paused">;
    offset?: number;
    limit?: number;
    includeArchived?: boolean;
}) {
    const states = opts?.states ?? ["waiting", "delayed", "failed", "completed"];
    const offset = Math.max(0, opts?.offset ?? 0);
    const limit = Math.min(200, Math.max(1, opts?.limit ?? 50));

    const jobs = await dlqQueue.getJobs(
        states as any,
        offset,
        offset + limit - 1,
        true
    );

    const includeArchived = Boolean(opts?.includeArchived);

    return jobs
        .filter((job) =>
            includeArchived ? true : !Boolean((job.data as WebhookJobData)?.archivedAt)
        )
        .map((job) => {
            const data = job.data as WebhookJobData;
            return {
                id: job.id,
                name: job.name,
                state: job.finishedOn ? "completed" : undefined,
                token: data?.payload?.token,
                webhookEventId: data?.webhookEventId,
                failureReason: data?.failureReason,
                failureClass: data?.failureClass,
                failedAt: data?.failedAt,
                attempts: data?.attempts,
                archivedAt: data?.archivedAt,
                replayCount: Array.isArray(data?.replayHistory)
                    ? data.replayHistory.length
                    : 0,
            };
        });
}

async function findDLQJobByPredicate(
    predicate: (data: WebhookJobData) => boolean
): Promise<Job<WebhookJobData> | null> {
    const states: Array<"waiting" | "delayed" | "failed" | "completed"> = [
        "waiting",
        "delayed",
        "failed",
        "completed",
    ];
    const jobs = await dlqQueue.getJobs(states as any, 0, 999, true);

    for (const j of jobs) {
        const data = j.data as WebhookJobData;
        if (data && predicate(data)) return j as any;
    }
    return null;
}

export async function resolveDLQJobRef(ref: {
    dlqJobId?: string;
    token?: string;
    webhookEventId?: string;
}) {
    if (ref.dlqJobId) {
        const job = await dlqQueue.getJob(ref.dlqJobId);
        return (job as any) as Job<WebhookJobData> | null;
    }
    if (ref.webhookEventId) {
        return findDLQJobByPredicate((d) => d.webhookEventId === ref.webhookEventId);
    }
    if (ref.token) {
        return findDLQJobByPredicate(
            (d) => String(d?.payload?.token ?? "") === ref.token
        );
    }
    return null;
}

export async function archiveDLQJob(args: {
    dlqJobId: string;
    actor?: string;
    reason?: string;
}) {
    const job = await dlqQueue.getJob(args.dlqJobId);
    if (!job) return { ok: false as const, error: "DLQ_JOB_NOT_FOUND" as const };

    const data = (job.data ?? {}) as WebhookJobData;
    if (data.archivedAt) return { ok: true as const, already: true as const };

    await job.updateData({
        ...data,
        archivedAt: new Date().toISOString(),
        archivedBy: args.actor,
        archiveReason: args.reason,
    });

    return { ok: true as const };
}

export async function replayDLQJob(args: {
    dlqJobId: string;
    actor?: string;
    reason?: string;
    archiveAfter?: boolean;
    preserveWebhookEventId?: boolean;
}) {
    const job = await dlqQueue.getJob(args.dlqJobId);
    if (!job) return { ok: false as const, error: "DLQ_JOB_NOT_FOUND" as const };

    const data = (job.data ?? {}) as WebhookJobData;
    if (data.archivedAt) return { ok: false as const, error: "DLQ_JOB_ARCHIVED" as const };

    const token = String(data?.payload?.token ?? "");
    const preservedWebhookEventId =
        args.preserveWebhookEventId === false
            ? generateWebhookEventId()
            : data.webhookEventId;

    const replayJobId = `replay-${token || "unknown"}-${job.id}-${Date.now()}`;

    await webhookQueue.add(
        "send-webhook",
        {
            ...data,
            webhookEventId: preservedWebhookEventId,
        } satisfies WebhookJobData,
        { jobId: replayJobId, delay: 0 }
    );

    const prevHistory = Array.isArray(data.replayHistory) ? data.replayHistory : [];
    const entry: ReplayHistoryEntry = {
        at: new Date().toISOString(),
        actor: args.actor,
        reason: args.reason,
        enqueuedJobId: replayJobId,
        preservedWebhookEventId,
    };

    await job.updateData({
        ...data,
        replayHistory: [...prevHistory, entry],
    });

    if (args.archiveAfter) {
        await archiveDLQJob({
            dlqJobId: String(job.id),
            actor: args.actor,
            reason: "ARCHIVED_AFTER_REPLAY",
        });
    }

    return {
        ok: true as const,
        replayJobId,
        webhookEventId: preservedWebhookEventId
    };
}
