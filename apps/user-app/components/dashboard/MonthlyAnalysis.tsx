"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface MonthlyAnalysisProps {
    inflow: number;
    outflow: number;
}

const SimpleLineChart = ({ data, color }: { data: number[], color: string }) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 4;
    const width = 100;
    const height = 40;
    const usableHeight = height - padding * 2;
    const step = width / (data.length - 1 || 1);

    const points = data.map((val, i) => {
        const x = i * step;
        const y = padding + usableHeight - ((val - min) / range) * usableHeight;
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                style={{ filter: `drop-shadow(0px 4px 6px ${color}40)` }}
            />
        </svg>
    );
};

const StatRow = ({
    label,
    amount,
    type,
    icon: Icon,
    trendData,
}: {
    label: string;
    amount: number;
    type: "inflow" | "outflow";
    icon: any;
    trendData: number[];
}) => {
    const isPositive = type === "inflow";
    const colorClass = isPositive
        ? "text-emerald-600 dark:text-emerald-500"
        : "text-rose-600 dark:text-rose-500";
    const bgClass = isPositive
        ? "bg-emerald-100 dark:bg-emerald-500/10"
        : "bg-rose-100 dark:bg-rose-500/10";
    const lineColor = isPositive ? "#10b981" : "#f43f5e";

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${bgClass}`}>
                        <Icon className={`w-4 h-4 ${colorClass}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-white/70">
                        {label}
                    </span>
                </div>
                <span className={`text-lg font-bold tracking-tight ${colorClass}`}>
                    {isPositive ? "+" : "-"}₹{(amount / 100).toLocaleString("en-IN")}
                </span>
            </div>

            <div className="h-[40px] w-full mt-2 opacity-80 mix-blend-multiply dark:mix-blend-screen relative">
                <SimpleLineChart data={trendData} color={lineColor} />
            </div>
        </div>
    );
};

export const MonthlyAnalysis = ({ inflow, outflow }: MonthlyAnalysisProps) => {
    return (
        <div className="rounded-[1.5rem] bg-white dark:bg-[#06020f] border border-slate-200 dark:border-white/5 shadow-2xl p-6 sm:p-8 h-full flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 dark:hover:border-white/10 transition-colors">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[50px] pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="font-semibold text-slate-900 dark:text-white tracking-tight">Monthly Analysis</h3>
                <span className="text-[10px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-[0.15em] bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/10">
                    Realtime
                </span>
            </div>

            <div className="space-y-8 relative z-10">
                <StatRow
                    label="Total Inflow"
                    amount={inflow}
                    type="inflow"
                    icon={TrendingUp}
                    trendData={[10, 25, 15, 30, 20, 45, 30, 50, 40, 60, 55, 70]}
                />
                <StatRow
                    label="Total Outflow"
                    amount={outflow}
                    type="outflow"
                    icon={TrendingDown}
                    trendData={[50, 40, 45, 20, 30, 15, 25, 10, 15, 20, 10, 5]}
                />
            </div>
        </div>
    );
};
