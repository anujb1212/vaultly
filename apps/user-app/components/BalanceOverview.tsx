export function BalanceOverview({ amount, locked }: { amount: number; locked: number }) {
    return (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 text-lg">Balance</h3>
            <div className="text-3xl font-bold text-green-700">₹{amount.toLocaleString()}</div>
            {locked > 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Locked: ₹{locked.toLocaleString()}</div>
            )}
        </div>
    );
}
