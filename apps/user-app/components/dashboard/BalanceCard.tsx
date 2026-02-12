"use client";

import { useBalance } from "@repo/store";
import { Wallet, Lock } from "lucide-react";

export const BalanceCard = () => {
    const { balance, isLoading } = useBalance();

    if (isLoading) {
        return (
            <div className="h-full min-h-[240px] rounded-[1.5rem] bg-card ring-1 ring-border/60 shadow-elev-1 animate-pulse" />
        );
    }

    const amount = balance?.amount || 0;
    const locked = balance?.locked || 0;
    const totalBalance = amount;
    const availableBalance = Math.max(0, amount - locked);

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
    const available = format(availableBalance);
    const lockedVal = format(locked);

    return (
        <section
            className="relative w-full h-full min-h-[240px] rounded-[1.5rem] overflow-hidden bg-card text-cardForeground ring-1 ring-white/10 dark:ring-white/5 shadow-2xl isolate"
            aria-label="Balance summary"
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.25] mix-blend-overlay pointer-events-none filter contrast-125" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none mix-blend-soft-light" />

            <div className="relative z-10 p-8 h-full flex flex-col justify-between">

                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5 opacity-80">
                            <Wallet className="w-4 h-4" />
                            <h3 className="font-bold text-[10px] tracking-[0.2em] uppercase">
                                Total Balance
                            </h3>
                        </div>
                        <h1 className="tabular-nums text-[2.5rem] font-bold tracking-tight leading-none flex items-baseline drop-shadow-md">
                            <span className="text-2xl mr-1 opacity-60 font-medium">₹</span>
                            {total.rs}
                            <span className="text-xl opacity-60 font-medium">.{total.ps}</span>
                        </h1>
                    </div>

                    <div className="w-12 h-9 rounded-md border border-yellow-200/40 bg-gradient-to-br from-yellow-100/20 via-yellow-200/40 to-yellow-500/20 backdrop-blur-sm relative overflow-hidden shadow-inner flex-shrink-0">
                        <div className="absolute inset-0 border border-white/10 rounded-md"></div>
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/30 mix-blend-overlay"></div>
                        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-white/30 mix-blend-overlay"></div>
                        <div className="absolute left-1/4 top-1/2 h-1/2 w-[1px] bg-white/20 mix-blend-overlay"></div>
                        <div className="absolute right-1/4 top-0 h-1/2 w-[1px] bg-white/20 mix-blend-overlay"></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50"></div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8 mt-auto pt-6 border-t border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">
                            Available
                        </span>
                        <span className="tabular-nums font-semibold text-lg leading-none tracking-wide opacity-90">
                            ₹{available.rs}
                            <span className="text-xs opacity-60">.{available.ps}</span>
                        </span>
                    </div>

                    <div className="flex flex-col pl-6 border-l border-white/10">
                        <div className="flex items-center gap-1.5 mb-1 opacity-60">
                            <Lock className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                Locked
                            </span>
                        </div>
                        <span className="tabular-nums font-semibold text-lg leading-none tracking-wide opacity-90">
                            ₹{lockedVal.rs}
                            <span className="text-xs opacity-60">.{lockedVal.ps}</span>
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};
