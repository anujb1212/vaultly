"use client";

import { MessageSquare, Sparkles } from "lucide-react";

export function SecurityInsights() {
    return (
        <section className="relative h-full overflow-hidden rounded-[1.5rem] bg-white dark:bg-[#06020f] border border-slate-200 dark:border-white/5 shadow-2xl group isolate transition-colors duration-300">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[50px] animate-pulse" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />

            <div className="relative z-10 p-8 h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative group-hover:scale-110 transition-transform duration-500 ease-out">
                    <div className="absolute inset-0 bg-purple-500/10 dark:bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                    <div className="w-16 h-16 rounded-[1.2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md flex items-center justify-center shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 dark:from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <MessageSquare className="w-7 h-7 text-purple-600 dark:text-white/90 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)] dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-purple-500 rounded-full p-1 border border-white dark:border-black shadow-sm">
                        <Sparkles className="w-3 h-3 text-white" />
                    </div>
                </div>

                <div className="space-y-2 max-w-[200px]">
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-white/60 tracking-tight">
                        Chat with Ledger
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-white/40 font-medium dark:font-light leading-relaxed">
                        Ask AI about your finances, analyze spending, and get smart insights.
                    </p>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md shadow-lg">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-600 dark:text-purple-200/80">
                        Coming Soon
                    </span>
                </div>
            </div>
        </section>
    );
}
