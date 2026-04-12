export type FailureClass = "transient" | "permanent" | "unknown";

export type ReplayHistoryEntry = {
    at: string;
    actor: string;
    reason?: string;
    enqueuedJobId: string;
    preservedWebhookEventId?: string;
};

export type OnRampPayload = {
    type: "ONRAMP";
    token: string;
    user_identifier: string;
    amount: number;
    status: "Success" | "Failure";
    failureReasonCode?: string;
    failureReasonMessage?: string
};

export type OffRampPayload = {
    type: "OFFRAMP";
    token: string;
    user_identifier: string;
    amount: number;
    linkedBankAccountId: number;
    status: "Success" | "Failure";
    failureReasonCode?: string;
    failureReasonMessage?: string;
};

export type WebhookPayload = OnRampPayload | OffRampPayload;

export type WebhookJobData = {
    payload: WebhookPayload;
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
