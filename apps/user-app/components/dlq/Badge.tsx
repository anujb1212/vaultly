import * as React from "react";

export function Badge(props: { children: React.ReactNode; tone?: "neutral" | "green" | "yellow" | "red" | "blue" }) {
    const tone =
        props.tone === "green"
            ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
            : props.tone === "yellow"
                ? "bg-amber-500/15 text-amber-200 ring-amber-500/30"
                : props.tone === "red"
                    ? "bg-rose-500/15 text-rose-200 ring-rose-500/30"
                    : props.tone === "blue"
                        ? "bg-indigo-500/15 text-indigo-200 ring-indigo-500/30"
                        : "bg-white/10 text-white/80 ring-white/15";

    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ${tone}`}>
            {props.children}
        </span>
    );
}
