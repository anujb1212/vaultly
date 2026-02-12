// import "server-only";

// import db, { auditLogger } from "@repo/db/client";

// import { consumeAIQuota, peekAIQuota } from "./aiQuota";
// import { generateAISecurityInsightWithGemini } from "./geminiClient";

// type GenerateResult =
//     | { ok: true; generated: number; skipped: null }
//     | {
//         ok: true;
//         generated: number;
//         skipped:
//         | "NO_PENDING_SIGNALS"
//         | "USER_DAILY_CAP"
//         | "GLOBAL_DAILY_CAP"
//         | "CIRCUIT_OPEN"
//         | "MISSING_API_KEY";
//     };

// export async function generateAISecurityInsightsForUser(opts: {
//     userId: number;
//     maxToGenerate?: number;
// }): Promise<GenerateResult> {
//     const maxToGenerate = Math.max(1, Math.min(opts.maxToGenerate ?? 3, 5));

//     const candidates = await db.securitySignal.findMany({
//         where: {
//             userId: opts.userId,
//             OR: [
//                 { insight: { is: null } },
//                 { insight: { is: { status: "FAILED" } } },
//             ],
//         },
//         orderBy: { createdAt: "desc" },
//         take: maxToGenerate,
//         select: {
//             id: true,
//             type: true,
//             severity: true,
//             windowStart: true,
//             windowEnd: true,
//             metadata: true,
//             createdAt: true,
//             insight: {
//                 select: {
//                     id: true,
//                     status: true,
//                     errorCode: true,
//                 },
//             },
//         },
//     });

//     if (candidates.length === 0) {
//         return { ok: true, generated: 0, skipped: "NO_PENDING_SIGNALS" };
//     }

//     let generated = 0;

//     for (const s of candidates) {
//         const quotaPeek = await peekAIQuota({
//             userId: opts.userId,
//             feature: "security_insights",
//         });

//         if (!quotaPeek.allowed) {
//             return { ok: true, generated, skipped: quotaPeek.reason };
//         }

//         let insightId: number | null = s.insight?.id ?? null;

//         if (insightId && s.insight?.status === "FAILED") {
//             await db.aISecurityInsight.update({
//                 where: { id: insightId },
//                 data: {
//                     status: "PENDING",
//                     title: "Generating insight",
//                     summary: "Pending",
//                     recommendedActions: [],
//                     errorCode: null,
//                 },
//             });
//         }

//         if (!insightId) {
//             const created = await db.aISecurityInsight.create({
//                 data: {
//                     userId: opts.userId,
//                     signalId: s.id,
//                     severity: s.severity as any,
//                     title: "Generating insight",
//                     summary: "Pending",
//                     recommendedActions: [],
//                     provider: "gemini",
//                     model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
//                     promptVersion: "ai-security-insights-v1",
//                     status: "PENDING",
//                 },
//                 select: { id: true },
//             });
//             insightId = created.id;
//         }

//         const ai = await generateAISecurityInsightWithGemini({
//             userId: opts.userId,
//             signalPayload: {
//                 signal: {
//                     type: s.type,
//                     severity: s.severity,
//                     windowStart: s.windowStart,
//                     windowEnd: s.windowEnd,
//                     context: s.metadata ?? {},
//                 },
//                 constraints: {
//                     readOnly: true,
//                     noMoneyMovement: true,
//                     nonSensitive: true,
//                 },
//             },
//         });

//         if (!ai.ok) {
//             await db.aISecurityInsight.update({
//                 where: { id: insightId },
//                 data: {
//                     status: "FAILED",
//                     errorCode: ai.error,
//                     title: "Insight unavailable",
//                     summary: "AI insights are temporarily unavailable. Please try again later.",
//                     recommendedActions: ["Review sessions", "Contact support"],
//                     provider: ai.provider,
//                     model: ai.model,
//                     promptVersion: ai.promptVersion,
//                 },
//             });

//             if (ai.error === "CIRCUIT_OPEN" || ai.error === "MISSING_API_KEY") {
//                 return { ok: true, generated, skipped: ai.error };
//             }

//             continue;
//         }

//         const quotaConsume = await consumeAIQuota({
//             userId: opts.userId,
//             feature: "security_insights",
//         });

//         if (!quotaConsume.allowed) {
//             await db.aISecurityInsight.update({
//                 where: { id: insightId },
//                 data: {
//                     status: "FAILED",
//                     errorCode: quotaConsume.reason,
//                     title: "Daily limit reached",
//                     summary: "You have reached your daily AI insights limit. Please try again tomorrow.",
//                     recommendedActions: ["Try again tomorrow"],
//                 },
//             });

//             return { ok: true, generated, skipped: quotaConsume.reason };
//         }

//         await db.aISecurityInsight.update({
//             where: { id: insightId },
//             data: {
//                 status: "COMPLETED",
//                 title: ai.output.title,
//                 summary: ai.output.summary,
//                 recommendedActions: ai.output.recommendedActions,
//                 provider: ai.provider,
//                 model: ai.model,
//                 promptVersion: ai.promptVersion,
//             },
//         });

//         await auditLogger.createAuditLog({
//             userId: opts.userId,
//             action: "INSIGHT_CREATED",
//             entityType: "AISecurityInsight",
//             entityId: insightId,
//             newValue: {
//                 insightId,
//                 signalId: s.id,
//                 severity: s.severity,
//                 provider: ai.provider,
//                 model: ai.model,
//                 promptVersion: ai.promptVersion,
//             },
//             metadata: {
//                 signalType: s.type,
//             },
//         });

//         generated += 1;
//         if (generated >= 3) break;
//     }

//     return { ok: true, generated, skipped: null };
// }
