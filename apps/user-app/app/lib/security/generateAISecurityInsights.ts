import "server-only";

import db, { auditLogger } from "@repo/db/client";
import { Prisma } from "@prisma/client";

import { checkAndConsumeAIQuota } from "./aiQuota";
import { generateAISecurityInsightWithGemini } from "./geminiClient";

type GenerateResult =
    | { ok: true; generated: number; skipped: null }
    | {
        ok: true;
        generated: number;
        skipped: "NO_PENDING_SIGNALS" | "USER_DAILY_CAP" | "GLOBAL_DAILY_CAP" | "CIRCUIT_OPEN" | "MISSING_API_KEY";
    };

export async function generateAISecurityInsightsForUser(opts: { userId: number; maxToGenerate?: number }): Promise<GenerateResult> {
    const maxToGenerate = Math.max(1, Math.min(opts.maxToGenerate ?? 3, 5));

    const pendingSignals = await db.securitySignal.findMany({
        where: {
            userId: opts.userId,
            insight: { is: null },
        },
        orderBy: { createdAt: "desc" },
        take: maxToGenerate,
        select: {
            id: true,
            type: true,
            severity: true,
            windowStart: true,
            windowEnd: true,
            metadata: true,
            createdAt: true,
        },
    });

    if (pendingSignals.length === 0) {
        return { ok: true, generated: 0, skipped: "NO_PENDING_SIGNALS" };
    }

    let generated = 0;

    for (const s of pendingSignals) {
        const quota = await checkAndConsumeAIQuota({ userId: opts.userId, feature: "security_insights" });
        if (!quota.allowed) {
            return {
                ok: true,
                generated,
                skipped: quota.reason,
            };
        }

        let insightId: number | null = null;
        try {
            const created = await db.aISecurityInsight.create({
                data: {
                    userId: opts.userId,
                    signalId: s.id,
                    severity: s.severity as any,
                    title: "Generating insight",
                    summary: "Pending",
                    recommendedActions: [],
                    provider: "gemini",
                    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
                    promptVersion: "ai-security-insights-v1",
                    status: "PENDING",
                },
                select: { id: true },
            });
            insightId = created.id;
        } catch (e: any) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                continue;
            }
            throw e;
        }

        const ai = await generateAISecurityInsightWithGemini({
            userId: opts.userId,
            signalPayload: {
                signal: {
                    type: s.type,
                    severity: s.severity,
                    windowStart: s.windowStart,
                    windowEnd: s.windowEnd,
                    context: s.metadata ?? {},
                },
                constraints: {
                    readOnly: true,
                    noMoneyMovement: true,
                    nonSensitive: true,
                },
            },
        });

        if (!ai.ok) {
            await db.aISecurityInsight.update({
                where: { id: insightId },
                data: {
                    status: "FAILED",
                    errorCode: ai.error,
                    title: "Insight unavailable",
                    summary: "AI insights are temporarily unavailable. Please try again later.",
                    recommendedActions: ["Review sessions", "Contact support"],
                    provider: ai.provider,
                    model: ai.model,
                    promptVersion: ai.promptVersion,
                },
            });

            if (ai.error === "CIRCUIT_OPEN" || ai.error === "MISSING_API_KEY") {
                return { ok: true, generated, skipped: ai.error };
            }

            continue;
        }

        await db.aISecurityInsight.update({
            where: { id: insightId },
            data: {
                status: "COMPLETED",
                title: ai.output.title,
                summary: ai.output.summary,
                recommendedActions: ai.output.recommendedActions,
                provider: ai.provider,
                model: ai.model,
                promptVersion: ai.promptVersion,
            },
        });

        await auditLogger.createAuditLog({
            userId: opts.userId,
            action: "INSIGHT_CREATED",
            entityType: "AISecurityInsight",
            entityId: insightId,
            newValue: {
                insightId,
                signalId: s.id,
                severity: s.severity,
                provider: ai.provider,
                model: ai.model,
                promptVersion: ai.promptVersion,
            },
            metadata: {
                signalType: s.type,
            },
        });

        generated += 1;
    }

    return { ok: true, generated, skipped: null };
}
