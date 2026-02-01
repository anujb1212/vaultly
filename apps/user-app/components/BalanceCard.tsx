"use client";

import { useBalance } from "@repo/store";
import { Lock, Wallet, ArrowRight } from "lucide-react";

export const BalanceCard = () => {
    const { balance, isLoading } = useBalance();

    if (isLoading) {
        return (
            <div className="h-48 rounded-[2rem] bg-slate-100 dark:bg-neutral-900/50 animate-pulse" />
        );
    }

    const amount = balance?.amount || 0;
    const locked = balance?.locked || 0;
    const totalBalance = amount + locked;

    const format = (val: number) => {
        const safe = Math.trunc(val);
        const rs = Math.trunc(safe / 100);
        const ps = Math.abs(safe % 100);
        return {
            rs: rs.toLocaleString("en-IN"),
            ps: String(ps).padStart(2, "0"),
        };
    };

    const total = format(totalBalance);
    const available = format(amount);
    const lockedVal = format(locked);

    return (
        <div className="relative group overflow-hidden rounded-[2rem] border border-white/20 dark:border-white/10 bg-white/40 dark:bg-neutral-900/60 backdrop-blur-xl shadow-xl shadow-indigo-500/10 transition-all hover:shadow-indigo-500/20">
            <div className="absolute top-[-50%] right-[-20%] w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[80px] opacity-40 mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[60px] opacity-30 mix-blend-multiply dark:mix-blend-screen pointer-events-none" />

            <div className="relative z-10 p-8 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-400/20 rounded-xl">
                            <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <span className="text-sm font-bold tracking-wide text-slate-600 dark:text-slate-300 uppercase">
                            Total Balance
                        </span>
                    </div>
                </div>

                {/* Main Amount */}
                <div className="mt-6 mb-8">
                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl md:text-6xl font-bold tracking-tighter text-slate-900 dark:text-white">
                            ₹{total.rs}
                        </span>
                        <span className="text-2xl font-medium text-slate-400 dark:text-slate-500">
                            .{total.ps}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 backdrop-blur-sm">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                            Available
                        </div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{available.rs}
                            <span className="text-sm opacity-60">.{available.ps}</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                            <Lock className="w-3 h-3" /> Locked
                        </div>
                        <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                            ₹{lockedVal.rs}
                            <span className="text-sm opacity-60">.{lockedVal.ps}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
