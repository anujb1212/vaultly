"use client";

import { useMemo, useState } from "react";
import { useTransactions } from "@repo/store";
import { ArrowUpDown, Search, ChevronLeft, ChevronRight } from "lucide-react";

type TxStatus = "Pending" | "Success" | "Failed" | "Processing" | string;

const ITEMS_PER_PAGE = 10;

export default function TransactionsPage() {
    const { onRampTransactions, p2pTransactions, isLoading } = useTransactions();
    const [currentPage, setCurrentPage] = useState(1);

    const combinedTransactions = useMemo(() => {
        const onRampTxns = onRampTransactions.map((tx) => ({
            ...tx,
            time: new Date(tx.time),
            description: `Added from ${tx.provider}`,
            provider: tx.provider,
            type: 'OnRamp',
            rawStatus: tx.status,
            displayStatus: tx.status,
            isDebit: false
        }));

        const p2pTxns = p2pTransactions.map((tx) => ({
            ...tx,
            time: new Date(tx.time),
            description: tx.type === 'sent'
                ? `Sent to ${tx.toUser}`
                : `Received from ${tx.toUser}`,
            provider: "Vaultly P2P",
            type: 'P2P',
            rawStatus: 'Success',
            displayStatus: 'Success',
            isDebit: tx.type === 'sent'
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

    const totalPages = Math.ceil(filteredSortedTransactions.length / ITEMS_PER_PAGE);
    const paginatedTransactions = filteredSortedTransactions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    if (isLoading) return <div className="p-12 text-center text-slate-400">Loading history...</div>;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Transactions</h1>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-neutral-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-neutral-900">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 pl-10 pr-4 py-3 transition shadow-sm"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as TxStatus | "All")}
                            className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 text-sm rounded-xl block p-3 cursor-pointer shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="All">All Status</option>
                            <option value="Success">Success</option>
                            <option value="Processing">Processing</option>
                            <option value="Failed">Failed</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-3 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800 transition"
                        >
                            <ArrowUpDown className="w-4 h-4 text-slate-600 dark:text-neutral-400" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-neutral-900/50 text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-500 font-semibold border-b border-slate-100 dark:border-neutral-800">
                                <th className="p-5 pl-8 w-[40%]">Description</th>
                                <th className="p-5 w-[25%]">Date</th>
                                <th className="p-5 w-[15%]">Status</th>
                                <th className="p-5 pr-8 text-right w-[20%]">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                            {paginatedTransactions.length > 0 ? (
                                paginatedTransactions.map((tx, idx) => {
                                    const isDebit = tx.isDebit;
                                    const isFailure = tx.displayStatus === 'Failed';
                                    let amountClass = "text-emerald-600 dark:text-emerald-400";
                                    if (isFailure) {
                                        amountClass = "text-rose-500 dark:text-rose-400 line-through opacity-70";
                                    } else if (isDebit) {
                                        amountClass = "text-rose-600 dark:text-rose-400";
                                    }
                                    const sign = isFailure ? '' : (isDebit ? '- ' : '+ ');

                                    return (
                                        <tr key={`${tx.time.getTime()}-${idx}`} className="group hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="p-5 pl-8 truncate">
                                                <div className="font-semibold text-slate-900 dark:text-white truncate">{tx.description}</div>
                                                <div className="text-xs font-medium text-slate-500 dark:text-neutral-500 mt-0.5 truncate">{tx.provider}</div>
                                            </td>
                                            <td className="p-5 text-sm text-slate-500 dark:text-neutral-400 whitespace-nowrap">
                                                {tx.time.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap
                                                    ${tx.displayStatus === 'Success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                                        tx.displayStatus === 'Processing' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                                                            'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                                                    }`}>
                                                    {tx.displayStatus}
                                                </span>
                                            </td>
                                            <td className={`p-5 pr-8 text-right font-bold tabular-nums ${amountClass}`}>
                                                {sign}₹{(tx.amount / 100).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-500 dark:text-neutral-500">
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between bg-slate-50/50 dark:bg-neutral-900">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-neutral-400"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <span className="text-sm font-medium text-slate-600 dark:text-neutral-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-neutral-400"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
