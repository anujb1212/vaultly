"use client";

import React, { useState } from "react";
import { Sparkles, ChevronRight, X } from "lucide-react";
import { AISecurityInsightsCard } from "./AISecurityInsightsCard";

export const DashboardSecurityWidget = () => {
    const [expanded, setExpanded] = useState(false);

    if (expanded) {
        return (
            <div className="relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={() => setExpanded(false)}
                    className="absolute top-6 right-6 z-20 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-full text-slate-500 dark:text-neutral-400 transition-colors"
                    aria-label="Close Insights"
                >
                    <X className="w-4 h-4" />
                </button>
                <AISecurityInsightsCard limit={3} />
            </div>
        );
    }

    return (
        <div
            onClick={() => setExpanded(true)}
            className="group relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-2 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md"
        >
            <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            AI Security Insights
                        </span>
                        <span className="text-xs text-slate-500 dark:text-neutral-400">
                            Tap to expand analysis
                        </span>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-neutral-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-500 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};
