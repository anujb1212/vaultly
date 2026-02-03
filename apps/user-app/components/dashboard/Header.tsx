"use client";

import React from "react";

export const Header = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Dashboard
                </h1>
                <p className="text-slate-500 dark:text-neutral-400 font-medium mt-1">
                    {greeting}, here's your financial overview.
                </p>
            </div>

            <div className="hidden md:block animate-fade-in-up delay-100">
                <div className="px-4 py-1.5 rounded-full bg-white/40 dark:bg-neutral-800/40 border border-slate-200/50 dark:border-neutral-700/50 backdrop-blur-xl text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider shadow-sm transition-all hover:bg-white/60 dark:hover:bg-neutral-800/60">
                    {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                    })}
                </div>
            </div>
        </div>
    );
};
