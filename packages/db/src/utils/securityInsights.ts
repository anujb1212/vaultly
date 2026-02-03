import crypto from "crypto";
import type { PrismaClient, Prisma } from "@prisma/client";

export type SecurityEventInput = {
    userId: number;
    type:
    | "SESSION_CREATED"
    | "LOGIN_FAILED"
    | "PIN_VERIFY_FAILED"
    | "PIN_LOCKED"
    | "P2P_INITIATED"
    | "P2P_COMPLETED"
    | "P2P_FAILED"
    | "ONRAMP_INITIATED"
    | "ONRAMP_COMPLETED"
    | "ONRAMP_FAILED"
    | "OFFRAMP_INITIATED"
    | "OFFRAMP_COMPLETED"
    | "OFFRAMP_FAILED"
    | "EMAIL_ADDED";
    source: "user-app" | "bank-webhook" | "mock-gateway" | string;
    sourceId?: string | null;
    occurredAt?: Date;
    ip?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
};

export type SecuritySeverity = "LOW" | "MEDIUM" | "HIGH";
export type SecuritySignalType =
    | "NEW_DEVICE"
    | "NEW_SESSION_SPIKE"
    | "RAPID_PIN_FAILURES"
    | "LARGE_TRANSFER"
    | "FIRST_TIME_RECIPIENT"
    | "RAPID_RETRIES"
    | "ONRAMP_FAILURES";

function sha256Base64Url(input: string) {
    return crypto.createHash("sha256").update(input).digest("base64url");
}

function safeJsonValue(input?: Record<string, unknown>): Prisma.InputJsonValue | undefined {
    if (!input) return undefined;

    return JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue;
}

export function bucketizeAmount(amountPaise: number | null | undefined) {
    if (!amountPaise || amountPaise <= 0) return "unknown";
    if (amountPaise < 10_000) return "small";
    if (amountPaise < 100_000) return "medium";
    if (amountPaise < 1_000_000) return "large";
    return "very_large";
}

export function scrubTextNumbers(text: string) {
    return text.replace(/\d{4,}/g, "****");
}

function computeWindow(date: Date, windowMinutes: number) {
    const ms = date.getTime();
    const windowMs = windowMinutes * 60_000;
    const start = new Date(Math.floor(ms / windowMs) * windowMs);
    const end = new Date(start.getTime() + windowMs);
    return { start, end };
}

function makeDedupeKey(userId: number, type: SecuritySignalType, windowStart: Date, extra?: string) {
    return sha256Base64Url(`${userId}:${type}:${windowStart.toISOString()}:${extra ?? ""}`);
}

export function deriveSignalsFromEvent(e: {
    type: SecurityEventInput["type"];
    occurredAt: Date;
    metadata: Record<string, unknown>;
    deviceHash?: string | null;
}): Array<{
    type: SecuritySignalType;
    severity: SecuritySeverity;
    windowMinutes: number;
    extra?: string;
    metadata: Record<string, unknown>;
}> {
    const m = e.metadata ?? {};

    switch (e.type) {
        case "SESSION_CREATED": {
            return [
                {
                    type: "NEW_DEVICE",
                    severity: "LOW",
                    windowMinutes: 24 * 60,
                    extra: String(e.deviceHash ?? "unknown"),
                    metadata: { reason: "New session", device: "new_or_unknown" },
                },
            ];
        }

        case "PIN_VERIFY_FAILED": {
            return [
                {
                    type: "RAPID_PIN_FAILURES",
                    severity: "MEDIUM",
                    windowMinutes: 30,
                    metadata: { reason: "PIN verification failed" },
                },
            ];
        }

        case "PIN_LOCKED": {
            return [
                {
                    type: "RAPID_PIN_FAILURES",
                    severity: "HIGH",
                    windowMinutes: 24 * 60,
                    metadata: { reason: "PIN locked" },
                },
            ];
        }

        case "P2P_INITIATED": {
            const amountBucket = String(m["amountBucket"] ?? "unknown");
            const firstTimeRecipient = Boolean(m["firstTimeRecipient"] ?? false);

            const out: Array<ReturnType<typeof deriveSignalsFromEvent>[number]> = [];

            if (amountBucket === "large" || amountBucket === "very_large") {
                out.push({
                    type: "LARGE_TRANSFER",
                    severity: amountBucket === "very_large" ? "HIGH" : "MEDIUM",
                    windowMinutes: 6 * 60,
                    metadata: { reason: "Large transfer initiated", amountBucket },
                });
            }

            if (firstTimeRecipient) {
                out.push({
                    type: "FIRST_TIME_RECIPIENT",
                    severity: "MEDIUM",
                    windowMinutes: 24 * 60,
                    metadata: { reason: "First-time recipient", recipient: "new" },
                });
            }

            return out;
        }

        case "P2P_FAILED": {
            return [
                {
                    type: "RAPID_RETRIES",
                    severity: "MEDIUM",
                    windowMinutes: 60,
                    metadata: { reason: "P2P failed" },
                },
            ];
        }

        case "ONRAMP_FAILED": {
            return [
                {
                    type: "ONRAMP_FAILURES",
                    severity: "MEDIUM",
                    windowMinutes: 6 * 60,
                    metadata: { reason: "Onramp failed" },
                },
            ];
        }

        case "OFFRAMP_FAILED": {
            return [
                {
                    type: "RAPID_RETRIES",
                    severity: "MEDIUM",
                    windowMinutes: 60,
                    metadata: { reason: "Offramp failed" },
                },
            ];
        }

        default:
            return [];
    }
}

export async function emitSecurityEvent(prisma: PrismaClient, input: SecurityEventInput) {
    const occurredAt = input.occurredAt ?? new Date();

    const ipHash = input.ip ? sha256Base64Url(input.ip) : null;
    const deviceHash = input.userAgent ? sha256Base64Url(input.userAgent) : null;

    const event = await prisma.securityEvent.create({
        data: {
            userId: input.userId,
            type: input.type as any,
            source: input.source,
            sourceId: input.sourceId ?? null,
            occurredAt,
            ipHash,
            deviceHash,
            metadata: safeJsonValue(input.metadata),
        },
    });

    const derived = deriveSignalsFromEvent({
        type: input.type,
        occurredAt,
        metadata: (safeJsonValue(input.metadata) as any) ?? {},
        deviceHash,
    });

    for (const s of derived) {
        const { start, end } = computeWindow(occurredAt, s.windowMinutes);
        const dedupeKey = makeDedupeKey(input.userId, s.type, start, s.extra);

        await prisma.securitySignal.upsert({
            where: {
                userId_dedupeKey: {
                    userId: input.userId,
                    dedupeKey,
                },
            },
            create: {
                userId: input.userId,
                type: s.type as any,
                severity: s.severity as any,
                dedupeKey,
                windowStart: start,
                windowEnd: end,
                metadata: safeJsonValue(s.metadata),
                eventId: event.id,
            },
            update: {
                severity: s.severity as any,
                metadata: safeJsonValue(s.metadata),
            },
        });
    }

    return { eventId: event.id };
}
