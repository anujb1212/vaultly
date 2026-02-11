import { ActionButton } from "../../../../components/dlq/ActionButton";
import { Badge } from "../../../../components/dlq/Badge";
import { CopyButton } from "../../../../components/dlq/CopyButton";
import { DlqGroupDetailsDialog } from "../../../../components/dlq/DlqGroupDetailsDialog";
import { dlqArchiveGroup, dlqList, dlqResolveGroup } from "../../../lib/actions/dlq";

function shortId(id?: string) {
    if (!id) return "-";
    if (id.length <= 14) return id;
    return `${id.slice(0, 6)}…${id.slice(-6)}`;
}

function fmtDateOnly(s?: string) {
    if (!s) return "-";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toISOString().slice(0, 10);
}

function badgeToneForFailureClass(fc?: string) {
    if (fc === "transient") return "yellow" as const;
    if (fc === "permanent") return "red" as const;
    return "neutral" as const;
}

function badgeToneForType(t?: string) {
    if (t === "ONRAMP") return "blue" as const;
    if (t === "OFFRAMP") return "green" as const;
    return "neutral" as const;
}

type DlqJob = {
    id: string;
    token?: string;
    webhookEventId?: string;
    type?: string;
    userId?: number | null;
    userIdentifier?: string | null;
    amount?: number | null;
    failureClass?: string;
    failureReason?: string;
    failedAt?: string;
    attempts?: number;
    replayCount?: number;
};

function worstFailureClass(jobs: DlqJob[]) {
    const set = new Set(jobs.map((j) => j.failureClass).filter(Boolean));
    if (set.has("permanent")) return "permanent";
    if (set.has("transient")) return "transient";
    if (set.has("unknown")) return "unknown";
    return undefined;
}

export default async function AdminDlqPage() {
    const { jobs } = await dlqList();
    const items = (jobs ?? []) as DlqJob[];

    const groups = new Map<
        string,
        { key: string; type: string; token: string; jobs: DlqJob[] }
    >();

    for (const j of items) {
        const type = String(j.type ?? "UNKNOWN");
        const token = String(j.token ?? "unknown");
        const key = `${type}::${token}`;
        const g = groups.get(key) ?? { key, type, token, jobs: [] as DlqJob[] };
        g.jobs.push(j);
        groups.set(key, g);
    }

    const rows = Array.from(groups.values())
        .map((g) => {
            const sorted = [...g.jobs].sort((a, b) =>
                String(b.failedAt ?? "").localeCompare(String(a.failedAt ?? ""))
            );
            const primary = sorted[0];
            return {
                ...g,
                primary,
                count: g.jobs.length,
                failureClass: worstFailureClass(g.jobs),
                latestError: String(primary?.failureReason ?? "-"),
                latestFailedAt: String(primary?.failedAt ?? ""),
                userId: primary?.userId ?? null,
                userIdentifier: primary?.userIdentifier ?? null,
            };
        })
        .sort((a, b) => String(b.latestFailedAt).localeCompare(String(a.latestFailedAt)));

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                        DLQ inbox
                    </h1>
                    <p className="mt-1 text-sm text-mutedForeground">Active failures only.</p>
                </div>

                <span className="shrink-0 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-mutedForeground">
                    {items.length} jobs · {rows.length} groups
                </span>
            </div>

            {rows.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card shadow-elev-1">
                    <div className="px-6 py-10">
                        <p className="text-sm font-medium text-foreground">No DLQ jobs</p>
                    </div>
                </div>
            ) : (
                <div className="rounded-3xl border border-border bg-card shadow-elev-1 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-[1100px] w-full table-fixed text-sm">
                            <thead className="sticky top-0 z-10 bg-card/80 backdrop-blur border-b border-border">
                                <tr className="text-left text-[11px] text-mutedForeground">
                                    <th className="w-[90px] px-4 py-3 font-semibold">User</th>
                                    <th className="w-[110px] px-4 py-3 font-semibold">Type</th>
                                    <th className="w-[260px] px-4 py-3 font-semibold">Token</th>
                                    <th className="w-[120px] px-4 py-3 font-semibold">Failure</th>
                                    <th className="w-[90px] px-4 py-3 font-semibold">Dupes</th>
                                    <th className="px-4 py-3 font-semibold">Error</th>
                                    <th className="w-[120px] px-4 py-3 font-semibold">Failed</th>
                                    <th className="w-[220px] px-4 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-border">
                                {rows.map((r) => {
                                    const userLabel =
                                        r.userId != null ? String(r.userId) : String(r.userIdentifier ?? "-");
                                    const token = r.token;
                                    const type = r.type;

                                    return (
                                        <tr key={r.key} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="font-mono text-xs text-foreground/80">
                                                    {userLabel}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <Badge tone={badgeToneForType(type)}>{type}</Badge>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="font-mono text-xs text-foreground"
                                                        title={token}
                                                    >
                                                        {shortId(token)}
                                                    </span>
                                                    <CopyButton value={token} label="Copy token" />
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <Badge tone={badgeToneForFailureClass(r.failureClass)}>
                                                    {r.failureClass ?? "unknown"}
                                                </Badge>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-xs text-mutedForeground">
                                                    {r.count > 1 ? `×${r.count}` : "—"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="truncate text-foreground/80" title={r.latestError}>
                                                    {r.latestError}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-mutedForeground">
                                                        {r.count > 1 ? `×${r.count}` : "—"}
                                                    </span>

                                                    <DlqGroupDetailsDialog
                                                        title={`${r.type} · ${r.token}`}
                                                        subtitle={`User ${r.userId ?? r.userIdentifier ?? "-"}`}
                                                        jobs={r.jobs.map((j) => ({
                                                            id: String(j.id),
                                                            webhookEventId: j.webhookEventId,
                                                            failedAt: j.failedAt,
                                                            attempts: j.attempts,
                                                            failureReason: j.failureReason,
                                                            failureClass: j.failureClass,
                                                        }))}
                                                    />
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex justify-end gap-2">
                                                    <form action={dlqResolveGroup}>
                                                        <input
                                                            type="hidden"
                                                            name="primaryDlqJobId"
                                                            value={String(r.primary?.id)}
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name="dlqJobIds"
                                                            value={JSON.stringify(r.jobs.map((j) => String(j.id)))}
                                                        />
                                                        <ActionButton variant="primary">
                                                            {r.count > 1 ? "Resolve" : "Replay"}
                                                        </ActionButton>
                                                    </form>

                                                    <form action={dlqArchiveGroup}>
                                                        <input
                                                            type="hidden"
                                                            name="dlqJobIds"
                                                            value={JSON.stringify(r.jobs.map((j) => String(j.id)))}
                                                        />
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
