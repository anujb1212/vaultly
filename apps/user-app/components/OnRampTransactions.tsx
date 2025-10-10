import { Card } from "@repo/ui/card";

type TransactionStatus = "Processing" | "Success" | "Failure";

export const OnRampTransactions = ({
    transactions,
}: {
    transactions: {
        time: Date;
        amount: number;
        status: TransactionStatus;
        provider: string;
    }[];
}) => {
    if (!transactions.length) {
        return (
            <Card title="Recent Transactions">
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No Recent transactions</div>
            </Card>
        );
    }
    return (
        <Card title="Recent Transactions">
            <div className="pt-2 divide-y divide-gray-200 dark:divide-neutral-700">
                {transactions.map((t, i) => (
                    <div key={i} className="flex justify-between py-3">
                        <div>
                            <div className="text-sm">Received INR</div>
                            <div className="text-slate-600 dark:text-gray-400 text-xs">{t.time.toDateString()}</div>
                        </div>
                        <div className="flex flex-col justify-center font-semibold text-green-600">+ Rs {t.amount / 100}</div>
                    </div>
                ))}
            </div>
        </Card>
    );
};
