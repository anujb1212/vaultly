"use client";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

export const SidebarItem = ({ href, title, icon }: { href: string; title: string; icon: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();
    const selected = pathname === href;

    return (
        <button
            type="button"
            onClick={() => router.push(href)}
            className={`
                group flex items-center w-full px-4 py-3 my-1 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out
                ${selected
                    ? "bg-slate-900 text-white shadow-md shadow-slate-200 dark:bg-white dark:text-black dark:shadow-none"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                }
            `}
        >
            <span className={`
                flex items-center justify-center w-5 h-5 mr-3 transition-colors
                ${selected ? "text-white dark:text-black" : "text-slate-400 group-hover:text-slate-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"}
            `}>
                {icon}
            </span>
            <span className="tracking-wide">{title}</span>

            {/* Subtle Active Indicator Dot */}
            {selected && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
            )}
        </button>
    );
};
