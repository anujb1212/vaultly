"use client";

import { useTransactions } from "@repo/store";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { Header } from "../../../components/dashboard/Header";
import { BalanceCard } from "../../../components/dashboard/BalanceCard";
import { ActionTiles } from "../../../components/dashboard/ActionTiles";
import { OnRampTransactions } from "../../../components/transactions/OnRampTransactions";
import { SecurityInsights } from "../../../components/dashboard/SecurityInsights";
import { MonthlyAnalysis } from "../../../components/dashboard/MonthlyAnalysis";


export default function Dashboard() {
    const { onRampTransactions, p2pTransactions } = useTransactions();
    const router = useRouter();

    const recentActivity = useMemo(() => {
        const p2pFormatted = p2pTransactions.map(t => ({
            id: t.id,
            time: new Date(t.time),
            amount: t.amount,
            status: "Success" as const,
            provider: t.type === 'sent' ? `Sent to ${t.toUserName || t.toUser}` : `Received from ${t.toUser || t.toUser}`,
            failureReasonCode: null
        }));

        const onRampFormatted = onRampTransactions.map(t => ({
            id: t.id,
            time: new Date(t.time),
            amount: t.amount,
            status: t.status,
            provider: `Added from ${t.provider}`,
            failureReasonCode: t.failureReasonCode
        }));

        return [...onRampFormatted, ...p2pFormatted]
            .sort((a, b) => b.time.getTime() - a.time.getTime())
            .slice(0, 5);
    }, [onRampTransactions, p2pTransactions]);

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
        <div className="w-full pb-20 animate-fade-in max-w-7xl mx-auto">
            <Header />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-12 lg:col-span-4 h-full">
                    <BalanceCard />
                </div>
                <div className="md:col-span-12 lg:col-span-8 h-full flex flex-col justify-end">
                    <div className="mb-2">
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-neutral-400 mb-3 ml-1 uppercase tracking-wider">
                            Quick Actions
                        </h3>
                        <ActionTiles />
                    </div>
                </div>

                <div className="md:col-span-12 lg:col-span-8 space-y-6">
                    <section>
                        <OnRampTransactions transactions={recentActivity} />
                    </section>
                </div>

                <div className="md:col-span-12 lg:col-span-4 space-y-6">
                    <div className="h-[300px]">
                        <SecurityInsights />
                    </div>

                    <MonthlyAnalysis inflow={stats.inflow} outflow={stats.outflow} />

                    <div
                        onClick={() => router.push("/settings/security")}
                        className="group relative overflow-hidden rounded-[2rem] bg-slate-900 dark:bg-black p-8 text-white cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-500/20 active:scale-[0.99]"
                    >
                        <div className="absolute top-[-20%] right-[-20%] opacity-10 group-hover:opacity-20 transition-opacity duration-500 group-hover:rotate-12 transform">
                            <ShieldCheck className="w-40 h-40" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-2">Vaultly Secure™</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Tap to view active sessions.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
