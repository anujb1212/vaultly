"use client";

import { useBalance, useTransactions } from "@repo/store";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
    ArrowRight,
    History,
    ShieldCheck,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Plus,
    Send,
    Lock,
    Search
} from "lucide-react";

export default function Dashboard() {
    const { balance, isLoading: balanceLoading, refresh: refreshBalance } = useBalance();
    const { onRampTransactions, p2pTransactions, isLoading: txnsLoading, refresh: refreshTransactions } = useTransactions();
    const router = useRouter();
    const searchParams = useSearchParams();

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

    // MERGE TRANSACTIONS LOGIC
    const recentTransactions = useMemo(() => {
        const onRamps = onRampTransactions.map(t => ({
            ...t,
            type: 'OnRamp',
            uniqueId: `onramp-${t.id}`,
            title: `Added from ${t.provider}`,
            isDebit: false
        }));

        const p2p = p2pTransactions.map(t => ({
            ...t,
            type: 'P2P',
            uniqueId: `p2p-${t.id}`,
            title: `Sent to User ${t.toUser}`,
            provider: 'P2P Transfer',
            status: 'Success',
            isDebit: true
        }));

        return [...onRamps, ...p2p]
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 5);
    }, [onRampTransactions, p2pTransactions]);

    // CALCULATE INFLOW / OUTFLOW
    const stats = useMemo(() => {
        const inflow = onRampTransactions
            .filter(t => t.status === 'Success')
            .reduce((acc, t) => acc + t.amount, 0);

        const outflow = p2pTransactions
            .reduce((acc, t) => acc + t.amount, 0);

        return { inflow, outflow };
    }, [onRampTransactions, p2pTransactions]);

    const Greeting = () => {
        const hour = new Date().getHours();
        return <>{hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}</>;
    };

    return (
        <div className="w-full min-h-screen relative bg-neutral-50 dark:bg-black selection:bg-indigo-100 dark:selection:bg-indigo-900">

            {/* --- BACKGROUND EFFECT (Synced with Landing Page) --- */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:6rem_4rem]">
                <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)] dark:bg-[radial-gradient(circle_800px_at_100%_200px,#312e81,transparent)] opacity-20 dark:opacity-40"></div>
            </div>

            {/* --- STICKY HEADER --- */}
            <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-white/70 dark:bg-black/70 border-b border-slate-200/50 dark:border-neutral-800/50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
                        <p className="text-slate-500 dark:text-neutral-400 text-sm font-medium">
                            <Greeting />, here's your financial overview.
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <div className="flex items-center gap-3">
                            <div className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase
                                bg-white/50 dark:bg-neutral-900/50 text-slate-500 dark:text-neutral-500 border border-slate-200/50 dark:border-neutral-800/50 backdrop-blur-md">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Balance & Transactions */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* --- TOTAL BALANCE CARD --- */}
                        <div className="relative overflow-hidden bg-slate-900 dark:bg-neutral-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-indigo-500/10 dark:shadow-black/50 group border border-slate-200/10 dark:border-neutral-800">
                            {/* Card Gloss Effect */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-900/0 to-transparent blur-3xl opacity-50 pointer-events-none group-hover:opacity-70 transition-opacity duration-1000" />

                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3 opacity-90">Total Balance</h2>
                                        {balanceLoading ? (
                                            <div className="h-20 w-64 bg-slate-800/50 rounded-2xl animate-pulse" />
                                        ) : (
                                            <div className="flex items-baseline tracking-tighter text-white">
                                                <span className="text-6xl md:text-7xl font-bold tracking-tight">
                                                    ₹{(balance.amount / 100).toLocaleString('en-IN')}
                                                </span>
                                                <span className="text-3xl text-slate-400 font-light ml-1 opacity-80">.00</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-slate-400 bg-white/5 w-fit px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                                        <Lock className="w-3.5 h-3.5" />
                                        <span>Locked: <span className="text-white font-medium">₹{(balance.locked / 100).toLocaleString('en-IN')}</span></span>
                                    </div>
                                </div>

                                <div className="flex gap-4 w-full md:w-auto">
                                    <button
                                        onClick={() => router.push("/transfer")}
                                        className="flex-1 md:flex-none h-14 px-8 rounded-2xl bg-white text-slate-900 font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                                    >
                                        <Plus className="w-5 h-5" /> Add Money
                                    </button>
                                    <button
                                        onClick={() => router.push("/p2ptransfer")}
                                        className="flex-1 md:flex-none h-14 px-8 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
                                    >
                                        <Send className="w-4 h-4" /> Send
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* --- RECENT ACTIVITY --- */}
                        <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 dark:border-neutral-800/60 overflow-hidden shadow-sm">
                            <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-100 dark:border-neutral-800">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Recent Activity</h3>
                                <button
                                    onClick={() => router.push("/transactions")}
                                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition flex items-center gap-1 group px-3 py-1 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                >
                                    View all <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>

                            {txnsLoading ? (
                                <div className="p-12 text-center text-slate-400">Loading activity...</div>
                            ) : recentTransactions.length === 0 ? (
                                <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-neutral-800 flex items-center justify-center">
                                        <History className="w-6 h-6 text-slate-300 dark:text-neutral-600" />
                                    </div>
                                    <p className="font-medium">No recent transactions</p>
                                </div>
                            ) : (
                                <div className="p-4 space-y-1">
                                    {recentTransactions.map((tx: any) => (
                                        <div key={tx.uniqueId} className="p-4 rounded-2xl hover:bg-white dark:hover:bg-neutral-800/80 transition-all flex items-center justify-between group border border-transparent hover:border-slate-100 dark:hover:border-neutral-800 hover:shadow-sm">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm transition-transform group-hover:scale-105
                                                    ${tx.status === 'Failure' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                                                        tx.isDebit ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' :
                                                            'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                                                    {tx.status === 'Failure' ? <AlertCircle className="w-5 h-5" /> : (tx.provider?.[0] || "T")}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900 dark:text-white text-base">{tx.title}</div>
                                                    <div className="text-xs font-medium text-slate-500 dark:text-neutral-500 mt-1">
                                                        {new Date(tx.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`font-bold tabular-nums text-base tracking-tight ${tx.status === 'Failure' ? 'text-rose-500 dark:text-rose-400 line-through opacity-60' :
                                                tx.isDebit ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'
                                                }`}>
                                                {tx.status !== 'Failure' && (tx.isDebit ? '-' : '+')} ₹{(tx.amount / 100).toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Widgets */}
                    <div className="space-y-8">

                        {/* --- SECURITY WIDGET --- */}
                        <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-10 transition-opacity duration-500">
                                <ShieldCheck className="w-40 h-40 rotate-12" />
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
                                    <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Safe & Encrypted</h3>
                                <p className="text-sm text-slate-500 dark:text-neutral-400 leading-relaxed mb-6">
                                    Your data is secured with banking-grade encryption.
                                </p>
                                <button className="w-full py-4 px-4 bg-slate-50 dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white transition-colors border border-slate-100 dark:border-neutral-700">
                                    Security Settings
                                </button>
                            </div>
                        </div>

                        {/* --- QUICK ANALYSIS WIDGET --- */}
                        <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-neutral-800 shadow-sm">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Quick Analysis</h3>
                            <div className="space-y-6">
                                {/* Inflow */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-500 dark:text-neutral-400 flex items-center gap-2 font-medium">
                                            <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            Inflow
                                        </span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                                            + ₹{(stats.inflow / 100).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full w-[70%] shadow-lg shadow-emerald-500/30" />
                                    </div>
                                </div>

                                {/* Outflow */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-500 dark:text-neutral-400 flex items-center gap-2 font-medium">
                                            <div className="p-1 bg-slate-100 dark:bg-neutral-800 rounded-md">
                                                <TrendingDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            Outflow
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white tracking-tight">
                                            - ₹{(stats.outflow / 100).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-slate-900 dark:bg-white rounded-full w-[30%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
