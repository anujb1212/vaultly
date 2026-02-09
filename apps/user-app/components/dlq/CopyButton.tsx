"use client";

import * as React from "react";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
    const [copied, setCopied] = React.useState(false);

    async function onCopy() {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 900);
        } catch {
            // ignore
        }
    }

    return (
        <button
            type="button"
            onClick={onCopy}
            className="rounded-md px-2 py-1 text-[11px] bg-white/10 hover:bg-white/15"
            aria-label={`Copy ${label}`}
        >
            {copied ? "Copied" : label}
        </button>
    );
}
