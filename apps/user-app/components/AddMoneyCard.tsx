"use client";

import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Select } from "@repo/ui/select";
import { useState } from "react";
import { TextInput } from "@repo/ui/textinput";
import { createOnRampTxn } from "../app/lib/actions/createOnRampTxn";
import { useBalance, useTransactions } from "@repo/store";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

const SUPPORTED_BANKS = [
    { name: "HDFC Bank", redirectUrl: "https://netbanking.hdfcbank.com" },
    { name: "Axis Bank", redirectUrl: "https://www.axisbank.com/" },
    { name: "ICICI Bank", redirectUrl: "https://www.icicibank.com/" },
    { name: "SBI", redirectUrl: "https://retail.onlinesbi.sbi/" },
    { name: "Kotak Mahindra Bank", redirectUrl: "https://netbanking.kotak.com/" },
];

export const AddMoney = () => {
    const router = useRouter();

    const [redirectUrl, setRedirectUrl] = useState(SUPPORTED_BANKS[0]?.redirectUrl);
    const [provider, setProvider] = useState(SUPPORTED_BANKS[0]?.name || "");
    const [amount, setAmount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const { refresh: refreshBalance } = useBalance();
    const { refresh: refreshTransactions, addOptimistic } = useTransactions();

    const handleAddMoney = async () => {
        if (amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        setIsProcessing(true);
        const idempotencyKey = uuidv4();

        try {
            addOptimistic({
                id: Date.now(),
                time: new Date(),
                amount: amount * 100,
                status: "Processing",
                provider,
            });

            const result = await createOnRampTxn(amount * 100, provider, idempotencyKey);

            if (result.success) {
                await Promise.all([refreshBalance(), refreshTransactions()]);

                //Extract token (adjust if action returns token elsewhere)
                const token = (result as any)?.token ?? (result as any)?.data?.token;

                if (!token) {
                    alert("Transaction created but token missing in response.");
                    await refreshTransactions();
                    return;
                }

                const qs = new URLSearchParams({
                    token: String(token),
                    amount: String(amount * 100),
                    userId: String(result.userId),
                    provider: provider,
                });

                router.push(`/mock-bank?${qs.toString()}`);
                return;
            }

            alert(result.message || "Transaction failed");
            await refreshTransactions();
        } catch (error) {
            alert("Failed to create transaction");
            await refreshTransactions();
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card title="Add Money">
            <div className="w-full">
                <TextInput
                    label="Amount"
                    placeholder="Amount"
                    onChange={(value) => {
                        setAmount(Number(value));
                    }}
                />
                <div className="py-4 text-left font-medium dark:text-gray-300">Bank</div>
                <Select
                    onSelect={(value) => {
                        setRedirectUrl(
                            SUPPORTED_BANKS.find((x) => x.name === value)?.redirectUrl || ""
                        );
                        setProvider(SUPPORTED_BANKS.find((x) => x.name === value)?.name || "");
                    }}
                    options={SUPPORTED_BANKS.map((x) => ({
                        key: x.name,
                        value: x.name,
                    }))}
                />
                <div className="flex justify-center pt-4">
                    <Button
                        onClick={handleAddMoney}
                        disabled={isProcessing}
                        className="px-6 py-2 rounded-lg font-semibold"
                    >
                        {isProcessing ? "Processing..." : "Add Money"}
                    </Button>
                </div>
            </div>
        </Card>
    );
};
