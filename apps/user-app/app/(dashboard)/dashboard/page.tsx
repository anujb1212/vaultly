"use client";

import { useTransactions } from "@repo/store";
import { useMemo } from "react";
import { Header } from "../../../components/dashboard/Header";
import { BalanceCard } from "../../../components/dashboard/BalanceCard";
import { ActionTiles } from "../../../components/dashboard/ActionTiles";
import { OnRampTransactions } from "../../../components/transactions/OnRampTransactions";
import { SecurityInsights } from "../../../components/dashboard/SecurityInsights";
import { MonthlyAnalysis } from "../../../components/dashboard/MonthlyAnalysis";

type ActivityKind = "onramp" | "offramp" | "p2p";
type ActivityDirection = "in" | "out";

export default function Dashboard() {
    const { onRampTransactions, p2pTransactions, offRampTransactions } = useTransactions();

    const recentActivity = useMemo(() => {
        const p2pFormatted = p2pTransactions.map((t) => ({
            id: t.id,
            time: new Date(t.time),
            amount: t.amount,
            status: "Success" as const,
            kind: "p2p" as const,
            direction: (t.type === "sent" ? "out" : "in") as ActivityDirection,
            provider:
                t.type === "sent"
                    ? `Sent to ${t.toUserName || t.toUser}`
                    : `Received from ${t.toUserName || t.toUser}`,
            failureReasonCode: null as string | null,
        }));

        const onRampFormatted = onRampTransactions.map((t) => ({
            id: t.id,
            time: new Date(t.time),
            amount: t.amount,
            status: t.status,
            kind: "onramp" as const,
            direction: "in" as const,
            provider: `Added from ${t.provider}`,
            failureReasonCode: t.failureReasonCode ?? null,
        }));

        const offRampFormatted = offRampTransactions.map((t) => ({
            id: t.id,
            time: new Date(t.time),
            amount: t.amount,
            status: t.status,
            kind: "offramp" as const,
            direction: "out" as const,
            provider: `Withdraw to ${t.displayName ?? "Bank account"}${t.maskedAccount ? ` ${t.maskedAccount}` : ""}`,
            failureReasonCode: null as string | null,
        }));

        return [...onRampFormatted, ...offRampFormatted, ...p2pFormatted]
            .sort((a, b) => b.time.getTime() - a.time.getTime())
            .slice(0, 5);
    }, [onRampTransactions, offRampTransactions, p2pTransactions]);

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

        return { inflow: totalInflow, outflow: p2pOutflow };
    }, [onRampTransactions, p2pTransactions]);

    return (
        <div className="w-full pb-20 animate-fade-in max-w-7xl mx-auto">
            <Header />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                    <BalanceCard />
                </div>

                <div className="lg:col-span-8">
                    <h3 className="text-sm font-semibold text-mutedForeground mb-3 ml-1 uppercase tracking-wider">
                        Quick Actions
                    </h3>
                    <ActionTiles />
                </div>

                <div className="lg:col-span-8">
                    <OnRampTransactions transactions={recentActivity} />
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="h-[300px]">
                        <SecurityInsights />
                    </div>
                    <MonthlyAnalysis inflow={stats.inflow} outflow={stats.outflow} />
                </div>
            </div>
        </div>
    );
}
