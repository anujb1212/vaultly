"use client";

import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { TextInput } from "@repo/ui/textinput";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { p2pTransfer } from "../app/lib/actions/p2pTransfer";
import { useBalance, useTransactions } from "@repo/store";
import { v4 as uuidv4 } from "uuid";
import { Send, Smartphone, IndianRupee } from "lucide-react";

export function SendMoneyCard() {
    const [number, setNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [isSending, setIsSending] = useState(false);
    const router = useRouter();

    const { balance, refresh: refreshBalance } = useBalance();
    const { refresh: refreshTransactions } = useTransactions();

    async function handleSend() {
        if (!number.trim() || !amount || Number(amount) <= 0) {
            alert("Please enter valid number and amount");
            return;
        }

        const amountInPaise = Number(amount) * 100;

        // Check sufficient balance
        if (balance.amount < amountInPaise) {
            alert("Insufficient balance");
            return;
        }

        setIsSending(true);
        const idempotencyKey = uuidv4();

        try {
            const result = await p2pTransfer(
                number,
                amountInPaise,
                idempotencyKey
            );

            if (result.success) {
                await Promise.all([refreshBalance(), refreshTransactions()]);
                alert("Transfer successful!");
                setNumber("");
                setAmount("");
                router.push("/dashboard");
            } else {
                alert(result.message || "Transfer failed");
            }
        } catch (error) {
            alert("Transfer failed, please try again.");
        } finally {
            setIsSending(false);
        }
    }

    return (
        <Card title="Send Money" className="w-full relative overflow-hidden">
            {/* Decorative background blob */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="space-y-6 relative z-10">
                {/* Balance Display */}
                <div className="bg-slate-50 dark:bg-neutral-800/50 rounded-xl p-4 flex justify-between items-center border border-slate-100 dark:border-neutral-800">
                    <span className="text-sm font-medium text-slate-500 dark:text-neutral-400">Available Balance</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                        ₹{(balance.amount / 100).toLocaleString('en-IN')}
                    </span>
                </div>

                {/* Number Input */}
                <div className="space-y-1">
                    <TextInput
                        label="Mobile Number"
                        placeholder="Enter 10-digit number"
                        value={number}
                        onChange={(val) => {
                            // Only allow numbers
                            const cleanVal = val.replace(/\D/g, "").slice(0, 10);
                            setNumber(cleanVal);
                        }}
                    />
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
                        <Smartphone className="w-3 h-3" />
                        <span>Instant transfer to Vaultly users</span>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-1">
                    <TextInput
                        label="Amount (₹)"
                        placeholder="0.00"
                        type="number"
                        value={amount}
                        onChange={(val) => setAmount(val)}
                    />
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
                        <IndianRupee className="w-3 h-3" />
                        <span>No transaction fees</span>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                    <Button
                        onClick={handleSend}
                        disabled={isSending}
                        className={`w-full py-4 text-base shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2
                            ${isSending ? "opacity-70 cursor-wait" : "hover:-translate-y-0.5"}`
                        }
                    >
                        {isSending ? (
                            "Processing..."
                        ) : (
                            <>
                                Send Securely <Send className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
