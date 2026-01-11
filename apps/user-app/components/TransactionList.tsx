import { ArrowRight } from "lucide-react";

type TxStatus = "Success" | "Failed" | "Processing";

type Tx = {
    description?: string;
    time: string | number | Date;
    status: TxStatus | string;
    amount: number | string;
    provider?: string;
};

export function TransactionList({ transactions, showViewAll = false }: { transactions: Tx[]; showViewAll?: boolean }) {
    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg tracking-tight">Recent Activity</h3>
                {showViewAll && (
                    <a href="/transactions" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 flex items-center hover:text-indigo-700 transition-colors">
                        View all <ArrowRight className="ml-1 w-4 h-4" />
                    </a>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {transactions.length === 0 ? (
                        <li className="py-8 text-center text-slate-400 dark:text-neutral-500 italic text-sm">
                            No recent transactions found.
                        </li>
                    ) : (
                        transactions.slice(0, showViewAll ? transactions.length : 5).map((tx, idx) => (
                            <li key={idx} className="flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    {/* Icon/Avatar based on status */}
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                                        ${tx.status === 'Success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                            tx.status === 'Processing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                                'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'}
                                    `}>
                                        {tx.description?.[0] || "T"}
                                    </div>

                                    <div>
                                        <div className="font-medium text-slate-900 dark:text-white text-sm">
                                            {tx.description || "Payment"}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-neutral-500">
                                            {new Date(tx.time).toLocaleDateString(undefined, {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className={`font-semibold text-sm ${tx.status === "Failed" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                                        }`}>
                                        {tx.status === "Failed" ? "Failed" : `+ ₹${Number(tx.amount).toLocaleString('en-IN')}`}
                                    </div>
                                    {tx.status === "Processing" && (
                                        <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                            Processing
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
