"use client";

import { useTransactions } from "@repo/store";
import { Clock, CheckCircle2, XCircle, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface TransactionItem {
    id: number;
    time: Date | string;
    amount: number;
    status: string;
    provider: string;
    failureReasonCode?: string | null;
}

export const OnRampTransactions = ({ transactions }: { transactions?: TransactionItem[] }) => {
    const { onRampTransactions, isLoading } = useTransactions();

    const dataToRender = transactions || onRampTransactions.map(t => ({
        ...t,
        time: t.time,
        provider: `Added from ${t.provider}`
    }));

    const loadingState = !transactions && isLoading;

    if (loadingState) {
        return (
            <div className="h-64 rounded-[2rem] bg-slate-100 dark:bg-neutral-900/50 animate-pulse" />
        );
    }

    if (!dataToRender.length) {
        return (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center rounded-[2rem] border border-slate-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                    <ArrowDownLeft className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    No Recent Activity
                </h3>
                <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2 max-w-[200px]">
                    Transactions will appear here once you make a transfer.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-[2rem] border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 backdrop-blur-sm p-8 h-full shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {transactions ? "Recent Activity" : "Recent Deposits"}
                </h2>
                <span className="text-xs font-medium text-slate-500 px-2.5 py-1 bg-slate-100 dark:bg-neutral-800 rounded-full">
                    Last 5
                </span>
            </div>

            <div className="space-y-4">
                {dataToRender.slice(0, 5).map((t) => {
                    const isCancelled =
                        t.status === "Failure" &&
                        (t.failureReasonCode === "USER_CANCELLED" ||
                            t.failureReasonCode === "CANCELLED");

                    const isSent = t.provider.startsWith("Sent to");

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
                                        isSent ? <ArrowUpRight className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />
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
                                    className={`text-sm font-bold ${isCancelled
                                        ? "text-slate-400 line-through"
                                        : isSent
                                            ? "text-slate-900 dark:text-white"
                                            : "text-emerald-600 dark:text-emerald-400"
                                        }`}
                                >
                                    {isSent ? "-" : "+"} ₹{(t.amount / 100).toLocaleString("en-IN")}
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
