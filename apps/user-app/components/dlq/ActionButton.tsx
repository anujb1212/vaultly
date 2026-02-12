"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

export function ActionButton(props: {
    children: React.ReactNode;
    variant?: "primary" | "danger" | "ghost";
}) {
    const { pending } = useFormStatus();

    const base =
        "inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold transition " +
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

    const variant =
        props.variant === "primary"
            ? "bg-primary text-primaryForeground hover:bg-primary/90"
            : props.variant === "danger"
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-transparent border border-border text-foreground/80 hover:bg-muted/40 hover:text-foreground";

    return (
        <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className={`${base} ${variant} ${pending ? "cursor-wait" : ""}`}
        >
            {props.children}
        </button>
    );
}
