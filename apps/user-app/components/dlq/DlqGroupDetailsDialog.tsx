"use client";

import * as React from "react";
import { CopyButton } from "./CopyButton";
import { X, ListTree } from "lucide-react";

type DlqJobLite = {
    id: string;
    webhookEventId?: string;
    failedAt?: string;
    failureReason?: string;
    failureClass?: string;
    attempts?: number;
};

function fmtTs(s?: string) {
    if (!s) return "-";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toISOString().replace("T", " ").replace(".000Z", "Z");
}

export function DlqGroupDetailsDialog(props: {
    title: string;
    subtitle?: string;
    jobs: DlqJobLite[];
}) {
    const dlgRef = React.useRef<HTMLDialogElement | null>(null);
    const btnRef = React.useRef<HTMLButtonElement | null>(null);

    function open() {
        const dlg = dlgRef.current;
        if (!dlg) return;
        // showModal() places dialog in the top layer with a backdrop and makes the rest inert. [web:368]
        dlg.showModal();
    }

    function close() {
        dlgRef.current?.close();
        btnRef.current?.focus();
    }

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={open}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-transparent text-mutedForeground hover:bg-muted/40 hover:text-foreground transition"
                aria-label="View details"
                title="Details"
            >
                <ListTree className="h-4 w-4" />
            </button>

            <dialog
                ref={dlgRef}
                className="w-[min(920px,calc(100vw-2rem))] rounded-2xl border border-border bg-card text-foreground shadow-2xl p-0"
                onClose={() => btnRef.current?.focus()}
            >
                <style jsx global>{`
          dialog::backdrop {
            background: rgb(0 0 0 / 0.6);
          }
        `}</style>

                <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
                    <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{props.title}</div>
                        {props.subtitle ? (
                            <div className="mt-0.5 text-xs text-mutedForeground truncate">
                                {props.subtitle}
                            </div>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={close}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-transparent text-mutedForeground hover:bg-muted/40 hover:text-foreground transition"
                        aria-label="Close dialog"
                        title="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-5 py-4">
                    <div className="rounded-xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-fixed text-sm">
                                <thead className="bg-muted/30 border-b border-border">
                                    <tr className="text-left text-[11px] text-mutedForeground">
                                        <th className="w-[120px] px-3 py-2 font-semibold">DLQ job</th>
                                        <th className="w-[340px] px-3 py-2 font-semibold">Webhook event</th>
                                        <th className="w-[170px] px-3 py-2 font-semibold">Failed at</th>
                                        <th className="w-[110px] px-3 py-2 font-semibold">Attempts</th>
                                        <th className="px-3 py-2 font-semibold">Reason</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-border">
                                    {props.jobs.map((j) => (
                                        <tr key={j.id} className="hover:bg-muted/20">
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs">{j.id}</span>
                                                    <CopyButton value={String(j.id)} label="Copy DLQ job id" />
                                                </div>
                                            </td>

                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs truncate" title={String(j.webhookEventId ?? "")}>
                                                        {j.webhookEventId ?? "-"}
                                                    </span>
                                                    {j.webhookEventId ? (
                                                        <CopyButton value={String(j.webhookEventId)} label="Copy webhook event id" />
                                                    ) : null}
                                                </div>
                                            </td>

                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <span className="font-mono text-xs text-foreground/80">
                                                    {fmtTs(j.failedAt)}
                                                </span>
                                            </td>

                                            <td className="px-3 py-2 whitespace-nowrap text-foreground/80 tabular-nums">
                                                {Number(j.attempts ?? 0)}
                                            </td>

                                            <td className="px-3 py-2">
                                                <div className="truncate text-foreground/80" title={String(j.failureReason ?? "")}>
                                                    {j.failureReason ?? "-"}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-3 text-xs text-mutedForeground">
                        Tip: "Resolve" will replay the latest job and archive the remaining duplicates.
                    </div>
                </div>
            </dialog>
        </>
    );
}
