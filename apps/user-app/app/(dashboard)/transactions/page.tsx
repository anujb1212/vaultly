"use client";

import { useMemo, useState } from "react";

type TxStatus = "Pending" | "Success" | "Failed" | string;

interface Transaction {
    time: Date;
    amount: number;
    status: TxStatus;
    provider?: string;
    description?: string;
}

interface TransactionsPageProps {
    onRampTransactions?: Transaction[];
    p2pTransfers?: Transaction[];
}

export default function TransactionsPage({
    onRampTransactions = [],
    p2pTransfers = [],
}: TransactionsPageProps) {
    const [onRampTransactionsState, setOnRampTransactionsState] = useState<Transaction[]>(onRampTransactions);
    const [p2pTransfersState, setP2pTransfersState] = useState<Transaction[]>(p2pTransfers);

    function addP2pTransferTxn(newTx: Transaction) {
        setP2pTransfersState((prev) => [newTx, ...prev]);
    }

    const combinedTransactions: Transaction[] = useMemo(() => {
        const onRampTxns = onRampTransactionsState.map((tx) => ({
            ...tx,
            provider: tx.provider ?? "Wallet",
            description: tx.description ?? "Wallet Transaction",
        }));
        const p2pTxns = p2pTransfersState.map((tx) => ({
            ...tx,
            provider: tx.provider ?? "Bank Transfer",
            description: tx.description ?? "Bank Transfer",
        }));
        return [...onRampTxns, ...p2pTxns].sort((a, b) => b.time.getTime() - a.time.getTime());
    }, [onRampTransactionsState, p2pTransfersState]);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<TxStatus | "All">("All");
    const [sortField, setSortField] = useState<"time" | "amount" | "status">("time");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const filteredSortedTransactions = useMemo(() => {
        let filtered = combinedTransactions;
        if (filterStatus !== "All") {
            filtered = filtered.filter((tx) => tx.status === filterStatus);
        }
        if (searchTerm.trim() !== "") {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (tx) =>
                    (tx.description && tx.description.toLowerCase().includes(lowerTerm)) ||
                    (tx.provider && tx.provider.toLowerCase().includes(lowerTerm))
            );
        }
        filtered.sort((a, b) => {
            let comp = 0;
            if (sortField === "amount") {
                comp = a.amount - b.amount;
            } else if (sortField === "time") {
                comp = a.time.getTime() - b.time.getTime();
            } else if (sortField === "status") {
                comp = String(a.status).localeCompare(String(b.status));
            }
            return sortOrder === "asc" ? comp : -comp;
        });
        return filtered;
    }, [combinedTransactions, filterStatus, searchTerm, sortField, sortOrder]);

    return (
        <div className="min-h-screen py-6">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow p-8 max-w-6xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-semibold text-primary-900 dark:text-white">Transactions</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Search, filter, and sort all on-ramp and P2P transfers.
                    </p>
                </header>

                {/* Controls */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Search by description or provider"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-neutral-900 dark:text-white transition"
                        aria-label="Search transactions"
                    />

                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as TxStatus | "All")}
                            className="w-full md:w-40 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-neutral-900 dark:text-white transition"
                            aria-label="Filter by status"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Success">Success</option>
                            <option value="Failed">Failed</option>
                            <option value="Pending">Pending</option>
                        </select>

                        <select
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value as "time" | "amount" | "status")}
                            className="w-full md:w-48 px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-neutral-900 dark:text-white transition"
                            aria-label="Sort field"
                        >
                            <option value="time">Sort by Date</option>
                            <option value="amount">Sort by Amount</option>
                            <option value="status">Sort by Status</option>
                        </select>

                        <button
                            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                            type="button"
                            aria-label="Toggle sort order"
                        >
                            {sortOrder === "asc" ? "Asc" : "Desc"}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-neutral-700">
                                <th className="p-3 text-sm font-medium text-gray-600 dark:text-gray-400">Date & Time</th>
                                <th className="p-3 text-sm font-medium text-gray-600 dark:text-gray-400">Description</th>
                                <th className="p-3 text-sm font-medium text-gray-600 dark:text-gray-400">Amount</th>
                                <th className="p-3 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                                <th className="p-3 text-sm font-medium text-gray-600 dark:text-gray-400">Provider</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSortedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-gray-500 dark:text-gray-400 italic">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                filteredSortedTransactions.map((tx, idx) => (
                                    <tr
                                        key={`${tx.time.getTime()}-${idx}`}
                                        className="border-b border-gray-100 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-900/60"
                                    >
                                        <td className="p-3 whitespace-nowrap">{tx.time.toLocaleString()}</td>
                                        <td className="p-3">{tx.description}</td>
                                        <td
                                            className={`p-3 font-semibold ${tx.status === "Failed" ? "text-red-500" : "text-green-600"
                                                }`}
                                        >
                                            ₹{tx.amount}
                                        </td>
                                        <td className="p-3">{tx.status}</td>
                                        <td className="p-3">{tx.provider}</td>
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
