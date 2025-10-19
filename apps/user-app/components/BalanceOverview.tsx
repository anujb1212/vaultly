"use client";

import { useBalance } from "@repo/store";

export function BalanceOverview() {
    const { balance, isLoading } = useBalance();

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 text-lg">
                    Balance
                </h3>
                <div className="text-xl text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 text-lg">
                Balance
            </h3>
            <div className="text-3xl font-bold text-green-700 dark:text-green-500">
                ₹{(balance.amount / 100).toLocaleString()}
            </div>
            {balance.locked > 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Locked: ₹{(balance.locked / 100).toLocaleString()}
                </div>
            )}
        </div>
    );
}
