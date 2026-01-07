"use client";

import { FaArrowCircleRight, FaWallet } from "react-icons/fa";
import { useBalance, useTransactions } from "@repo/store";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
    const { balance, isLoading: balanceLoading, refresh: refreshBalance } = useBalance();
    const { onRampTransactions, isLoading: txnsLoading, refresh: refreshTransactions } = useTransactions();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const onramp = searchParams.get("onramp");
        if (onramp !== "1") return;

        let cancelled = false;

        async function run() {
            // Immediate refresh
            await Promise.allSettled([refreshBalance(), refreshTransactions()]);

            // Retries for slow webhooks
            const delays = [800, 1600, 3000];
            for (const d of delays) {
                if (cancelled) return;
                await new Promise((r) => setTimeout(r, d));
                await Promise.allSettled([refreshBalance(), refreshTransactions()]);
            }

            if (!cancelled) router.replace("/dashboard");
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [searchParams, refreshBalance, refreshTransactions, router]);

    const recentTransactions = onRampTransactions.slice(0, 3);

    return (
        <div className="py-2">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-primary-900 dark:text-white mb-1">
                    Dashboard
                </h1>
                <p className="text-base text-gray-500 dark:text-gray-300">Welcome back</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow p-6 flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold mb-1">
                        Total Balance
                    </span>
                    {balanceLoading ? (
                        <span className="text-2xl text-gray-400">Loading...</span>
                    ) : (
                        <>
                            <span className="text-3xl font-bold text-green-600 flex items-center">
                                <FaWallet className="mr-2" /> ₹{(balance.amount / 100).toLocaleString()}
                            </span>
                            {balance.locked > 0 && (
                                <span className="text-xs text-gray-400 mt-2">
                                    Locked: ₹{(balance.locked / 100).toLocaleString()}
                                </span>
                            )}
                        </>
                    )}
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow p-6 flex flex-col gap-4">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold mb-2">
                        Quick Actions
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push("/transfer")}
                            className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow font-semibold transition"
                        >
                            Add Money
                        </button>
                        <button
                            onClick={() => router.push("/p2ptransfer")}
                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow font-semibold transition"
                        >
                            Send Money
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600 rounded-lg font-medium transition">
                            Request
                        </button>
                        <button className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow font-semibold transition">
                            Generate QR
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow p-6 flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold mb-2">
                        Recent Activity
                    </span>
                    <div className="h-28 flex items-center justify-center">
                        {txnsLoading ? (
                            <div className="text-gray-400">Loading...</div>
                        ) : (
                            <div className="rounded-full bg-blue-100 dark:bg-blue-900 w-24 h-24 flex items-center justify-center text-lg text-blue-700 dark:text-blue-300 font-bold">
                                {onRampTransactions.length} txns
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white dark:bg-neutral-800 rounded-2xl shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                            Recent Transactions
                        </span>
                        <button
                            onClick={() => router.push("/transactions")}
                            className="text-sm text-primary-600 dark:text-primary-400 flex items-center hover:underline"
                        >
                            View all <FaArrowCircleRight className="ml-1" />
                        </button>
                    </div>

                    {txnsLoading ? (
                        <div className="text-center py-8 text-gray-400">Loading transactions...</div>
                    ) : recentTransactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">No transactions yet</div>
                    ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-neutral-700">
                            {recentTransactions.map((tx) => (
                                <li className="flex justify-between py-3 items-center" key={tx.id}>
                                    <div>
                                        <span className="block font-medium dark:text-gray-200">{tx.provider}</span>
                                        <span className="block text-xs text-gray-400">
                                            {new Date(tx.time).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                        + ₹{(tx.amount / 100).toLocaleString()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
