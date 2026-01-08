"use client";

import { useBalance } from "@repo/store";

export const BalanceCard = () => {
    const { balance, isLoading } = useBalance();

    if (isLoading) {
        return (
            <div className="h-48 rounded-3xl bg-slate-100 dark:bg-neutral-900 animate-pulse" />
        );
    }

    const totalBalance = balance.amount + balance.locked;

    return (
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 p-8 border border-slate-200 dark:border-neutral-800 shadow-sm">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="relative z-10">
                <h3 className="text-sm font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                    Total Balance
                </h3>

                <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                        ₹{(totalBalance / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xl text-slate-400 font-normal">.00</span>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/50 border border-slate-100 dark:border-neutral-800">
                        <div className="text-xs text-slate-500 dark:text-neutral-400 mb-1">Available</div>
                        <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                            ₹{(balance.amount / 100).toLocaleString('en-IN')}
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/50 border border-slate-100 dark:border-neutral-800">
                        <div className="text-xs text-slate-500 dark:text-neutral-400 mb-1">Locked</div>
                        <div className="text-lg font-semibold text-slate-600 dark:text-neutral-400">
                            ₹{(balance.locked / 100).toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
