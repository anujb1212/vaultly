"use client";

/**
 * Notes:
 * - Retry-After can be either <delay-seconds> or an HTTP date, so we parse both. [web:58]
 * - Next.js supports standard fetch options like `cache: "no-store"`. [web:44]
 * - Fetch credentials can be controlled via Request.credentials (we use same-origin explicitly). [web:114]
 */

import { RefreshCcw, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type AIInsightSeverity = "LOW" | "MEDIUM" | "HIGH";
type AIInsightStatus = "COMPLETED" | "FAILED";

type AISecurityInsightItem = {
    id: number;
    createdAt: string;
    severity: AIInsightSeverity;
    title: string;
    summary: string;
    recommendedActions: string[];
    status: AIInsightStatus;
};

type AISecurityInsightsResponse = {
    items: AISecurityInsightItem[];
    nextCursor: number | null;
};

type GenerateResponse = {
    ok: true;
    generated: number;
    skipped:
    | null
    | "NO_PENDING_SIGNALS"
    | "USER_DAILY_CAP"
    | "GLOBAL_DAILY_CAP"
    | "CIRCUIT_OPEN"
    | "MISSING_API_KEY";
};

type RateLimitedResponse = {
    error: "RATE_LIMITED";
    retryAfterSec?: number;
};

function formatCreatedAt(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function severityBadgeClass(severity: AIInsightSeverity) {
    switch (severity) {
        case "HIGH":
            return "bg-red-500/10 text-red-400 border-red-500/20";
        case "MEDIUM":
            return "bg-amber-500/10 text-amber-400 border-amber-500/20";
        case "LOW":
        default:
            return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
}

function parseRetryAfterSeconds(retryAfterHeader: string | null): number | null {
    if (!retryAfterHeader) return null;

    const asInt = Number.parseInt(retryAfterHeader, 10);
    if (!Number.isNaN(asInt) && asInt >= 0) return asInt;

    const asDateMs = Date.parse(retryAfterHeader);
    if (!Number.isNaN(asDateMs)) {
        const diffSec = Math.ceil((asDateMs - Date.now()) / 1000);
        return Math.max(0, diffSec);
    }

    return null;
}

function skippedMessage(skipped: GenerateResponse["skipped"], generated: number): string {
    if (generated > 0) return `Generated ${generated} insight${generated === 1 ? "" : "s"}.`;
    if (!skipped) return "No new insights were generated.";

    switch (skipped) {
        case "NO_PENDING_SIGNALS":
            return "No new signals to analyze right now.";
        case "USER_DAILY_CAP":
        case "GLOBAL_DAILY_CAP":
            return "Daily AI quota reached. Try again tomorrow.";
        case "CIRCUIT_OPEN":
            return "AI temporarily paused due to provider throttling. Try later.";
        case "MISSING_API_KEY":
            return "AI not configured. Contact support.";
        default:
            return "No new insights were generated.";
    }
}

export function AISecurityInsightsPanel() {
    const [items, setItems] = useState<AISecurityInsightItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [listErrorMsg, setListErrorMsg] = useState<string | null>(null);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);

    const listUrl = useMemo(() => "/api/user/security/insights?limit=10", []);

    const fetchList = useCallback(
        async (signal?: AbortSignal) => {
            setIsLoading(true);
            setListErrorMsg(null);

            try {
                const res = await fetch(listUrl, {
                    method: "GET",
                    signal,
                    headers: { Accept: "application/json" },
                    credentials: "same-origin",
                    cache: "no-store",
                });

                if (!res.ok) throw new Error(`GET ${listUrl} failed (${res.status})`);

                const data = (await res.json()) as AISecurityInsightsResponse;
                if (signal?.aborted) return;

                setItems(Array.isArray(data.items) ? data.items : []);
            } catch (err) {
                if ((err as any)?.name === "AbortError") return;

                setItems([]);
                setListErrorMsg("Failed to load AI Security Insights.");
            } finally {
                if (signal?.aborted) return;
                setIsLoading(false);
            }
        },
        [listUrl]
    );

    useEffect(() => {
        const controller = new AbortController();
        fetchList(controller.signal);
        return () => controller.abort();
    }, [fetchList]);

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        setNotice(null);

        try {
            const res = await fetch("/api/user/security/insights", {
                method: "POST",
                headers: { Accept: "application/json" },
                credentials: "same-origin",
                cache: "no-store",
            });

            if (res.status === 429) {
                const retryAfterSecFromHeader = parseRetryAfterSeconds(res.headers.get("retry-after"));
                let retryAfterSecFromBody: number | null = null;

                try {
                    const body = (await res.json()) as RateLimitedResponse;
                    retryAfterSecFromBody =
                        typeof body?.retryAfterSec === "number" ? body.retryAfterSec : null;
                } catch {
                    // ignore
                }

                const retryAfterSec = retryAfterSecFromHeader ?? retryAfterSecFromBody;

                setNotice(
                    `Please wait before refreshing again.${typeof retryAfterSec === "number" ? ` Retry in ${retryAfterSec}s.` : ""}`
                );
                return;
            }

            if (!res.ok) {
                setNotice("Refresh failed. Please try again.");
                return;
            }

            const body = (await res.json()) as GenerateResponse;
            setNotice(skippedMessage(body.skipped, body.generated));

            await fetchList();
        } catch {
            setNotice("Refresh failed. Please try again.");
        } finally {
            setIsRefreshing(false);
        }
    }, [fetchList]);

    if (isLoading) {
        return <div className="h-80 rounded-[2.5rem] bg-slate-100 dark:bg-neutral-900 animate-pulse" />;
    }

    return (
        <section
            id="ai-insights"
            className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-neutral-900 p-8 border border-slate-200 dark:border-neutral-800 shadow-2xl shadow-indigo-500/5"
        >
            <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-white/0 to-transparent dark:via-neutral-900/0 blur-3xl opacity-80 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/10">
                            <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                AI Security Insights
                            </h2>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Read-only advice. No actions are performed automatically.
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/40 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-900 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                {notice ? (
                    <div
                        className="mb-4 text-sm text-slate-700 dark:text-slate-300"
                        aria-live="polite"
                    >
                        {notice}
                    </div>
                ) : null}

                {listErrorMsg ? (
                    <div className="text-sm text-red-600 dark:text-red-400">{listErrorMsg}</div>
                ) : items.length === 0 ? (
                    <div className="text-sm text-slate-600 dark:text-slate-300">No insights yet.</div>
                ) : (
                    <div className="space-y-3">
                        {items.map((it) => (
                            <div
                                key={it.id}
                                className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-950/30 p-4"
                            >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className={[
                                                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold tracking-wide",
                                                severityBadgeClass(it.severity),
                                            ].join(" ")}
                                        >
                                            {it.severity}
                                        </span>
                                        {it.status === "FAILED" ? (
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                (Generation failed)
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                        {formatCreatedAt(it.createdAt)}
                                    </div>
                                </div>

                                <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                                    {it.title}
                                </div>

                                <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                                    {it.summary}
                                </div>

                                {it.recommendedActions?.length ? (
                                    <div className="text-sm">
                                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                                            Recommended actions
                                        </div>
                                        <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300">
                                            {it.recommendedActions.slice(0, 5).map((a, idx) => (
                                                <li key={`${it.id}-${idx}`}>{a}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
