// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";

// import { authOptions } from "../../../../lib/auth";
// import { rateLimit } from "../../../../lib/redis/rateLimit";

// import { prisma } from "@repo/db";
// import { generateAISecurityInsightsForUser } from "../../../../lib/security/generateAISecurityInsights";

// function parseIntParam(value: string | null) {
//     if (!value) return null;
//     const n = Number(value);
//     if (!Number.isFinite(n)) return null;
//     return Math.trunc(n);
// }

// function getUserIdNumberFromSession(session: any) {
//     const raw = session?.user?.id;
//     const n = Number(raw);
//     return Number.isFinite(n) ? n : null;
// }

// export async function GET(req: Request) {
//     const session = await getServerSession(authOptions as any);
//     const userId = getUserIdNumberFromSession(session);

//     if (!userId) {
//         return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
//     }

//     const url = new URL(req.url);
//     const limit = Math.min(parseIntParam(url.searchParams.get("limit")) ?? 10, 25);
//     const cursor = parseIntParam(url.searchParams.get("cursor"));

//     const items = await prisma.aISecurityInsight.findMany({
//         where: {
//             userId,
//             status: { in: ["COMPLETED", "FAILED"] },
//         },
//         orderBy: { createdAt: "desc" },
//         take: limit,
//         ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
//         select: {
//             id: true,
//             createdAt: true,
//             severity: true,
//             title: true,
//             summary: true,
//             recommendedActions: true,
//             status: true,
//         },
//     });

//     const nextCursor = items.length === limit ? items[items.length - 1]?.id ?? null : null;

//     return NextResponse.json(
//         { items, nextCursor },
//         {
//             headers: {
//                 "cache-control": "no-store",
//             },
//         }
//     );
// }

// export async function POST() {
//     const session = await getServerSession(authOptions as any);
//     const userId = getUserIdNumberFromSession(session);

//     if (!userId) {
//         return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
//     }

//     const rl = await rateLimit({
//         key: `ai:security-insights:refresh:${userId}`,
//         limit: 3,
//         windowSec: 60,
//     });

//     if (!rl.allowed) {
//         return NextResponse.json(
//             { error: "RATE_LIMITED", retryAfterSec: rl.ttl },
//             { status: 429, headers: { "retry-after": String(rl.ttl) } }
//         );
//     }

//     const result = await generateAISecurityInsightsForUser({ userId, maxToGenerate: 3 });

//     return NextResponse.json(
//         {
//             ok: true,
//             generated: result.generated,
//             skipped: result.skipped,
//         },
//         {
//             headers: {
//                 "cache-control": "no-store",
//             },
//         }
//     );
// }
