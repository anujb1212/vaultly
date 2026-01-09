"use client";

import { useMemo, useState } from "react";
import { useTransactions } from "@repo/store";
import { ArrowUpDown, Search, Filter } from "lucide-react";

type TxStatus = "Pending" | "Success" | "Failed" | "Processing" | string;

export default function TransactionsPage() {
    const { onRampTransactions, p2pTransactions, isLoading } = useTransactions();

    const combinedTransactions = useMemo(() => {
        const onRampTxns = onRampTransactions.map((tx) => ({
            ...tx,
            time: new Date(tx.time),
            description: `Added from ${tx.provider}`,
            provider: tx.provider,
            type: 'OnRamp',
            rawStatus: tx.status,
            displayStatus: tx.status
        }));

        const p2pTxns = p2pTransactions.map((tx) => ({
            ...tx,
            time: new Date(tx.time),
            description: `Sent to user ${tx.toUser}`,
            provider: "Vaultly P2P",
            type: 'P2P',
            rawStatus: 'Success',
            displayStatus: 'Success'
        }));

        return [...onRampTxns, ...p2pTxns].sort(
            (a, b) => b.time.getTime() - a.time.getTime()
        );
    }, [onRampTransactions, p2pTransactions]);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<TxStatus | "All">("All");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const filteredSortedTransactions = useMemo(() => {
        let filtered = combinedTransactions;
        if (filterStatus !== "All") {
            filtered = filtered.filter((tx) => tx.displayStatus === filterStatus);
        }
        if (searchTerm.trim() !== "") {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (tx) => (tx.description && tx.description.toLowerCase().includes(lowerTerm)) ||
                    (tx.provider && tx.provider.toLowerCase().includes(lowerTerm))
            );
        }
        filtered.sort((a, b) => {
            const dateA = a.time.getTime();
            const dateB = b.time.getTime();
            return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });
        return filtered;
    }, [combinedTransactions, filterStatus, searchTerm, sortOrder]);

    if (isLoading) return <div className="p-12 text-center text-slate-400">Loading history...</div>;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Transactions</h1>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-neutral-900">
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-96 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 block p-2.5 transition"
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as TxStatus | "All")}
                        className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 text-sm rounded-xl block p-2.5 cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="Success">Success</option>
                        <option value="Processing">Processing</option>
                        <option value="Failed">Failed</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-neutral-900/50 text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-500 font-semibold border-b border-slate-100 dark:border-neutral-800">
                                <th className="p-4 pl-6">Description</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 pr-6 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                            {filteredSortedTransactions.map((tx, idx) => {
                                // Logic for Styling
                                const isDebit = tx.type === 'P2P';
                                const isFailure = tx.displayStatus === 'Failed';

                                // FORCE RED CLASS for P2P transfers
                                let amountClass = "text-slate-900 dark:text-white"; // Default
                                if (isFailure) {
                                    amountClass = "text-rose-500 dark:text-rose-400 line-through opacity-70";
                                } else if (isDebit) {
                                    amountClass = "text-rose-600 dark:text-rose-400"; // Red for outgoing
                                } else {
                                    amountClass = "text-emerald-600 dark:text-emerald-400"; // Green for incoming
                                }

                                const sign = isFailure ? '' : (isDebit ? '- ' : '+ ');

                                return (
                                    <tr key={`${tx.time.getTime()}-${idx}`} className="group hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="p-4 pl-6">
                                            <div className="font-medium text-slate-900 dark:text-white">{tx.description}</div>
                                            <div className="text-xs text-slate-500 dark:text-neutral-500">{tx.provider}</div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500 dark:text-neutral-400 whitespace-nowrap">
                                            {tx.time.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${tx.displayStatus === 'Success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50' :
                                                    tx.displayStatus === 'Processing' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50' :
                                                        'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/50'
                                                }`}>
                                                {tx.displayStatus}
                                            </span>
                                        </td>
                                        <td className={`p-4 pr-6 text-right font-medium ${amountClass}`}>
                                            {sign} ₹{(tx.amount / 100).toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
