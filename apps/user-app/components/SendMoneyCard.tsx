"use client";

import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { p2pTransfer } from "../app/lib/actions/p2pTransfer";

export function SendMoneyCard() {
    const [number, setNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [isSending, setIsSending] = useState(false);
    const router = useRouter();

    async function handleSend() {
        if (!number.trim() || !amount || Number(amount) <= 0) {
            alert("Please enter valid number and amount");
            return;
        }

        setIsSending(true);

        try {
            await p2pTransfer(number, Number(amount) * 100);
            router.push("/dashboard");
        } catch (err) {
            alert("Transfer failed, please try again.");
        } finally {
            setIsSending(false);
        }
    }

    return (
        <div className="h-[90vh] flex justify-center items-center">
            <Card title="Send">
                <div className="min-w-72 pt-2 space-y-4">
                    {/* Number Input */}
                    <div>
                        <label htmlFor="number" className="block mb-1 font-medium text-gray-700">
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
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label htmlFor="amount" className="block mb-1 font-medium text-gray-700">
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
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="pt-4 flex justify-center">
                        <Button onClick={handleSend} disabled={isSending}>
                            {isSending ? "Sending..." : "Send"}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
