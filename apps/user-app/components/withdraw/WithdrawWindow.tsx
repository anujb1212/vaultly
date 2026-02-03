"use client";

import { useState } from "react";
import { BankCard } from "./BankCard";
import { Button } from "@repo/ui/button";
import { TextInput } from "@repo/ui/textinput";
import { ArrowRight, Eye, EyeOff, AlertCircle, Landmark } from "lucide-react";
import { Card } from "@repo/ui/card";

const SUPPORTED_BANKS = [
    { name: "HDFC Bank", colorFrom: "from-blue-800", colorTo: "to-blue-600", account: "**** 4821", id: 1 },
    { name: "Axis Bank", colorFrom: "from-rose-800", colorTo: "to-rose-600", account: "**** 9923", id: 2 },
    { name: "ICICI Bank", colorFrom: "from-orange-700", colorTo: "to-orange-500", account: "**** 1120", id: 3 },
    { name: "SBI", colorFrom: "from-cyan-700", colorTo: "to-blue-500", account: "**** 3311", id: 4 },
    { name: "Kotak Bank", colorFrom: "from-red-700", colorTo: "to-red-500", account: "**** 8822", id: 5 },
];

export const WithdrawWindow = () => {
    const [selectedBank, setSelectedBank] = useState<number | null>(null);
    const [amount, setAmount] = useState("");
    const [showBalances, setShowBalances] = useState(false);
    const [pin, setPin] = useState("");
    const [step, setStep] = useState(1);

    const [balances] = useState(() =>
        SUPPORTED_BANKS.map(() => Math.floor(Math.random() * 5000000) + 100000)
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Linked Accounts</h2>
                    <button
                        onClick={() => setShowBalances(!showBalances)}
                        className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                    >
                        {showBalances ? <><EyeOff size={16} /> Hide Balances</> : <><Eye size={16} /> Show Balances</>}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SUPPORTED_BANKS.map((bank, index) => (
                        <BankCard
                            key={bank.id}
                            {...bank}
                            balance={balances[index]}
                            isSelected={selectedBank === bank.id}
                            onSelect={() => setSelectedBank(bank.id)}
                            showBalance={showBalances}
                        />
                    ))}
                </div>
            </div>

            {/* Right Side: Action Panel */}
            <div className="lg:col-span-5">
                <div className="sticky top-6">
                    <Card title="Withdraw Funds" className="relative overflow-hidden min-h-[400px]">
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative z-10 space-y-6 mt-2">
                            {!selectedBank ? (
                                <div className="h-[250px] flex flex-col items-center justify-center text-center text-slate-400">
                                    <Landmark className="w-12 h-12 mb-3 opacity-50" />
                                    <p>Select a bank account<br />to proceed with withdrawal.</p>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-800/50 border border-slate-100 dark:border-neutral-800">
                                        <p className="text-xs text-slate-500 uppercase tracking-wide">Withdraw To</p>
                                        <p className="font-bold text-slate-900 dark:text-white text-lg">
                                            {SUPPORTED_BANKS.find(b => b.id === selectedBank)?.name}
                                        </p>
                                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                                            {SUPPORTED_BANKS.find(b => b.id === selectedBank)?.account}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <TextInput
                                            label="Amount to Withdraw"
                                            placeholder="Min ₹100"
                                            value={amount}
                                            onChange={(v) => setAmount(v)}
                                            type="number"
                                        />

                                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg flex gap-3 items-start">
                                            <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                            <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
                                                Funds will be transferred instantly to your linked bank account via IMPS.
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => console.log("Withdraw Logic Trigger")}
                                        className="w-full py-4 text-base shadow-lg shadow-emerald-500/20"
                                    >
                                        Confirm Withdrawal <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
