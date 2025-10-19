"use client";

import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { p2pTransfer } from "../app/lib/actions/p2pTransfer";
import { useBalance, useTransactions } from "@repo/store";

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

        try {
            const result = await p2pTransfer(number, amountInPaise);

            if (result.success) {
                // Refresh balance and transactions immediately
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
        <Card title="Send">
            <div className="pt-2 space-y-4">
                {/* Show current balance */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Available: ₹{(balance.amount / 100).toLocaleString()}
                </div>

                <div>
                    <label
                        htmlFor="number"
                        className="block mb-1 font-medium text-gray-700 dark:text-gray-300"
                    >
                        Number
                    </label>
                    <input
                        id="number"
                        type="tel"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        placeholder="Enter 10-digit number"
                        value={number}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setNumber(val);
                        }}
                        disabled={isSending}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white"
                    />
                </div>

                <div>
                    <label
                        htmlFor="amount"
                        className="block mb-1 font-medium text-gray-700 dark:text-gray-300"
                    >
                        Amount
                    </label>
                    <input
                        id="amount"
                        type="number"
                        min={1}
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        disabled={isSending}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white"
                    />
                </div>

                <div className="pt-4 flex justify-center">
                    <Button
                        onClick={handleSend}
                        disabled={isSending}
                        className={isSending ? "opacity-50 cursor-not-allowed" : ""}
                    >
                        {isSending ? "Sending..." : "Send"}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
