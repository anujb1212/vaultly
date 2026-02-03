"use client";

import { Eye, EyeOff } from "lucide-react";
import { BankCard } from "./BankCard";
import { LinkedAccount } from "@repo/store";

export const PROVIDER_KEYS = ["HDFC", "AXIS", "ICICI", "SBI", "KOTAK"] as const;
export type ProviderKey = (typeof PROVIDER_KEYS)[number];

export type ProviderStyle = { colorFrom: string; colorTo: string };

export function isProviderKey(x: string): x is ProviderKey {
    return (PROVIDER_KEYS as readonly string[]).includes(x);
}

export const PROVIDER_STYLE: Record<ProviderKey, ProviderStyle> = {
    HDFC: { colorFrom: "from-indigo-800", colorTo: "to-purple-700" },
    AXIS: { colorFrom: "from-purple-800", colorTo: "to-fuchsia-700" },
    ICICI: { colorFrom: "from-amber-700", colorTo: "to-orange-600" },
    SBI: { colorFrom: "from-cyan-800", colorTo: "to-blue-700" },
    KOTAK: { colorFrom: "from-rose-800", colorTo: "to-red-700" },
};

export function getProviderStyle(providerKeyRaw: string): ProviderStyle {
    const key = isProviderKey(providerKeyRaw) ? providerKeyRaw : "HDFC";
    return PROVIDER_STYLE[key];
}

export function LinkedAccountsGrid(props: {
    linkedAccounts: LinkedAccount[];
    isLoading: boolean;
    error: string | null;

    selectedId: number | null;
    onSelect: (id: number) => void;

    showBalances: boolean;
    onToggleShowBalances: () => void;

    onRetry: () => void;
}) {
    const {
        linkedAccounts,
        isLoading,
        error,
        selectedId,
        onSelect,
        showBalances,
        onToggleShowBalances,
        onRetry,
    } = props;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Linked Accounts</h2>
                <button
                    onClick={onToggleShowBalances}
                    className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                    {showBalances ? (
                        <>
                            <EyeOff size={16} /> Hide Balances
                        </>
                    ) : (
                        <>
                            <Eye size={16} /> Show Balances
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                    <>
                        <div className="h-[200px] rounded-[1.5rem] bg-slate-100 dark:bg-neutral-900 animate-pulse" />
                        <div className="h-[200px] rounded-[1.5rem] bg-slate-100 dark:bg-neutral-900 animate-pulse" />
                        <div className="h-[200px] rounded-[1.5rem] bg-slate-100 dark:bg-neutral-900 animate-pulse" />
                        <div className="h-[200px] rounded-[1.5rem] bg-slate-100 dark:bg-neutral-900 animate-pulse" />
                    </>
                ) : error ? (
                    <div className="md:col-span-2 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300">
                        <div className="font-semibold">Couldn't load linked accounts</div>
                        <div className="text-sm mt-1 opacity-90">{error}</div>
                        <div className="mt-3">
                            <button
                                onClick={onRetry}
                                className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:underline"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : linkedAccounts.length === 0 ? (
                    <div className="md:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 backdrop-blur">
                        <div className="text-slate-900 dark:text-white font-semibold">No linked accounts</div>
                        <div className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                            Your account list looks empty. Try signing out and back in, or contact support.
                        </div>
                    </div>
                ) : (
                    linkedAccounts.map((a) => {
                        const style = getProviderStyle(String(a.providerKey));
                        return (
                            <BankCard
                                key={a.id}
                                bankName={a.displayName}
                                accountNumber={a.maskedAccount}
                                balance={a.amount}
                                colorFrom={style.colorFrom}
                                colorTo={style.colorTo}
                                isSelected={selectedId === a.id}
                                onSelect={() => onSelect(a.id)}
                                showBalance={showBalances}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
