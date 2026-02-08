"use client";

import { AlertCircle, ArrowRight, CheckCircle2, Landmark, Loader2, XCircle } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { TextInput } from "@repo/ui/textinput";

function formatPaise(paise: number) {
    const safe = Number.isFinite(paise) ? Math.trunc(paise) : 0;
    const abs = Math.abs(safe);
    const rs = Math.trunc(abs / 100);
    const ps = abs % 100;
    return { rs: rs.toLocaleString("en-IN"), ps: String(ps).padStart(2, "0") };
}

export function WithdrawActionPanel(props: {
    selected: { displayName: string; maskedAccount: string; amount: number } | null;
    walletAvailablePaise: number;

    amount: string;
    onAmountChange: (v: string) => void;

    isProcessing: boolean;
    panelError: string | null;
    panelOk: string | null;

    onConfirm: () => void;
}) {
    const { selected, walletAvailablePaise, amount, onAmountChange, isProcessing, panelError, panelOk, onConfirm } = props;

    const walletFmt = formatPaise(walletAvailablePaise);
    const selFmt = selected ? formatPaise(selected.amount) : null;

    return (
        <div className="sticky top-6">
            <Card title="Withdraw Funds" className="relative overflow-hidden min-h-[420px]">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-6 mt-2">
                    {!selected ? (
                        <div className="h-[280px] flex flex-col items-center justify-center text-center text-slate-400">
                            <Landmark className="w-12 h-12 mb-3 opacity-50" />
                            <p>
                                Select a bank account
                                <br />
                                to proceed with withdrawal.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-800/50 border border-slate-100 dark:border-neutral-800">
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Withdraw to</p>
                                <p className="font-bold text-slate-900 dark:text-white text-lg">{selected.displayName}</p>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.maskedAccount}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800">
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-neutral-500 font-bold">
                                        Wallet available
                                    </div>
                                    <div className="mt-1 text-slate-900 dark:text-white font-extrabold tracking-tight">
                                        ₹{walletFmt.rs}
                                        <span className="text-xs opacity-60">.{walletFmt.ps}</span>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800">
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-neutral-500 font-bold">
                                        Selected balance
                                    </div>
                                    <div className="mt-1 text-slate-900 dark:text-white font-extrabold tracking-tight">
                                        ₹{selFmt?.rs}
                                        <span className="text-xs opacity-60">.{selFmt?.ps}</span>
                                    </div>
                                </div>
                            </div>

                            <TextInput
                                label="Amount to withdraw"
                                placeholder="Min ₹100"
                                value={amount}
                                onChange={onAmountChange}
                                type="number"
                            />

                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg flex gap-3 items-start">
                                <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
                                    Transfers complete instantly in v1 (sync). Available wallet balance is checked as amount − locked.
                                </p>
                            </div>

                            {panelError ? (
                                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    <span>{panelError}</span>
                                </div>
                            ) : null}

                            {panelOk ? (
                                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{panelOk}</span>
                                </div>
                            ) : null}

                            <Button onClick={onConfirm} disabled={isProcessing} className="w-full py-4 text-base shadow-lg shadow-emerald-500/20">
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                                    </>
                                ) : (
                                    <>
                                        Confirm withdrawal <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
