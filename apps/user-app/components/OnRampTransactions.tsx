"use client";

import { useTransactions } from "@repo/store";

// Helper for status styles
const getStatusStyles = (status: string) => {
    switch (status) {
        case "Success":
            return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50";
        case "Processing":
            return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-900/50";
        case "Failure":
            return "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-900/50";
        default:
            return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    }
};

export const OnRampTransactions = () => {
    const { onRampTransactions, isLoading } = useTransactions();

    if (isLoading) {
        return <div className="h-64 rounded-3xl bg-slate-100 dark:bg-neutral-900 animate-pulse" />;
    }

    if (!onRampTransactions.length) {
        return (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-8 text-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 text-2xl">
                    💸
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No transactions yet</h3>
                <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-xs mt-1">
                    Add money to your wallet to get started with seamless payments.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm h-full">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Recent Activity</h2>
            <div className="space-y-4">
                {onRampTransactions.map((t) => (
                    <div key={t.id} className="group flex items-center justify-between p-3 -mx-3 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <div className="flex items-center gap-4">
                            {/* Bank Icon Placeholder */}
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm">
                                {t.provider.charAt(0)}
                            </div>

                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">{t.provider}</span>
                                <span className="text-xs text-slate-500 dark:text-neutral-500">
                                    {new Date(t.time).toLocaleDateString('en-IN', {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                                + ₹{(t.amount / 100).toLocaleString('en-IN')}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusStyles(t.status)}`}>
                                {t.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
