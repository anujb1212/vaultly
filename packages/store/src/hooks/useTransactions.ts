"use client";

import useSWR from "swr";

type TransactionStatus = "Processing" | "Success" | "Failure";

export interface OnRampTransaction {
    id: number;
    time: Date;
    amount: number;
    status: TransactionStatus;
    provider: string;
    failureReasonCode: string
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
    status: TransactionStatus;
    token: string;
    linkedBankAccountId: number;
    providerKey: string;
    displayName: string | null;
    maskedAccount: string | null;
    type: "offRamp";
}

interface TransactionsResponse {
    onRamp: OnRampTransaction[];
    p2p: P2PTransaction[];
    offRamp: OffRampTransaction[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTransactions() {
    const { data, error, mutate, isLoading } = useSWR<TransactionsResponse>(
        "/api/user/transactions",
        fetcher,
        {
            refreshInterval: 15000,
            revalidateOnFocus: true,
        }
    );

    const addOptimistic = (tx: Partial<OnRampTransaction>) => {
        if (data) {
            mutate(
                {
                    ...data,
                    onRamp: [tx as OnRampTransaction, ...data.onRamp],
                },
                false
            );
        }
    };

    return {
        onRampTransactions: data?.onRamp || [],
        p2pTransactions: data?.p2p || [],
        offRampTransactions: data?.offRamp || [],
        isLoading,
        isError: error,
        refresh: mutate,
        addOptimistic,
    };
}
