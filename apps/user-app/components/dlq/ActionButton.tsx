"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

export function ActionButton(props: {
    children: React.ReactNode;
    variant?: "primary" | "danger" | "ghost";
}) {
    const { pending } = useFormStatus();

    const base =
        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition " +
        "disabled:opacity-50 disabled:cursor-not-allowed";

    const variant =
        props.variant === "primary"
            ? "bg-indigo-500/90 hover:bg-indigo-500 text-white"
            : props.variant === "danger"
                ? "bg-rose-500/90 hover:bg-rose-500 text-white"
                : "bg-white/10 hover:bg-white/15 text-white";

    return (
        <button type="submit" disabled={pending} className={`${base} ${variant}`}>
            {pending ? "Working…" : props.children}
        </button>
    );
}
