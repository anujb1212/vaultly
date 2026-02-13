"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { TransactionPinDialog } from "../dialog/TransactionPinDialog";
import { LinkedAccountsGrid } from "./LinkedAccountsGrid";
import { RecentItem, RecentOfframpActivity } from "./RecentOfframpActivity";
import { WithdrawActionPanel } from "./WithdrawActionPanel";

import { useBalance, useLinkedAccounts, useTransactions } from "@repo/store";
import { withdrawToLinkedAccount } from "../../app/lib/actions/withdraw";
import { Loader } from "../layout/Loader";

type OffRampTx = {
    id: number;
    time: string | number | Date;
    amount: number;
    status: "Processing" | "Success" | "Failure";
    token: string;
    linkedBankAccountId: number;
    providerKey: string;
    displayName: string | null;
    maskedAccount: string | null;
    type: "offRamp";
};

export const WithdrawWindow = () => {
    const router = useRouter();

    const { linkedAccounts, isLoading, error, refresh } = useLinkedAccounts();
    const { balance, refresh: refreshBalance } = useBalance();

    const txAny = useTransactions() as any;
    const offRampTransactions = (txAny?.offRampTransactions ?? []) as OffRampTx[];
    const refreshTransactions = (txAny?.refresh ?? (async () => { })) as () => Promise<any>;

    const [selectedId, setSelectedId] = useState<number | null>(null);

    const [amount, setAmount] = useState("");
    const [pinOpen, setPinOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [panelError, setPanelError] = useState<string | null>(null);
    const [panelOk, setPanelOk] = useState<string | null>(null);

    const [pending, setPending] = useState<{
        linkedBankAccountId: number;
        amountPaise: number;
        idempotencyKey: string;
    } | null>(null);

    const selected = useMemo(() => {
        if (selectedId) return linkedAccounts.find((a) => a.id === selectedId) ?? null;
        return linkedAccounts.length > 0 ? linkedAccounts[0]! : null;
    }, [linkedAccounts, selectedId]);

    const walletAmount = balance?.amount ?? 0;
    const walletLocked = balance?.locked ?? 0;
    const walletAvailablePaise = walletAmount - walletLocked;

    const recentItems = useMemo<RecentItem[]>(() => {
        if (!selected) return [];

        return offRampTransactions
            .filter((t) => t.linkedBankAccountId === selected.id)
            .slice(0, 10)
            .map((t) => {
                const status =
                    t.status === "Success"
                        ? ("Success" as const)
                        : t.status === "Processing"
                            ? ("Processing" as const)
                            : ("Failed" as const);

                return {
                    id: t.id,
                    time: t.time,
                    status,
                    displayName: t.displayName ?? t.providerKey,
                    amountPaise: t.amount,
                };
            });
    }, [offRampTransactions, selected]);

    const selectedLabel = selected ? `${selected.displayName} (${selected.maskedAccount})` : null;

    const onConfirm = () => {
        setPanelError(null);
        setPanelOk(null);

        if (!selected) {
            setPanelError("Select a linked bank account to proceed.");
            return;
        }

        const rs = Number(amount);
        if (!Number.isFinite(rs) || rs <= 0) {
            setPanelError("Please enter a valid amount.");
            return;
        }
        if (rs < 100) {
            setPanelError("Minimum withdrawal is ₹100.");
            return;
        }

        const amountPaise = Math.round(rs * 100);
        setPending({
            linkedBankAccountId: selected.id,
            amountPaise,
            idempotencyKey: uuidv4(),
        });
        setPinOpen(true);
    };

    return (
        <>
            {isProcessing && <Loader message="Processing withdrawal..." />}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-8">
                    <LinkedAccountsGrid
                        linkedAccounts={linkedAccounts}
                        isLoading={isLoading}
                        error={error}
                        selectedId={selected?.id ?? null}
                        onSelect={(id) => setSelectedId(id)}
                        onRetry={refresh}
                    />

                    <RecentOfframpActivity selectedLabel={selectedLabel} items={recentItems} />
                </div>

                <div className="lg:col-span-5">
                    <WithdrawActionPanel
                        selected={
                            selected
                                ? { displayName: selected.displayName, maskedAccount: selected.maskedAccount, amount: selected.amount }
                                : null
                        }
                        walletAvailablePaise={walletAvailablePaise}
                        amount={amount}
                        onAmountChange={setAmount}
                        isProcessing={isProcessing}
                        panelError={panelError}
                        panelOk={panelOk}
                        onConfirm={onConfirm}
                    />
                </div>
            </div>

            <TransactionPinDialog
                open={pinOpen}
                title="Enter Transaction PIN"
                subtitle="Required to complete this withdrawal."
                onClose={() => {
                    if (!isProcessing) {
                        setPinOpen(false);
                        setPending(null);
                    }
                }}
                onVerify={async (pin) => {
                    if (!pending) return;

                    setIsProcessing(true);
                    setPanelError(null);
                    setPanelOk(null);

                    try {
                        const result = await withdrawToLinkedAccount(
                            pending.linkedBankAccountId,
                            pending.amountPaise,
                            pending.idempotencyKey,
                            pin
                        );

                        if (!result.success) {
                            if (result.errorCode === "PIN_NOT_SET") {
                                setPinOpen(false);
                                setPending(null);
                                router.push("/settings/security");
                                throw new Error("Please set your Transaction PIN in Security Center first.");
                            }

                            if (result.errorCode === "UNAUTHENTICATED") {
                                setPinOpen(false);
                                setPending(null);
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

                            throw new Error(result.message || "Withdrawal failed");
                        }

                        setPanelOk("Withdrawal successful.");
                        setAmount("");

                        setPinOpen(false);
                        setPending(null);

                        await refreshTransactions();
                        await refreshBalance().catch(() => { });
                        await refresh();
                    } catch (e: any) {
                        setPanelError(e?.message ?? "Withdrawal failed.");
                    } finally {
                        setIsProcessing(false);
                    }
                }}
            />
        </>
    );
};
