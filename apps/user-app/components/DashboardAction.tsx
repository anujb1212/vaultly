"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface DashboardActionProps {
    icon: LucideIcon;
    label: string;
    subLabel?: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
}

export const DashboardAction = ({
    icon: Icon,
    label,
    subLabel,
    onClick,
    variant = "primary",
}: DashboardActionProps) => (
    <button
        type="button"
        onClick={onClick}
        className={`
      group relative flex-1 p-4 rounded-2xl text-left transition-all duration-300 ease-out active:scale-[0.98]
      ${variant === "primary"
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-indigo-500/40"
                : "bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white hover:bg-white/80 dark:hover:bg-neutral-800/80 hover:shadow-lg"
            }
    `}
    >
        <div className="flex items-start justify-between mb-2">
            <div
                className={`p-2 rounded-lg ${variant === "primary"
                        ? "bg-white/20 text-white"
                        : "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300"
                    }`}
            >
                <Icon className="w-5 h-5" strokeWidth={2.5} />
            </div>
        </div>
        <div>
            <div className="font-bold text-sm tracking-tight">{label}</div>
            {subLabel && (
                <div
                    className={`text-xs mt-0.5 font-medium ${variant === "primary"
                            ? "text-indigo-100"
                            : "text-slate-500 dark:text-neutral-400"
                        }`}
                >
                    {subLabel}
                </div>
            )}
        </div>
    </button>
);
