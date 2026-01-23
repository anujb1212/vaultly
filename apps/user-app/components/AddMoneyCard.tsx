"use client";

import { Button } from "@repo/ui/button";
import { Select } from "@repo/ui/select";
import { useState } from "react";
import { TextInput } from "@repo/ui/textinput";
import { createOnRampTxn } from "../app/lib/actions/createOnRampTxn";
import { useBalance, useTransactions } from "@repo/store";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Banknote } from "lucide-react";
import { TransactionPinDialog } from "./TransactionPinDialog";

const SUPPORTED_BANKS = [
    { name: "HDFC Bank" },
    { name: "Axis Bank" },
    { name: "ICICI Bank" },
    { name: "SBI" },
    { name: "Kotak Mahindra Bank" },
];

export const AddMoney = () => {
    const router = useRouter();
    const [provider, setProvider] = useState(SUPPORTED_BANKS[0]?.name || "");
    const [amount, setAmount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const [pinOpen, setPinOpen] = useState(false);
    const [pendingOnramp, setPendingOnramp] = useState<{
        amountPaise: number;
        provider: string;
        idempotencyKey: string;
    } | null>(null);

    const { refresh: refreshBalance } = useBalance();
    const { refresh: refreshTransactions, addOptimistic } = useTransactions();

    const handleAddMoney = async () => {
        if (!Number.isFinite(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        const amountPaise = Math.round(amount * 100);
        if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        const idempotencyKey = uuidv4();

        setPendingOnramp({ amountPaise, provider, idempotencyKey });
        setPinOpen(true);
    };

    return (
        <>
            <div className="bg-white dark:bg-neutral-900 p-8 md:p-10 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-5 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                        <Banknote className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Deposit via Bank</h2>
                        <p className="text-sm text-slate-500 dark:text-neutral-400">
                            Instant transfer using NetBanking
                        </p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-3 ml-1">
                            Amount to Add
                        </label>
                        <TextInput
                            placeholder="e.g. 5000"
                            label=""
                            onChange={(value) => setAmount(Number(value))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-3 ml-1">
                            Select Bank
                        </label>
                        <Select
                            onSelect={(value) =>
                                setProvider(SUPPORTED_BANKS.find((x) => x.name === value)?.name || "")
                            }
                            options={SUPPORTED_BANKS.map((x) => ({ key: x.name, value: x.name }))}
                        />
                    </div>

                    <div className="pt-6">
                        <Button
                            onClick={handleAddMoney}
                            disabled={isProcessing}
                            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-xl
                ${isProcessing
                                    ? "bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed shadow-none"
                                    : "bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98] shadow-slate-200 dark:shadow-none"
                                }`}
                        >
                            {isProcessing ? (
                                "Processing..."
                            ) : (
                                <>
                                    Proceed to Pay <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </Button>

                        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400 dark:text-neutral-500">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>256-bit Secure SSL Connection</span>
                        </div>
                    </div>
                </div>
            </div>

            <TransactionPinDialog
                open={pinOpen}
                title="Enter Transaction PIN"
                subtitle="Required to create this deposit request."
                confirmText="Proceed"
                onClose={() => {
                    if (!isProcessing) {
                        setPinOpen(false);
                        setPendingOnramp(null);
                    }
                }}
                onConfirm={async (pin) => {
                    if (!pendingOnramp) return;

                    setIsProcessing(true);
                    try {
                        const result = await createOnRampTxn(
                            pendingOnramp.amountPaise,
                            pendingOnramp.provider,
                            pendingOnramp.idempotencyKey,
                            pin
                        );

                        if (!result.success) {
                            if (result.errorCode === "PIN_NOT_SET") {
                                router.push("/settings/security");
                                throw new Error("Please set your Transaction PIN in Security Center first.");
                            }

                            if (result.errorCode === "UNAUTHENTICATED") {
                                router.push("/signin");
                                return;
                            }

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
                    } finally {
                        setIsProcessing(false);
                        await refreshBalance().catch(() => { });
                    }
                }}
            />
        </>
    );
};
