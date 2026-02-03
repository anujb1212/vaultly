"use client";

import { AddMoney } from "../../../components/AddMoneyCard";
import { BalanceCard } from "../../../components/BalanceCard";
import { OnRampTransactions } from "../../../components/transactions/OnRampTransactions";

export default function TransferPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Add Funds</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Securely deposit money into your Vaultly wallet.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Left Column: Input Action */}
                <div className="xl:col-span-7 space-y-8">
                    <AddMoney />
                </div>

                {/* Right Column: Information & History */}
                <div className="xl:col-span-5 space-y-8 sticky top-8">
                    <BalanceCard />
                    <div className="min-h-[400px]">
                        <OnRampTransactions />
                    </div>
                </div>
            </div>
        </div>
    );
}
