export type FailureClass = "transient" | "permanent" | "unknown";

export type ReplayHistoryEntry = {
    at: string;
    actor?: string;
    reason?: string;
    enqueuedJobId: string;
    preservedWebhookEventId?: string;
};

export type WebhookJobData = {
    payload: any;
    secret: string;
    url: string;
    webhookEventId: string;

    // metadata when copied to DLQ
    failureReason?: string;
    failureClass?: FailureClass;
    failedAt?: string;
    attempts?: number;
    sourceQueue?: string;
    sourceJobId?: string | number | null;
    sourceJobName?: string;

    // admin 
    archivedAt?: string;
    archivedBy?: string;
    archiveReason?: string;
    replayHistory?: ReplayHistoryEntry[];
};
