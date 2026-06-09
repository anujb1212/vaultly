import { Job } from "bullmq";
import crypto from "crypto";
import type { ReplayHistoryEntry, WebhookJobData, WebhookPayload } from "../bullmq/jobTypes";
import { dlqQueue, webhookQueue } from "../bullmq/queues";

const DLQ_STATES = ["waiting", "delayed", "failed", "completed"] as const;
const MAX_REPLAY_HISTORY = 50;

function generateWebhookEventId(): string {
    return crypto.randomUUID();
}

type DLQJobSummary = {
    id: string | undefined;
    name: string;
    token: string | undefined;
    webhookEventId: string | undefined;
    type: "ONRAMP" | "OFFRAMP" | null;
    userIdentifier: string | null;
    userId: number | null;
    amount: number | null;
    linkedBankAccountId: string | null;
    failureReason: string | undefined;
    failureClass: string | undefined;
    failedAt: string | undefined;
    attempts: number | undefined;
    archivedAt: string | undefined;
    replayCount: number;
};

export async function getDLQJobs(opts?: {
    states?: Array<"waiting" | "active" | "completed" | "failed" | "delayed" | "paused">;
    offset?: number;
    limit?: number;
    includeArchived?: boolean;
}): Promise<DLQJobSummary[]> {
    const states = opts?.states ?? [...DLQ_STATES];
    const offset = Math.max(0, opts?.offset ?? 0);
    const limit = Math.min(200, Math.max(1, opts?.limit ?? 50));

    const jobs = await dlqQueue.getJobs(
        states,
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
            const p = data?.payload as WebhookPayload | undefined;
            const userIdentifier = p?.user_identifier ?? null;
            const userId = Number.isFinite(Number(userIdentifier))
                ? Number(userIdentifier)
                : null;
            const type = p?.type ?? null;

            return {
                id: job.id,
                name: job.name,
                token: data?.payload?.token,
                webhookEventId: data?.webhookEventId,
                type,
                userIdentifier,
                userId,
                amount: p?.amount ?? null,
                linkedBankAccountId: (p as any)?.linkedBankAccountId ?? null,
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
    const PAGE_SIZE = 100;
    let offset = 0;

    while (true) {
        const page = await dlqQueue.getJobs(
            [...DLQ_STATES],
            offset,
            offset + PAGE_SIZE - 1,
            true
        );
        if (page.length === 0) return null;

        for (const j of page) {
            const data = j.data as WebhookJobData;
            if (data && predicate(data)) return j;
        }

        if (page.length < PAGE_SIZE) return null;
        offset += PAGE_SIZE;
    }
}

export async function resolveDLQJobRef(ref: {
    dlqJobId?: string;
    token?: string;
    webhookEventId?: string;
}) {
    if (ref.dlqJobId) {
        const job = await dlqQueue.getJob(ref.dlqJobId);
        return job as Job<WebhookJobData> | null;
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

    try {
        await webhookQueue.add(
            "send-webhook",
            {
                ...data,
                webhookEventId: preservedWebhookEventId,
            } satisfies WebhookJobData,
            { jobId: replayJobId, delay: 0 }
        );
    } catch (enqueueError) {
        console.error(JSON.stringify({
            level: "critical",
            event: "dlq_replay_enqueue_failed",
            dlqJobId: args.dlqJobId,
            token,
            error: (enqueueError as Error)?.message,
        }));

        return {
            ok: false as const,
            error: "REPLAY_ENQUEUE_FAILED" as const,
        }
    }

    const prevHistory = Array.isArray(data.replayHistory)
        ? data.replayHistory.slice(-MAX_REPLAY_HISTORY)
        : [];

    const entry: ReplayHistoryEntry = {
        at: new Date().toISOString(),
        actor: args.actor ?? "system",
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
