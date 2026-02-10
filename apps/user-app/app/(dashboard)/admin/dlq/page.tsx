import { ActionButton } from "../../../../components/dlq/ActionButton";
import { Badge } from "../../../../components/dlq/Badge";
import { CopyButton } from "../../../../components/dlq/CopyButton";
import { dlqArchive, dlqList, dlqReplay } from "../../../lib/actions/dlq";

function shortId(id?: string) {
    if (!id) return "-";
    if (id.length <= 14) return id;
    return `${id.slice(0, 6)}…${id.slice(-6)}`;
}

function fmtTs(s?: string) {
    if (!s) return "-";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toISOString().replace("T", " ").replace(".000Z", "Z");
}

function badgeToneForFailureClass(failureType?: string) {
    if (failureType === "transient") return "yellow" as const;
    if (failureType === "permanent") return "red" as const;
    return "neutral" as const;
}

function badgeToneForType(t?: string) {
    if (t === "ONRAMP") return "blue" as const;
    if (t === "OFFRAMP") return "green" as const;
    return "neutral" as const;
}

export default async function AdminDlqPage() {
    const { jobs } = await dlqList();

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                        DLQ inbox
                    </h1>
                    <p className="mt-1 text-sm text-mutedForeground">
                        Active failures only.
                    </p>
                </div>

                <span className="shrink-0 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-mutedForeground">
                    {jobs.length} active
                </span>
            </div>

            {jobs.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card shadow-elev-1">
                    <div className="px-6 py-10">
                        <p className="text-sm font-medium text-foreground">No DLQ jobs</p>
                        <p className="mt-1 text-sm text-mutedForeground">
                            You're all caught up.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="rounded-3xl border border-border bg-card shadow-elev-1 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-[1040px] w-full table-fixed text-sm">
                            <thead className="sticky top-0 z-10 bg-card/80 backdrop-blur border-b border-border">
                                <tr className="text-left text-[11px] text-mutedForeground">
                                    <th className="w-[90px] px-4 py-3 font-semibold">ID</th>
                                    <th className="w-[120px] px-4 py-3 font-semibold">Failure</th>
                                    <th className="w-[220px] px-4 py-3 font-semibold">Token</th>
                                    <th className="w-[140px] px-4 py-3 font-semibold">Kind</th>
                                    <th className="px-4 py-3 font-semibold">Error</th>
                                    <th className="w-[110px] px-4 py-3 font-semibold">Attempts</th>
                                    <th className="w-[130px] px-4 py-3 font-semibold">Failed at</th>
                                    <th className="w-[180px] px-4 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-border">
                                {jobs.map((j: any) => {
                                    const kind = String(j.type ?? j.name ?? "-");
                                    const err = String(j.lastError ?? j.failureReason ?? "-");
                                    const failedAtFull = fmtTs(j.failedAt);
                                    const failedAtShort = failedAtFull === "-" ? "-" : failedAtFull.slice(0, 10);

                                    return (
                                        <tr key={j.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-foreground" title={String(j.id)}>
                                                        {shortId(String(j.id))}
                                                    </span>
                                                    <CopyButton value={String(j.id)} label="Copy ID" />
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <Badge tone={badgeToneForFailureClass(j.failureClass)}>
                                                    {j.failureClass ?? "unknown"}
                                                </Badge>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-foreground" title={String(j.token ?? "")}>
                                                        {j.token ? shortId(String(j.token)) : "-"}
                                                    </span>
                                                    {j.token ? <CopyButton value={String(j.token)} label="Copy token" /> : null}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="max-w-[120px] truncate">
                                                    <Badge tone={badgeToneForType(kind)}>{kind}</Badge>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="truncate text-foreground/80" title={err}>
                                                    {err}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap text-foreground/80 tabular-nums">
                                                Attempts{Number(j.attempts ?? 0)}
                                                <span className="text-[11px] text-mutedForeground">
                                                    {" "}
                                                    Replay{Number(j.replayCount ?? 0)}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="font-mono text-xs text-foreground/80" title={failedAtFull}>
                                                    {failedAtShort}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex justify-end gap-2">
                                                    <form action={dlqReplay}>
                                                        <input type="hidden" name="dlqJobId" value={String(j.id)} />
                                                        <ActionButton variant="primary">Replay</ActionButton>
                                                    </form>

                                                    <form action={dlqArchive}>
                                                        <input type="hidden" name="dlqJobId" value={String(j.id)} />
                                                        <ActionButton variant="ghost">Archive</ActionButton>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
