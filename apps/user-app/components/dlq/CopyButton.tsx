"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({
    value,
    label = "Copy",
}: {
    value: string;
    label?: string;
}) {
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

    const title = copied ? "Copied" : label;

    return (
        <button
            type="button"
            onClick={onCopy}
            className={[
                "inline-flex h-8 w-8 items-center justify-center rounded-lg",
                "border border-border bg-transparent text-mutedForeground",
                "hover:bg-muted/40 hover:text-foreground transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            ].join(" ")}
            aria-label={label}
            title={title}
        >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
    );
}
