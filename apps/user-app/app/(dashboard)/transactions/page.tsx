"use client";

import { useState, useMemo } from "react";

interface Transaction {
    time: Date;
    amount: number;
    status: "Pending" | "Success" | "Failed" | string;
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
    // Using internal React state for transactions to allow optimistic updates
    const [onRampTransactionsState, setOnRampTransactionsState] = useState(onRampTransactions);
    const [p2pTransfersState, setP2pTransfersState] = useState(p2pTransfers);

    // Function to add a new P2P transaction optimistically
    function addP2pTransferTxn(newTx: Transaction) {
        setP2pTransfersState((prev) => [newTx, ...prev]);
    }

    const combinedTransactions: Transaction[] = useMemo(() => {
        const onRampTxns = onRampTransactionsState.map((tx) => ({
            ...tx,
            provider: "Wallet",
            description: tx.description ?? "Wallet Transaction",
        }));

        const p2pTxns = p2pTransfersState.map((tx) => ({
            ...tx,
            provider: "Bank Transfer",
            description: tx.description ?? "Bank Transfer",
        }));

        return [...onRampTxns, ...p2pTxns].sort((a, b) => b.time.getTime() - a.time.getTime());
    }, [onRampTransactionsState, p2pTransfersState]);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
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
                    tx.description?.toLowerCase().includes(lowerTerm) ||
                    tx.provider?.toLowerCase().includes(lowerTerm)
            );
        }

        filtered.sort((a, b) => {
            let comp = 0;
            if (sortField === "amount") {
                comp = a.amount - b.amount;
            } else if (sortField === "time") {
                comp = a.time.getTime() - b.time.getTime();
            } else if (sortField === "status") {
                comp = a.status.localeCompare(b.status);
            }
            return sortOrder === "asc" ? comp : -comp;
        });

        return filtered;
    }, [combinedTransactions, filterStatus, searchTerm, sortField, sortOrder]);

    // You can expose addP2pTransferOptimistically by context or props for cross-component usage

    return (
        <div className="min-h-screen bg-gray-50 p-8 max-w-5xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-[#6a51a6]">Transactions</h1>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search by description or provider"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full md:w-40 px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="All">All Statuses</option>
                    <option value="Success">Success</option>
                    <option value="Failed">Failed</option>
                    <option value="Pending">Pending</option>
                </select>

                <div className="flex space-x-2 w-full md:w-auto">
                    <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value as "time" | "amount" | "status")}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="time">Sort by Date</option>
                        <option value="amount">Sort by Amount</option>
                        <option value="status">Sort by Status</option>
                    </select>
                    <button
                        onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        type="button"
                        aria-label="Toggle sort order"
                    >
                        {sortOrder === "asc" ? "Asc" : "Desc"}
                    </button>
                </div>
            </div>

            {/* Transaction Table */}
            <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="p-3 text-sm font-medium text-gray-600">Date & Time</th>
                            <th className="p-3 text-sm font-medium text-gray-600">Description</th>
                            <th className="p-3 text-sm font-medium text-gray-600">Amount</th>
                            <th className="p-3 text-sm font-medium text-gray-600">Status</th>
                            <th className="p-3 text-sm font-medium text-gray-600">Provider</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSortedTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500 italic">
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            filteredSortedTransactions.map((tx, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-3">{tx.time.toLocaleString()}</td>
                                    <td className="p-3">{tx.description}</td>
                                    <td
                                        className={`p-3 font-semibold ${tx.status === "Failed" ? "text-red-500" : "text-green-600"}`}
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
    );
}
