"use client";

import { useBalance, useTransactions } from "@repo/store";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Plus, Send, TrendingUp, TrendingDown, ShieldCheck } from "lucide-react";

import { BalanceCard } from "../../../components/BalanceCard";
import { OnRampTransactions } from "../../../components/OnRampTransactions";
import { AISecurityInsightsCard } from "../../../components/AISecurityInsightsCard";
import { DashboardHeader } from "../../../components/DashboardHeader";
import { DashboardAction } from "../../../components/DashboardAction";

export default function Dashboard() {
    const { onRampTransactions, p2pTransactions } = useTransactions();
    const router = useRouter();

    const stats = useMemo(() => {
        const onRampInflow = onRampTransactions
            .filter((t) => t.status === "Success")
            .reduce((acc, t) => acc + t.amount, 0);

        const p2pInflow = p2pTransactions
            .filter((t) => t.type === "received")
            .reduce((acc, t) => acc + t.amount, 0);

        const p2pOutflow = p2pTransactions
            .filter((t) => t.type === "sent")
            .reduce((acc, t) => acc + t.amount, 0);

        const totalInflow = onRampInflow + p2pInflow;

        return {
            inflow: totalInflow,
            outflow: p2pOutflow,
        };
    }, [onRampTransactions, p2pTransactions]);

    return (
        <div className="w-full pb-20 animate-fade-in">
            <DashboardHeader />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 mt-6">
                {/* Financials */}
                <div className="xl:col-span-2 space-y-6 lg:space-y-8">
                    <section className="space-y-6">
                        <BalanceCard />

                        <div className="grid grid-cols-2 gap-4">
                            <DashboardAction
                                icon={Plus}
                                label="Add Money"
                                subLabel="via Bank"
                                onClick={() => router.push("/transfer")}
                                variant="secondary"
                            />
                            <DashboardAction
                                icon={Send}
                                label="Send Money"
                                subLabel="P2P Transfer"
                                onClick={() => router.push("/p2p")}
                                variant="primary"
                            />
                        </div>
                    </section>

                    <section>
                        <OnRampTransactions />
                    </section>
                </div>

                {/* Insights & Analysis */}
                <div className="space-y-6 lg:space-y-8">
                    <AISecurityInsightsCard limit={4} />
                    {/* Monthly Analysis Card */}
                    <div className="rounded-[2rem] border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 backdrop-blur-sm p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-slate-900 dark:text-white">
                                Monthly Analysis
                            </h3>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
                                Realtime
                            </span>
                        </div>

                        <div className="space-y-8">
                            <StatRow
                                label="Total Inflow"
                                amount={stats.inflow}
                                type="inflow"
                                icon={TrendingUp}
                            />
                            <StatRow
                                label="Total Outflow"
                                amount={stats.outflow}
                                type="outflow"
                                icon={TrendingDown}
                            />
                        </div>
                    </div>

                    {/* Security Banner */}
                    <div
                        onClick={() => router.push("/settings/security")}
                        className="group relative overflow-hidden rounded-[2rem] bg-slate-900 dark:bg-black p-8 text-white cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-500/20"
                    >
                        <div className="absolute top-[-20%] right-[-20%] opacity-10 group-hover:opacity-20 transition-opacity duration-500 group-hover:rotate-12 transform">
                            <ShieldCheck className="w-40 h-40" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Vaultly Secure™</h3>
                            <p className="text-sm text-slate-400 leading-relaxed mb-0 max-w-[220px]">
                                Your sessions are encrypted. Tap to view your active devices.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const StatRow = ({
    label,
    amount,
    type,
    icon: Icon,
}: {
    label: string;
    amount: number;
    type: "inflow" | "outflow";
    icon: any;
}) => {
    const isPositive = type === "inflow";
    const colorClass = isPositive
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400";
    const bgClass = isPositive
        ? "bg-emerald-100/50 dark:bg-emerald-900/20"
        : "bg-rose-100/50 dark:bg-rose-900/20";
    const barColor = isPositive ? "bg-emerald-500" : "bg-rose-500";

    return (
        <div>
            <div className="flex justify-between items-end mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${bgClass}`}>
                        <Icon className={`w-4 h-4 ${colorClass}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-neutral-400">
                        {label}
                    </span>
                </div>
                <span className={`text-lg font-bold tracking-tight ${colorClass}`}>
                    {isPositive ? "+" : "-"}₹{(amount / 100).toLocaleString("en-IN")}
                </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: amount > 0 ? "100%" : "5%", opacity: 0.8 }}
                />
            </div>
        </div>
    );
};
