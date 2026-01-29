"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

export function AISecurityInsightsCard({ limit = 3 }: { limit?: number }) {
    const [items, setItems] = useState<AISecurityInsightItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const url = useMemo(() => {
        const l = Math.max(1, Math.min(50, Math.trunc(limit)));
        return `/api/user/security/insights?limit=${l}`;
    }, [limit]);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        async function load() {
            setIsLoading(true);
            setErrorMsg(null);

            try {
                const res = await fetch(url, {
                    method: "GET",
                    signal: controller.signal,
                    headers: { Accept: "application/json" },
                    credentials: "same-origin",
                    cache: "no-store",
                });

                if (!res.ok) {
                    throw new Error(`GET ${url} failed (${res.status})`);
                }

                const data = (await res.json()) as AISecurityInsightsResponse;
                if (!isMounted) return;

                setItems(Array.isArray(data.items) ? data.items : []);
            } catch (err) {
                if (!isMounted) return;
                if ((err as any)?.name === "AbortError") return;

                setErrorMsg("Failed to load AI Security Insights.");
                setItems([]);
            } finally {
                if (!isMounted) return;
                setIsLoading(false);
            }
        }

        load();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [url]);

    if (isLoading) {
        return (
            <div className="h-64 rounded-[2.5rem] bg-slate-100 dark:bg-neutral-900 animate-pulse" />
        );
    }

    return (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-neutral-900 p-8 border border-slate-200 dark:border-neutral-800 shadow-2xl shadow-indigo-500/5">
            <div className="absolute top-0 right-0 w-[320px] h-[320px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-white/0 to-transparent dark:via-neutral-900/0 blur-3xl opacity-80 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/10">
                            <ShieldAlert className="w-5 h-5 text-indigo-500 dark:text-indigo-300" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                                AI Security Insights
                            </h3>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Read-only advice. No actions are performed automatically.
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/settings/security#ai-insights"
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:underline whitespace-nowrap"
                    >
                        See all
                    </Link>
                </div>

                {errorMsg ? (
                    <div className="text-sm text-red-600 dark:text-red-400">
                        {errorMsg}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                        No insights yet.
                    </div>
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
                                <div className="text-sm text-slate-600 dark:text-slate-300">
                                    {it.summary}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
