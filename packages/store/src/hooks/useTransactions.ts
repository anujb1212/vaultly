"use client";

import useSWR from "swr";
import { useEffect, useRef } from "react";
import { useWalletStore } from "../store";

export interface OnRampTransaction {
    id: number;
    time: Date;
    amount: number;
    status: "Processing" | "Success" | "Failure";
    provider: string;
    failureReasonCode: string;
    type: "onRamp";
}

export interface P2PTransaction {
    id: number;
    time: Date;
    amount: number;
    toUser: string;
    toUserName: string;
    type: "sent" | "received";
}

export interface OffRampTransaction {
    id: number;
    time: Date;
    amount: number;
    status: "Processing" | "Success" | "Failure";
    token: string;
    linkedBankAccountId: number;
    providerKey: string;
    displayName: string | null;
    maskedAccount: string | null;
    type: "offRamp";
}

export interface ArbitiumTransaction {
    id: number;
    time: Date;
    amount: number;
    direction: "DEPOSIT" | "WITHDRAW";
    idempotencyKey: string;
    type: "arbitium";
}

interface TransactionsResponse {
    onRamp: OnRampTransaction[];
    p2p: P2PTransaction[];
    offRamp: OffRampTransaction[];
    arbitium: ArbitiumTransaction[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTransactions() {
    const onRampTransactions = useWalletStore((s) => s.onRampTransactions);
    const p2pTransactions = useWalletStore((s) => s.p2pTransactions);
    const offRampTransactions = useWalletStore((s) => s.offRampTransactions);
    const arbitiumTransactions = useWalletStore((s) => s.arbitiumTransactions);
    const setOnRamp = useWalletStore((s) => s.setOnRampTransactions);
    const setP2P = useWalletStore((s) => s.setP2PTransactions);
    const setOffRamp = useWalletStore((s) => s.setOffRampTransactions);
    const setArbitium = useWalletStore((s) => s.setArbitiumTransactions);
    const setError = useWalletStore((s) => s.setTransactionsError);
    const addOptimisticOnRamp = useWalletStore((s) => s.addOptimisticOnRamp);
    const syncedRef = useRef(false);

    const { data, error, mutate, isLoading } = useSWR<TransactionsResponse>(
        "/api/user/transactions",
        fetcher,
        {
            refreshInterval: 15000,
            revalidateOnFocus: true,
        }
    );

    useEffect(() => {
        if (data) {
            setOnRamp(data.onRamp || []);
            setP2P(data.p2p || []);
            setOffRamp(data.offRamp || []);
            setArbitium(data.arbitium || []);
            syncedRef.current = true;
        } else if (error) {
            setError(error.message || "Failed to fetch transactions");
        }
    }, [data, error, setOnRamp, setP2P, setOffRamp, setArbitium, setError]);

    const addOptimistic = (tx: Partial<OnRampTransaction>) => {
        addOptimisticOnRamp(tx);
    };

    return {
        onRampTransactions: onRampTransactions as OnRampTransaction[],
        p2pTransactions: p2pTransactions as P2PTransaction[],
        offRampTransactions: offRampTransactions as OffRampTransaction[],
        arbitiumTransactions: arbitiumTransactions as ArbitiumTransaction[],
        isLoading: isLoading && !syncedRef.current,
        isError: error,
        refresh: mutate,
        addOptimistic,
    };
}
