"use client";

import { Plus, Send, Landmark } from "lucide-react";
import { useRouter } from "next/navigation";

interface ActionTileProps {
    icon: React.ReactNode;
    title: string;
    subTitle: string;
    onClick: () => void;
    accent?: "purple" | "blue" | "rose" | "default";
    delay?: string;
}

const ActionTile = ({ icon, title, subTitle, onClick, accent = "default", delay = "0ms" }: ActionTileProps) => {
    const accentColors = {
        default: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800",
        purple: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10",
        blue: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10",
        rose: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
    };

    return (
        <button
            onClick={onClick}
            style={{ animationDelay: delay }}
            className="group relative flex flex-col justify-between p-5 h-[140px] w-full text-left 
      bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border border-white/20 dark:border-white/5 
      rounded-3xl overflow-hidden transition-all duration-300 
      hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 active:scale-[0.98] animate-fade-in-up"
        >
            <div className={`p-3 w-fit rounded-2xl transition-colors duration-300 ${accentColors[accent]}`}>
                {icon}
            </div>

            <div className="z-10 mt-auto">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                    {title}
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-neutral-500 group-hover:text-slate-600 dark:group-hover:text-neutral-400 transition-colors">
                    {subTitle}
                </p>
            </div>
        </button>
    );
};

export const ActionTiles = () => {
    const router = useRouter();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <ActionTile
                icon={<Plus size={24} />}
                title="Add Money"
                subTitle="Via Bank"
                accent="purple"
                onClick={() => router.push("/transfer")}
                delay="100ms"
            />

            <ActionTile
                icon={<Send size={24} />}
                title="Send Money"
                subTitle="To Vaultly User"
                accent="blue"
                onClick={() => router.push("/p2ptransfer")}
                delay="200ms"
            />

            <ActionTile
                icon={<Landmark size={24} />}
                title="Withdraw"
                subTitle="To Bank Account"
                accent="rose"
                onClick={() => router.push("/withdraw")}
                delay="300ms"
            />
        </div>
    );
};
