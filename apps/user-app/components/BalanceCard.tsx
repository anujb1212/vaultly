"use client";

import { useBalance } from "@repo/store";
import { Eye, EyeOff, Wallet, Lock } from "lucide-react";
import { useState } from "react";

export const BalanceCard = () => {
    const { balance, isLoading } = useBalance();
    const [hidden, setHidden] = useState(false);

    if (isLoading) {
        return (
            <div className="h-full min-h-[220px] rounded-[2rem] bg-slate-100 dark:bg-neutral-900 animate-pulse" />
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
        <div className="relative w-full h-full min-h-[220px] rounded-[2rem] overflow-hidden p-8 flex flex-col justify-between group shadow-xl shadow-indigo-500/10 transition-all hover:scale-[1.01]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 z-0" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Wallet className="w-4 h-4 text-indigo-200" />
                        <h3 className="text-indigo-200 font-medium text-xs tracking-wider uppercase">
                            Total Balance
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-bold text-white tracking-tight flex items-baseline">
                            {hidden ? (
                                "••••••"
                            ) : (
                                <>
                                    <span className="text-2xl mr-1">₹</span>
                                    {total.rs}
                                    <span className="text-lg opacity-60">.{total.ps}</span>
                                </>
                            )}
                        </h1>
                        <button
                            onClick={() => setHidden(!hidden)}
                            className="text-indigo-300 hover:text-white transition-colors"
                        >
                            {hidden ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-4 mt-auto">
                <div className="flex flex-col">
                    <span className="text-[10px] text-indigo-200 uppercase tracking-wider mb-0.5">Available</span>
                    <span className="text-white font-semibold text-lg">
                        ₹{available.rs}<span className="text-xs opacity-60">.{available.ps}</span>
                    </span>
                </div>

                <div className="flex flex-col border-l border-white/10 pl-4">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <Lock className="w-3 h-3 text-indigo-300" />
                        <span className="text-[10px] text-indigo-200 uppercase tracking-wider">Locked</span>
                    </div>
                    <span className="text-white/80 font-semibold text-lg">
                        ₹{lockedVal.rs}<span className="text-xs opacity-60">.{lockedVal.ps}</span>
                    </span>
                </div>
            </div>
        </div>
    );
};
