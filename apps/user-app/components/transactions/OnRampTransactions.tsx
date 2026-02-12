"use client";

import { useTransactions } from "@repo/store";
import {
    Clock,
    CheckCircle2,
    XCircle,
    ArrowDownLeft,
    ArrowUpRight,
    ArrowRightLeft,
} from "lucide-react";

type ActivityKind = "onramp" | "offramp" | "p2p";
type ActivityDirection = "in" | "out";
type Status = "Processing" | "Success" | "Failure" | string;

interface TransactionItem {
    id: number;
    time: Date | string;
    amount: number;
    status: Status;
    provider: string;
    failureReasonCode?: string | null;
    kind?: ActivityKind;
    direction?: ActivityDirection;
}

export const OnRampTransactions = ({ transactions }: { transactions?: TransactionItem[] }) => {
    const { onRampTransactions, isLoading } = useTransactions();

    const dataToRender: TransactionItem[] =
        transactions ||
        onRampTransactions.map((t) => ({
            ...t,
            time: t.time,
            provider: `Added from ${t.provider}`,
            kind: "onramp",
            direction: "in",
        }));

    const loadingState = !transactions && isLoading;

    if (loadingState) {
        return <div className="h-64 rounded-2xl bg-card ring-1 ring-border/60 shadow-elev-1 animate-pulse" />;
    }

    if (!dataToRender.length) {
        return (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center rounded-2xl ring-1 ring-border/60 bg-card p-8 text-center shadow-elev-1">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <ArrowDownLeft className="w-6 h-6 text-mutedForeground" />
                </div>
                <h3 className="text-lg font-semibold text-cardForeground">No Recent Activity</h3>
                <p className="text-sm text-mutedForeground mt-2 max-w-[240px]">
                    Transactions will appear here once you make a transfer.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl ring-1 ring-border/60 bg-card p-6 sm:p-8 h-full shadow-elev-1">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-cardForeground">
                    {transactions ? "Recent Activity" : "Recent Deposits"}
                </h2>
                <span className="text-xs font-medium text-mutedForeground px-2.5 py-1 bg-muted rounded-full">
                    Last 5
                </span>
            </div>

            <div className="space-y-2">
                {dataToRender.slice(0, 5).map((t) => {
                    const isCancelled =
                        t.status === "Failure" &&
                        (t.failureReasonCode === "USER_CANCELLED" || t.failureReasonCode === "CANCELLED");

                    const isOutflow =
                        t.provider.startsWith("Sent to") || t.provider.startsWith("Withdraw to");

                    const tone =
                        isCancelled
                            ? "text-slate-400 dark:text-neutral-500"
                            : t.status === "Success"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : t.status === "Processing"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-rose-600 dark:text-rose-400";

                    return (
                        <div
                            key={t.id}
                            className="flex items-center justify-between group p-3 -mx-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border ${t.status === "Success"
                                        ? "bg-emerald-100 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-900/50"
                                        : t.status === "Processing"
                                            ? "bg-amber-100 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-900/50"
                                            : "bg-rose-100 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-900/50"
                                        }`}
                                >
                                    {t.status === "Success" ? (
                                        isOutflow ? <ArrowUpRight className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />
                                    ) : t.status === "Processing" ? (
                                        <Clock className="w-5 h-5" />
                                    ) : (
                                        <XCircle className="w-5 h-5" />
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <span
                                        className={`text-sm font-semibold ${isCancelled
                                            ? "text-slate-400 line-through decoration-slate-400"
                                            : "text-slate-900 dark:text-white"
                                            }`}
                                    >
                                        {t.provider}
                                    </span>

                                    <span className="text-xs text-slate-500 dark:text-neutral-500">
                                        {new Date(t.time).toLocaleDateString("en-IN", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <div
                                    className={`text-sm font-bold tabular-nums ${isCancelled ? "text-slate-400 line-through" : tone
                                        }`}
                                >
                                    {isOutflow ? "-" : "+"} ₹{(t.amount / 100).toLocaleString("en-IN")}
                                </div>

                                <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${t.status === "Success"
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                                        : t.status === "Processing"
                                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                                            : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"
                                        }`}
                                >
                                    {isCancelled ? "Cancelled" : t.status}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
