"use client";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

interface SidebarItemProps {
    href: string;
    title: string;
    icon: React.ReactNode;
}

export const SidebarItem = ({ href, title, icon }: SidebarItemProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const selected = pathname === href;

    return (
        <button
            type="button"
            onClick={() => router.push(href)}
            className={`
        group relative flex items-center w-full px-4 py-2.5 my-1 rounded-xl 
        text-sm font-medium transition-all duration-200 ease-out active:scale-95
        ${selected
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                    : "text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-slate-100/50 dark:hover:bg-neutral-800/50"
                }
      `}
        >
            {/* Active Indicator */}
            {selected && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
            )}

            <span
                className={`
          flex items-center justify-center w-5 h-5 mr-3 transition-colors
          ${selected
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-400 group-hover:text-slate-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"
                    }
        `}
            >
                {icon}
            </span>

            <span className="tracking-wide truncate">{title}</span>
        </button>
    );
};
