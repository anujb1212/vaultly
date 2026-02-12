"use client";

import { Shield, Sparkles } from "lucide-react";

export function SecurityInsights() {
    return (
        <section className="relative h-full overflow-hidden rounded-[2rem] bg-white dark:bg-neutral-950 border border-slate-200 dark:border-white/10 shadow-xl shadow-indigo-500/5 dark:shadow-indigo-500/10 group isolate transition-colors duration-300">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[60px] animate-pulse" />

            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />

            <div className="relative z-10 p-8 h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative group-hover:scale-110 transition-transform duration-500 ease-out">
                    <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500 blur-xl opacity-0 dark:opacity-20 rounded-full" />

                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 backdrop-blur-md flex items-center justify-center shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)] dark:shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Shield className="w-7 h-7 text-indigo-600 dark:text-white/90 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                    </div>

                    <div className="absolute -top-2 -right-2 bg-white dark:bg-indigo-500 rounded-full p-1 border border-slate-100 dark:border-black shadow-sm">
                        <Sparkles className="w-3 h-3 text-indigo-600 dark:text-white" />
                    </div>
                </div>

                <div className="space-y-2 max-w-[200px]">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-b dark:from-white dark:to-white/60 tracking-tight">
                        AI Sentinel
                    </h2>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md shadow-sm dark:shadow-lg">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600 dark:text-indigo-200/80">
                        Coming Soon
                    </span>
                </div>

            </div>
        </section>
    );
}
