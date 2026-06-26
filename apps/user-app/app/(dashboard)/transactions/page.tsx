"use client";

import { useMemo, useState } from "react";
import { useTransactions } from "@repo/store";
import { ArrowUpDown, Search, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";

type TxStatus = "Pending" | "Success" | "Failed" | "Processing" | string;

const ITEMS_PER_PAGE = 10;

export default function TransactionsPage() {
    const { onRampTransactions, p2pTransactions, arbitiumTransactions, isLoading } = useTransactions();
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
                ? `Sent to ${tx.toUserName || tx.toUser}`
                : `Received from ${tx.toUserName || tx.toUser}`,
            provider: "Vaultly P2P",
            type: 'P2P',
            rawStatus: 'Success',
            displayStatus: 'Success',
            isDebit: tx.type === 'sent'
        }));

        const arbitiumTxns = arbitiumTransactions.map((tx) => ({
            ...tx,
            time: new Date(tx.time),
            description: tx.direction === "DEPOSIT"
                ? "Deposited to Arbitium Exchange"
                : "Withdrawn from Arbitium Exchange",
            provider: "Arbitium Exchange",
            type: "Arbitium",
            rawStatus: "Success",
            displayStatus: "Success",
            isDebit: tx.direction === "DEPOSIT",
        }));

        return [...onRampTxns, ...p2pTxns, ...arbitiumTxns].sort(
            (a, b) => b.time.getTime() - a.time.getTime()
        );
    }, [onRampTransactions, p2pTransactions, arbitiumTransactions]);

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

    if (isLoading) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 animate-fade-in">
                <div className="h-64 rounded-[2rem] bg-slate-100 dark:bg-[#06020f] border border-slate-200 dark:border-white/5 shadow-2xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 animate-fade-in">
            <div className="mb-12">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight drop-shadow-sm">All Transactions</h1>
                <p className="text-slate-500 dark:text-white/60 mt-3 font-medium">View and manage your entire financial history.</p>
            </div>

            <section className="relative overflow-hidden bg-white dark:bg-[#06020f] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl transition-colors duration-300 isolate">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                
                <div className="relative z-10 p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-white/[0.02] backdrop-blur-md">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-white dark:bg-[#0a0515] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 pl-11 pr-4 py-3.5 transition-all shadow-sm outline-none"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as TxStatus | "All")}
                            className="bg-white dark:bg-[#0a0515] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 text-sm font-medium rounded-xl block p-3.5 cursor-pointer shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                        >
                            <option value="All">All Status</option>
                            <option value="Success">Success</option>
                            <option value="Processing">Processing</option>
                            <option value="Failed">Failed</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-3.5 bg-white dark:bg-[#0a0515] border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all shadow-sm group"
                        >
                            <ArrowUpDown className="w-4 h-4 text-slate-600 dark:text-white/80 group-hover:text-indigo-500 transition-colors" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-white/[0.01] text-xs uppercase tracking-widest text-slate-500 dark:text-white/40 font-bold border-b border-slate-100 dark:border-white/5">
                                <th className="p-6 pl-8 w-[40%]">Description</th>
                                <th className="p-6 w-[25%]">Date</th>
                                <th className="p-6 w-[15%]">Status</th>
                                <th className="p-6 pr-8 text-right w-[20%]">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {paginatedTransactions.length > 0 ? (
                                paginatedTransactions.map((tx, idx) => {
                                    const isDebit = tx.isDebit;
                                    const status = tx.displayStatus;

                                    const isFailure = status === 'Failed' || status === 'Failure';
                                    const isProcessing = status === 'Processing';
                                    const isSuccess = status === 'Success';

                                    let tone = "";
                                    if (isFailure || (isSuccess && isDebit)) {
                                        tone = "text-rose-600 dark:text-rose-400";
                                    } else if (isProcessing) {
                                        tone = "text-amber-600 dark:text-amber-400";
                                    } else {
                                        tone = "text-emerald-600 dark:text-emerald-400";
                                    }

                                    const sign = isFailure ? '' : (isDebit ? '- ' : '+ ');
                                    const amountClass = `${tone} ${isFailure ? 'line-through opacity-70' : ''}`;

                                    return (
                                        <tr key={`${tx.time.getTime()}-${idx}`} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                            <td className="p-6 pl-8 truncate">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${isSuccess && !isDebit
                                                            ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400"
                                                            : isProcessing
                                                                ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400"
                                                                : "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400"
                                                            }`}
                                                    >
                                                        {status === "Success" ? (
                                                            isDebit ? <ArrowUpRight className="w-5 h-5 drop-shadow-sm" /> : <ArrowDownLeft className="w-5 h-5 drop-shadow-sm" />
                                                        ) : status === "Processing" ? (
                                                            <Clock className="w-5 h-5 drop-shadow-sm" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 drop-shadow-sm" />
                                                        )}
                                                    </div>
                                                    <div className="truncate">
                                                        <div className={`font-bold text-sm truncate ${isFailure ? 'text-slate-400 line-through decoration-slate-400' : 'text-slate-900 dark:text-white drop-shadow-sm'}`}>{tx.description}</div>
                                                        <div className="text-xs font-medium text-slate-500 dark:text-white/50 mt-1 truncate">{tx.provider}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-sm font-medium text-slate-500 dark:text-white/60 whitespace-nowrap">
                                                {tx.time.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-6">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap
                                                    ${isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                                        isProcessing ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                                                            'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                                                    }`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className={`p-6 pr-8 text-right font-extrabold tabular-nums tracking-tight ${amountClass}`}>
                                                {sign}₹{(tx.amount / 100).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center">
                                        <div className="text-slate-900 dark:text-white font-bold tracking-tight">No transactions found</div>
                                        <div className="text-sm text-slate-500 dark:text-white/50 mt-1 font-medium">Try adjusting your search or filters.</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02] backdrop-blur-md relative z-10">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-xl bg-white dark:bg-[#0a0515] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-white/80 shadow-sm active:scale-95"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <span className="text-sm font-bold text-slate-500 dark:text-white/50">
                            Page <span className="text-slate-900 dark:text-white drop-shadow-sm">{currentPage}</span> of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-xl bg-white dark:bg-[#0a0515] border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-white/80 shadow-sm active:scale-95"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
