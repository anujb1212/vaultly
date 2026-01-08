"use client";

import { useBalance, useTransactions } from "@repo/store";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
    ArrowRight,
    History,
    ShieldCheck
} from "lucide-react";

const Icons = {
    Send: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>,
    Add: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>,
};

export default function Dashboard() {
    const { balance, isLoading: balanceLoading, refresh: refreshBalance } = useBalance();
    const { onRampTransactions, isLoading: txnsLoading, refresh: refreshTransactions } = useTransactions();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Logic strictly preserved
    useEffect(() => {
        const onramp = searchParams.get("onramp");
        if (onramp !== "1") return;
        let cancelled = false;
        async function run() {
            await Promise.allSettled([refreshBalance(), refreshTransactions()]);
            const delays = [800, 1600, 3000];
            for (const d of delays) {
                if (cancelled) return;
                await new Promise((r) => setTimeout(r, d));
                await Promise.allSettled([refreshBalance(), refreshTransactions()]);
            }
            if (!cancelled) router.replace("/dashboard");
        }
        run();
        return () => { cancelled = true; };
    }, [searchParams, refreshBalance, refreshTransactions, router]);

    const recentTransactions = onRampTransactions.slice(0, 5);

    // Helpers
    const Greeting = () => {
        const hour = new Date().getHours();
        const text = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
        return text;
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
                        <Greeting />, here's your financial overview.
                    </p>
                </div>
                <div className="text-sm font-medium text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-neutral-900 px-4 py-2 rounded-full">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Balance & Actions */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Hero Balance Widget */}
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-neutral-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-950/30 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Total Balance</h2>
                                {balanceLoading ? (
                                    <div className="h-16 w-48 bg-slate-200 dark:bg-neutral-800 rounded animate-pulse" />
                                ) : (
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white tracking-tighter">
                                            ₹{(balance.amount / 100).toLocaleString('en-IN')}
                                        </span>
                                        <span className="text-2xl text-slate-400 font-light">.00</span>
                                    </div>
                                )}
                                <div className="mt-2 text-sm text-slate-500 dark:text-slate-500">
                                    Locked: ₹{(balance.locked / 100).toLocaleString('en-IN')}
                                </div>
                            </div>

                            <div className="flex gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => router.push("/transfer")}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-black px-6 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    <Icons.Add /> Add Money
                                </button>
                                <button
                                    onClick={() => router.push("/p2ptransfer")}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    <Icons.Send /> Send
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions List */}
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Transactions</h3>
                            <button
                                onClick={() => router.push("/transactions")}
                                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition flex items-center gap-1"
                            >
                                View all <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {txnsLoading ? (
                            <div className="p-8 text-center text-slate-400">Loading activity...</div>
                        ) : recentTransactions.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                                <History className="w-12 h-12 mb-3 text-slate-200 dark:text-neutral-700" />
                                <p>No transactions found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                                {recentTransactions.map((tx) => (
                                    <div key={tx.id} className="p-4 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold 
                                                ${tx.status === 'Success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    tx.status === 'Processing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                                {tx.provider?.[0] || "B"}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-white text-sm">{tx.provider}</div>
                                                <div className="text-xs text-slate-500">{new Date(tx.time).toDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                                            + ₹{(tx.amount / 100).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Widgets */}
                <div className="space-y-6">
                    {/* Security Status Widget (Replaces "Pro" Card) */}
                    <div className="bg-slate-900 dark:bg-white rounded-3xl p-6 text-white dark:text-black shadow-xl shadow-slate-200 dark:shadow-none relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-white/10 dark:bg-black/10 rounded-lg backdrop-blur-sm">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium opacity-90">Security Status</span>
                            </div>

                            <div className="mb-4">
                                <p className="text-2xl font-bold">Safe & Encrypted</p>
                                <p className="text-sm opacity-60 mt-1">2FA is recommended.</p>
                            </div>

                            <button className="w-full py-2 bg-white/10 dark:bg-black/5 hover:bg-white/20 dark:hover:bg-black/10 backdrop-blur-md border border-white/10 dark:border-black/10 rounded-xl text-sm font-semibold transition">
                                View Security Settings
                            </button>
                        </div>

                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 dark:bg-black/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    </div>

                    {/* Quick Analysis Widget */}
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-slate-200 dark:border-neutral-800">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Analysis</h3>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-neutral-800 rounded-2xl mb-2">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Inflow</span>
                            <span className="font-bold text-emerald-600">+ ₹{(onRampTransactions.reduce((acc, t) => acc + t.amount, 0) / 100).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-center mt-4">
                            <span className="text-xs text-slate-400">Based on recent activity</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
