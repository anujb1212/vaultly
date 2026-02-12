"use client";

export type RecentItem = {
    id: number;
    time: string | number | Date;
    status: "Success" | "Processing" | "Failed";
    displayName: string;
    amountPaise: number;
};

function fmtPaise(paise: number) {
    const abs = Math.abs(Math.trunc(paise));
    const rs = Math.trunc(abs / 100).toLocaleString("en-IN");
    const ps = String(abs % 100).padStart(2, "0");
    return { rs, ps };
}

export function RecentOfframpActivity(props: {
    selectedLabel: string | null;
    items: RecentItem[];
}) {
    const { selectedLabel, items } = props;

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-lg tracking-tight">
                            Recent activity
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1">
                            {selectedLabel ? `Withdrawals to ${selectedLabel}.` : "Select an account to view recent withdrawals."}
                        </p>
                    </div>
                    <a
                        href="/transactions"
                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                    >
                        View all
                    </a>
                </div>
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
                {!selectedLabel ? (
                    <li className="py-10 text-center text-slate-400 dark:text-neutral-500 italic text-sm">
                        Select a linked account to see activity.
                    </li>
                ) : items.length === 0 ? (
                    <li className="py-10 text-center text-slate-400 dark:text-neutral-500 italic text-sm">
                        No recent withdrawals for this account.
                    </li>
                ) : (
                    items.map((t) => {
                        const amt = fmtPaise(t.amountPaise);
                        const badge =
                            t.status === "Success"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                                : t.status === "Processing"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                    : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400";

                        return (
                            <li
                                key={t.id}
                                className="flex justify-between items-center px-5 py-4 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${badge}`}>
                                        W
                                    </div>

                                    <div>
                                        <div className="font-medium text-slate-900 dark:text-white text-sm">
                                            Withdraw to {t.displayName}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-neutral-500">
                                            {new Date(t.time).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div
                                        className={
                                            "font-semibold text-sm " +
                                            (t.status === "Failed" ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white")
                                        }
                                    >
                                        {t.status === "Failed" ? "Failed" : `- ₹${amt.rs}.${amt.ps}`}
                                    </div>

                                    {t.status === "Processing" ? (
                                        <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                            Processing
                                        </div>
                                    ) : null}
                                </div>
                            </li>
                        );
                    })
                )}
            </ul>
        </div>
    );
}
