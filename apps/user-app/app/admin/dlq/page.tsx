import { ActionButton } from "../../../components/dlq/ActionButton";
import { Badge } from "../../../components/dlq/Badge";
import { CopyButton } from "../../../components/dlq/CopyButton";
import { dlqArchive, dlqList, dlqReplay } from "../../lib/actions/dlq";

function shortId(s?: string) {
    if (!s) return "-";
    if (s.length <= 14) return s;
    return `${s.slice(0, 6)}…${s.slice(-6)}`;
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

export default async function AdminDlqPage() {
    const { jobs } = await dlqList();

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">DLQ inbox</h1>
                    <p className="text-sm text-white/70">
                        Active failures only. Replay transient items archive permanent ones after triage.
                    </p>
                </div>

                <div className="text-xs text-white/60">
                    Showing <span className="text-white/80">{jobs.length}</span>
                </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="sticky top-0 bg-black/40 backdrop-blur border-b border-white/10">
                            <tr className="text-left text-xs text-white/70">
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3">Failure</th>
                                <th className="px-4 py-3">Token</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Last error</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-white/10">
                            {jobs.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-white/60" colSpan={6}>
                                        No DLQ jobs.
                                    </td>
                                </tr>
                            ) : (
                                jobs.map((j: any) => (
                                    <tr key={j.id} className="hover:bg-white/5">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-white/90" title={String(j.id)}>
                                                    {shortId(String(j.id))}
                                                </span>
                                                <CopyButton value={String(j.id)} label="Copy" />
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <Badge tone={badgeToneForFailureClass(j.failureClass)}>
                                                {j.failureClass ?? "unknown"}
                                            </Badge>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-white/90" title={String(j.token ?? "")}>
                                                    {j.token ? shortId(String(j.token)) : "-"}
                                                </span>
                                                {j.token ? <CopyButton value={String(j.token)} label="Copy" /> : null}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <Badge tone={badgeToneForType(j.type)}>{j.type ?? "-"}</Badge>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="max-w-[520px] truncate text-white/80" title={String(j.lastError ?? "")}>
                                                {j.lastError ?? "-"}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
