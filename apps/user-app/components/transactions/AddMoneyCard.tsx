"use client";

import { Button } from "@repo/ui/button";
import { Select } from "@repo/ui/select";
import { useState } from "react";
import { TextInput } from "@repo/ui/textinput";
import { useBalance, useTransactions, useLinkedAccounts } from "@repo/store";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Banknote, Loader2, AlertCircle } from "lucide-react";
import { TransactionPinDialog } from "../dialog/TransactionPinDialog";
import { createOnRampTxn } from "../../app/lib/actions/createOnRampTxn";

export const AddMoney = () => {
    const router = useRouter();

    const { linkedAccounts, isLoading: linkedLoading, error: linkedError, refresh: refreshLinked } = useLinkedAccounts();

    const [selectedLinkedId, setSelectedLinkedId] = useState<number | null>(null);
    const [amount, setAmount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const [pinOpen, setPinOpen] = useState(false);
    const [pendingOnramp, setPendingOnramp] = useState<{
        amountPaise: number;
        provider: string;
        linkedBankAccountId: number;
        idempotencyKey: string;
    } | null>(null);

    const { refresh: refreshBalance } = useBalance();
    const { refresh: refreshTransactions, addOptimistic } = useTransactions();

    const handleAddMoney = async () => {
        setError(null);

        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Please enter a valid amount greater than 0.");
            return;
        }

        const amountPaise = Math.round(amount * 100);
        if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
            setError("Please enter a valid amount.");
            return;
        }

        const idempotencyKey = uuidv4();

        const effectiveSelected = (selectedLinkedId
            ? linkedAccounts.find((a) => a.id === selectedLinkedId) ?? null
            : linkedAccounts.length > 0
                ? linkedAccounts[0]!
                : null);

        if (!effectiveSelected) {
            setError("No linked bank accounts found. Please sign out and sign in again.");
            return;
        }

        setPendingOnramp({
            amountPaise,
            provider: effectiveSelected.displayName,
            linkedBankAccountId: effectiveSelected.id,
            idempotencyKey,
        });
        setPinOpen(true);
    };

    return (
        <>
            <section className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-[#06020f] border border-slate-200 dark:border-white/5 shadow-2xl p-8 md:p-10 isolate transition-colors duration-300">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-5 mb-10">
                        <div className="w-14 h-14 rounded-[1.2rem] bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner border border-indigo-100 dark:border-indigo-500/20 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 dark:from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <Banknote className="w-7 h-7 drop-shadow-sm" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
                                Deposit via Bank
                            </h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-white/60 mt-1">
                                Instant transfer using NetBanking
                            </p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {error && (
                            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                                <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
                                    {error}
                                </span>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700 dark:text-white/80 ml-1 drop-shadow-sm">
                                Amount to Add
                            </label>
                            <TextInput
                                placeholder="e.g. 5000"
                                label=""
                                onChange={(value) => {
                                    setAmount(Number(value));
                                    if (error) setError(null);
                                }}
                                customClass="w-full"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700 dark:text-white/80 ml-1 drop-shadow-sm">
                                Select Bank
                            </label>
                            <Select
                                onSelect={(value) => {
                                    setSelectedLinkedId(Number(value));
                                    if (error) setError(null);
                                }}
                                options={linkedAccounts.map((a) => ({
                                    key: String(a.id),
                                    value: `${a.displayName} (${a.maskedAccount})`,
                                }))}
                            />

                            {linkedLoading ? (
                                <div className="text-xs text-slate-400">Loading linked accounts…</div>
                            ) : linkedError ? (
                                <div className="text-xs text-rose-500">
                                    Failed to load linked accounts: {linkedError}{" "}
                                    <button className="underline" onClick={() => refreshLinked()}>
                                        Retry
                                    </button>
                                </div>
                            ) : null}

                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={handleAddMoney}
                                disabled={isProcessing}
                                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/10 dark:shadow-indigo-500/5
                  ${isProcessing
                                        ? "bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-white/40 cursor-wait shadow-none scale-95 opacity-70"
                                        : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                                    </>
                                ) : (
                                    <>
                                        Proceed to Pay <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center justify-center gap-2 mt-6 text-xs font-bold tracking-widest uppercase text-slate-400 dark:text-white/40">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>256-bit Secure SSL Connection</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <TransactionPinDialog
                open={pinOpen}
                title="Enter Transaction PIN"
                subtitle="Required to create this deposit request."
                onClose={() => {
                    if (!isProcessing) {
                        setPinOpen(false);
                        setPendingOnramp(null);
                    }
                }}
                onVerify={async (pin) => {
                    if (!pendingOnramp) return;

                    setIsProcessing(true);
                    setError(null);

                    try {
                        const result = await createOnRampTxn(
                            pendingOnramp.amountPaise,
                            pendingOnramp.provider,
                            pendingOnramp.idempotencyKey,
                            pendingOnramp.linkedBankAccountId,
                            pin,
                        );

                        if (!result.success) {
                            if (result.errorCode === "PIN_NOT_SET") {
                                setPinOpen(false);
                                setPendingOnramp(null);
                                router.push("/settings/security");
                                throw new Error(
                                    "Please set your Transaction PIN in Security Center first."
                                );
                            }

                            if (result.errorCode === "UNAUTHENTICATED") {
                                setPinOpen(false);
                                setPendingOnramp(null);
                                router.push("/signin");
                                return;
                            }

                            if (result.errorCode === "PIN_LOCKED") {
                                const retry = result.retryAfterSec
                                    ? ` Try again in ~${result.retryAfterSec}s.`
                                    : "";
                                throw new Error(`PIN locked due to repeated failures.${retry}`);
                            }

                            if (result.errorCode === "RATE_LIMITED") {
                                const retry = result.retryAfterSec
                                    ? ` Retry after ~${result.retryAfterSec}s.`
                                    : "";
                                throw new Error(`Too many attempts.${retry}`);
                            }

                            if (result.errorCode === "PIN_REQUIRED")
                                throw new Error("Transaction PIN is required.");
                            if (result.errorCode === "PIN_INVALID")
                                throw new Error("Invalid transaction PIN.");

                            throw new Error(result.message || "Transaction failed");
                        }

                        addOptimistic({
                            id: Date.now(),
                            time: new Date(),
                            amount: pendingOnramp.amountPaise,
                            status: "Processing",
                            provider: pendingOnramp.provider,
                        });

                        await refreshTransactions();

                        const qs = new URLSearchParams({
                            token: result.token,
                            amount: String(result.amount),
                            userId: String(result.userId),
                            provider: result.provider,
                        });

                        setPinOpen(false);
                        setPendingOnramp(null);
                        router.push(`/mock-bank?${qs.toString()}`);
                    } catch (err: any) {
                        setPinOpen(false);
                        setError(err.message || "Something went wrong.");
                    } finally {
                        setIsProcessing(false);
                        await refreshBalance().catch(() => { });
                    }
                }}
            />
        </>
    );
};
