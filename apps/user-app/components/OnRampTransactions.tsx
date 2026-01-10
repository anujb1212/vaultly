"use client";

import { useTransactions } from "@repo/store";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

const getStatusStyles = (status: string) => {
    switch (status) {
        case "Success":
            return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50";
        case "Processing":
            return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50";
        case "Failure":
            return "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/50";
        default:
            return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case "Success": return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
        case "Processing": return <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
        case "Failure": return <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
        default: return <Clock className="w-5 h-5" />;
    }
};

export const OnRampTransactions = () => {
    const { onRampTransactions, isLoading } = useTransactions();

    if (isLoading) {
        return <div className="h-64 rounded-[2.5rem] bg-slate-100 dark:bg-neutral-900 animate-pulse" />;
    }

    if (!onRampTransactions.length) {
        return (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center rounded-[2.5rem] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-8 text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 text-3xl">
                    💸
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No deposits yet</h3>
                <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-xs mt-2 leading-relaxed">
                    Add money via your preferred bank to see your history here.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 p-8 shadow-sm h-full">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Deposits</h2>
            <div className="space-y-1">
                {onRampTransactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="group flex items-center justify-between p-4 -mx-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors cursor-default">
                        <div className="flex items-center gap-4">
                            {/* Bank Icon Placeholder */}
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 flex items-center justify-center shadow-sm">
                                {getStatusIcon(t.status)}
                            </div>

                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{t.provider}</span>
                                <span className="text-xs font-medium text-slate-500 dark:text-neutral-500 mt-0.5">
                                    {new Date(t.time).toLocaleDateString('en-IN', {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
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
