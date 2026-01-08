"use client";

import { Button } from "@repo/ui/button";
import { Select } from "@repo/ui/select";
import { useState } from "react";
import { TextInput } from "@repo/ui/textinput";
import { createOnRampTxn } from "../app/lib/actions/createOnRampTxn";
import { useBalance, useTransactions } from "@repo/store";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

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

    const { refresh: refreshBalance } = useBalance();
    const { refresh: refreshTransactions, addOptimistic } = useTransactions();

    const handleAddMoney = async () => {
        if (!Number.isFinite(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        setIsProcessing(true);
        const idempotencyKey = uuidv4();

        try {
            // Optimistic Update
            addOptimistic({
                id: Date.now(),
                time: new Date(),
                amount: amount * 100,
                status: "Processing",
                provider,
            });

            const result = await createOnRampTxn(amount * 100, provider, idempotencyKey);

            if (!result.success) {
                alert(result.message || "Transaction failed");
                await refreshTransactions();
                return;
            }
            await refreshTransactions();
            const qs = new URLSearchParams({
                token: result.token,
                amount: String(result.amount),
                userId: String(result.userId),
                provider: result.provider,
            });
            router.push(`/mock-bank?${qs.toString()}`);
        } catch (error) {
            alert("Failed to create transaction");
            await refreshTransactions();
        } finally {
            setIsProcessing(false);
            await refreshBalance().catch(() => { });
        }
    };

    return (
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Add Money</h2>
            <div className="space-y-6">

                {/* Amount Input */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-2">Amount (₹)</label>
                    <TextInput
                        placeholder="e.g. 5000"
                        label=""
                        onChange={(value) => setAmount(Number(value))}
                    // Note: If TextInput from @repo/ui doesn't accept className, this might need a wrapper. 
                    // Assuming basic functionality here.
                    />
                </div>

                {/* Bank Select */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-2">Select Bank</label>
                    <Select
                        onSelect={(value) => setProvider(SUPPORTED_BANKS.find((x) => x.name === value)?.name || "")}
                        options={SUPPORTED_BANKS.map((x) => ({ key: x.name, value: x.name }))}
                    />
                </div>

                <div className="pt-4">
                    <Button
                        onClick={handleAddMoney}
                        disabled={isProcessing}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95
                            ${isProcessing ? 'bg-slate-300 dark:bg-neutral-700 cursor-not-allowed' : 'bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-gray-200 shadow-lg'}`
                        }
                    >
                        {isProcessing ? "Processing..." : "Proceed to Payment"}
                    </Button>
                    <p className="text-center text-xs text-slate-400 mt-4">
                        Secure SSL encryption. Redirects to bank gateway.
                    </p>
                </div>
            </div>
        </div>
    );
};
