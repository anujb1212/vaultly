"use client";

import { Button } from "@repo/ui/button";
import { TextInput } from "@repo/ui/textinput";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useBalance, useTransactions } from "@repo/store";
import { v4 as uuidv4 } from "uuid";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { TransactionPinDialog } from "../dialog/TransactionPinDialog";
import { p2pTransfer } from "../../app/lib/actions/p2pTransfer";
import { UserSearch } from "./UserSearch";
import { Loader } from "../layout/Loader";


export function SendMoneyCard() {
    const [selectedUser, setSelectedUser] = useState<{ id: number; name: string | null; number: string | null } | null>(null);
    const [amount, setAmount] = useState("");
    const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
    const [error, setError] = useState<string | null>(null);

    const [pinOpen, setPinOpen] = useState(false);
    const [pendingSend, setPendingSend] = useState<{
        to: string;
        amountPaise: number;
        idempotencyKey: string;
    } | null>(null);

    const router = useRouter();

    const { balance, refresh: refreshBalance } = useBalance();
    const { refresh: refreshTransactions } = useTransactions();

    async function handleSend() {
        setError(null);

        if (!selectedUser?.number) {
            setError("Please select a recipient.");
            return;
        }

        const to = selectedUser.number;
        if (!/^\d{10}$/.test(to)) {
            setError("Invalid recipient number.");
            return;
        }

        const amountNum = Number(amount);
        if (!Number.isFinite(amountNum) || amountNum <= 0) {
            setError("Please enter a valid amount.");
            return;
        }

        const amountInPaise = Math.round(amountNum * 100);
        if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
            setError("Please enter a valid amount.");
            return;
        }

        if (balance.amount < amountInPaise) {
            setError("Insufficient wallet balance.");
            return;
        }

        const idempotencyKey = uuidv4();
        setPendingSend({ to, amountPaise: amountInPaise, idempotencyKey });
        setPinOpen(true);
    }

    if (status === "success") {
        return (
            <div className="w-full max-w-[28rem] mx-auto animate-fade-in">
                <div className="bg-white dark:bg-[#06020f] rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/5 shadow-2xl min-h-[420px] flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none"></div>
                    <div className="text-center animate-in zoom-in-95 duration-500 relative z-10">
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-emerald-500/20">
                            <CheckCircle2 className="w-10 h-10 drop-shadow-sm" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                            Transfer Successful!
                        </h3>
                        <p className="text-slate-500 dark:text-white/60 text-sm font-medium">
                            ₹{Number(amount).toLocaleString("en-IN")} sent to {selectedUser?.name || selectedUser?.number}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {status === "processing" && <Loader message="Sending money securely..." />}

            <section className="w-full relative overflow-hidden rounded-[2rem] bg-white dark:bg-[#06020f] border border-slate-200 dark:border-white/5 shadow-2xl min-h-[420px] isolate transition-colors duration-300">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-40 h-40 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[60px] pointer-events-none"></div>

                <div className="p-8 space-y-6 relative z-10">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Send Money</h2>

                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 flex justify-between items-center border border-slate-100 dark:border-white/10 backdrop-blur-md transition-colors">
                        <span className="text-sm font-medium text-slate-500 dark:text-white/60">
                            Available Balance
                        </span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white drop-shadow-sm">
                            ₹{(balance.amount / 100).toLocaleString("en-IN")}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <UserSearch
                            selectedUser={selectedUser}
                            onSelect={setSelectedUser}
                        />

                        <div className={`space-y-1 transition-all duration-300 ${selectedUser ? 'opacity-100' : 'opacity-50 pointer-events-none blur-[1px]'}`}>
                            <TextInput
                                label="Amount (₹)"
                                placeholder="0.00"
                                type="number"
                                value={amount}
                                onChange={(val) => {
                                    setAmount(val);
                                    setError(null);
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="pt-2">
                        <Button
                            onClick={handleSend}
                            disabled={status === "processing" || !selectedUser || !amount}
                            className={`w-full py-4 text-base font-semibold shadow-xl shadow-purple-500/10 dark:shadow-purple-500/10 flex items-center justify-center gap-2 transition-all duration-300
              ${status === "processing" ? "opacity-70 cursor-wait scale-95" : "hover:-translate-y-0.5 hover:shadow-purple-500/20 active:scale-95"}`}
                        >
                            {status === "processing" ? (
                                "Processing..."
                            ) : (
                                <>
                                    Send Securely <Send className="w-5 h-5" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </section>

            <TransactionPinDialog
                open={pinOpen}
                title="Enter Transaction PIN"
                subtitle={`Sending ₹${amount} to ${selectedUser?.name || selectedUser?.number}`}
                onClose={() => {
                    if (status !== "processing") {
                        setPinOpen(false);
                        setPendingSend(null);
                    }
                }}
                onVerify={async (pin) => {
                    if (!pendingSend) return;

                    setStatus("processing");
                    try {
                        const result = await p2pTransfer(
                            pendingSend.to,
                            pendingSend.amountPaise,
                            pendingSend.idempotencyKey,
                            pin
                        );

                        if (result.success) {
                            await Promise.all([refreshBalance(), refreshTransactions()]);
                            setStatus("success");
                            setPinOpen(false);
                            setPendingSend(null);

                            setTimeout(() => {
                                setSelectedUser(null);
                                setAmount("");
                                setStatus("idle");
                                router.push("/dashboard");
                            }, 2000);

                            return;
                        }

                        if (result.errorCode === "PIN_NOT_SET") {
                            setPinOpen(false);
                            setPendingSend(null);
                            setError("Please set your Transaction PIN in Security Center first.");
                            router.push("/settings/security");
                            return;
                        }
                        if (result.errorCode === "UNAUTHENTICATED") {
                            setPinOpen(false);
                            setPendingSend(null);
                            router.push("/signin");
                            return;
                        }
                        if (result.errorCode === "PIN_LOCKED") {
                            const retry = result.retryAfterSec ? ` Try again in ~${result.retryAfterSec}s.` : "";
                            throw new Error(`PIN locked due to repeated failures.${retry}`);
                        }
                        if (result.errorCode === "RATE_LIMITED") {
                            const retry = result.retryAfterSec ? ` Retry after ~${result.retryAfterSec}s.` : "";
                            throw new Error(`Too many attempts.${retry}`);
                        }
                        if (result.errorCode === "PIN_REQUIRED") throw new Error("Transaction PIN is required.");
                        if (result.errorCode === "PIN_INVALID") throw new Error("Invalid transaction PIN.");

                        throw new Error(result.message || "Transfer failed");
                    } catch (e: any) {
                        setStatus("idle");
                        setPinOpen(false);
                        setError(e.message || "An unexpected error occurred");
                    }
                }}
            />
        </>
    );
}
