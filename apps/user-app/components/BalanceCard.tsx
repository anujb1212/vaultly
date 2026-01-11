"use client";

import { useBalance } from "@repo/store";
import { Lock, Wallet } from "lucide-react";

export const BalanceCard = () => {
    const { balance, isLoading } = useBalance();

    if (isLoading) {
        return (
            <div className="h-64 rounded-[2.5rem] bg-slate-100 dark:bg-neutral-900 animate-pulse" />
        );
    }

    const totalBalance = balance.amount + balance.locked;
    const format = (val: number) => {
        const safe = Math.trunc(val);
        const rs = Math.trunc(safe / 100);
        const ps = Math.abs(safe % 100);
        return {
            rs: rs.toLocaleString('en-IN'),
            ps: String(ps).padStart(2, '0')
        };
    };

    const total = format(totalBalance);
    const available = format(balance.amount);
    const locked = format(balance.locked);

    return (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 dark:bg-neutral-900 p-8 border border-slate-200/10 dark:border-neutral-800 shadow-2xl shadow-indigo-500/10">

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-900/0 to-transparent blur-3xl opacity-60 pointer-events-none" />

            <div className="relative z-10 text-white">
                <div className="flex items-center gap-3 mb-6 opacity-80">
                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                        <Wallet className="w-5 h-5 text-indigo-300" />
                    </div>
                    <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-widest">
                        Wallet Balance
                    </h3>
                </div>

                <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-5xl md:text-6xl font-bold tracking-tight">
                        ₹{total.rs}
                    </span>
                    <span className="text-2xl text-slate-400 font-light opacity-80">.{total.ps}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                        <div className="text-xs text-slate-400 mb-1 font-medium">Available</div>
                        <div className="text-lg font-semibold text-emerald-400">
                            ₹{available.rs}<span className="text-sm opacity-70">.{available.ps}</span>
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-medium">
                            <Lock className="w-3 h-3" /> Locked
                        </div>
                        <div className="text-lg font-semibold text-slate-200">
                            ₹{locked.rs}<span className="text-sm opacity-70">.{locked.ps}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
