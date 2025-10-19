"use client";

import { Card } from "@repo/ui/card";
import { useTransactions } from "@repo/store";

export const OnRampTransactions = () => {
    const { onRampTransactions, isLoading } = useTransactions();

    if (isLoading) {
        return (
            <Card title="Recent Transactions">
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Loading transactions...
                </div>
            </Card>
        );
    }

    if (!onRampTransactions.length) {
        return (
            <Card title="Recent Transactions">
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No Recent transactions
                </div>
            </Card>
        );
    }

    return (
        <Card title="Recent Transactions">
            <div className="pt-2 divide-y divide-gray-200 dark:divide-neutral-700">
                {onRampTransactions.map((t) => (
                    <div key={t.id} className="flex justify-between py-3">
                        <div>
                            <div className="text-sm font-medium dark:text-gray-200">
                                {t.provider}
                            </div>
                            <div className="text-slate-600 dark:text-gray-400 text-xs">
                                {new Date(t.time).toLocaleString()}
                            </div>
                            <span
                                className={`text-xs px-2 py-0.5 rounded ${t.status === "Success"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : t.status === "Processing"
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                    }`}
                            >
                                {t.status}
                            </span>
                        </div>
                        <div className="flex flex-col justify-center font-semibold text-green-600 dark:text-green-400">
                            + ₹{(t.amount / 100).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};
