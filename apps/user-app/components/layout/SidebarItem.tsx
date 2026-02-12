"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface SidebarItemProps {
    href: string;
    title: string;
    icon: React.ReactNode;
}

export const SidebarItem = ({ href, title, icon }: SidebarItemProps) => {
    const pathname = usePathname();

    const selected = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

    const base =
        "group relative flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium " +
        "transition-colors duration-150 " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background";

    const selectedCls =
        "bg-slate-900/5 text-slate-900 ring-1 ring-slate-900/10 " +
        "dark:bg-white/10 dark:text-white dark:ring-white/10";

    const idleCls =
        "text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 " +
        "dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800/50";

    const iconBase = "mr-3 grid h-5 w-5 place-items-center transition-colors";
    const iconSelected = "text-slate-900 dark:text-white";
    const iconIdle =
        "text-slate-400 group-hover:text-slate-600 dark:text-neutral-500 dark:group-hover:text-neutral-300";

    return (
        <Link
            href={href}
            aria-current={selected ? "page" : undefined}
            className={`${base} ${selected ? selectedCls : idleCls}`}
        >
            <span className={`${iconBase} ${selected ? iconSelected : iconIdle}`}>{icon}</span>
            <span className="truncate tracking-wide">{title}</span>
        </Link>
    );
};
