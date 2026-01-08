"use client";

import { AddMoney } from "../../../components/AddMoneyCard";
import { BalanceCard } from "../../../components/BalanceCard";
import { OnRampTransactions } from "../../../components/OnRampTransactions";

export default function TransferPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Transfer & Add Funds</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your wallet balance and transactions securely.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Input Action */}
                <div className="lg:col-span-5 space-y-6">
                    <AddMoney />
                </div>

                {/* Right Column: Information & History */}
                <div className="lg:col-span-7 space-y-6">
                    <BalanceCard />
                    <div className="min-h-[400px]">
                        <OnRampTransactions />
                    </div>
                </div>
            </div>
        </div>
    );
}
