"use client";

import { Card } from "@repo/ui/card";
import { useBalance } from "@repo/store";

export const BalanceCard = () => {
    const { balance, isLoading } = useBalance();

    if (isLoading) {
        return (
            <Card title="Balance">
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    Loading balance...
                </div>
            </Card>
        );
    }

    return (
        <Card title="Balance">
            <div className="flex justify-between border-b border-slate-300 pb-2 dark:border-neutral-700">
                <div>Unlocked balance</div>
                <div>₹{(balance.amount / 100).toLocaleString()}</div>
            </div>
            <div className="flex justify-between border-b border-slate-300 py-2 dark:border-neutral-700">
                <div>Total Locked Balance</div>
                <div>₹{(balance.locked / 100).toLocaleString()}</div>
            </div>
            <div className="flex justify-between border-b border-slate-300 py-2 dark:border-neutral-700">
                <div>Total Balance</div>
                <div className="font-semibold">
                    ₹{((balance.locked + balance.amount) / 100).toLocaleString()}
                </div>
            </div>
        </Card>
    );
};
