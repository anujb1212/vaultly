"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface MonthlyAnalysisProps {
    inflow: number;
    outflow: number;
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

export const MonthlyAnalysis = ({ inflow, outflow }: MonthlyAnalysisProps) => {
    return (
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
                    amount={inflow}
                    type="inflow"
                    icon={TrendingUp}
                />
                <StatRow
                    label="Total Outflow"
                    amount={outflow}
                    type="outflow"
                    icon={TrendingDown}
                />
            </div>
        </div>
    );
};
