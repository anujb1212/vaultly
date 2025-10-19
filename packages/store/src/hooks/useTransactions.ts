"use client";

import useSWR from "swr";

type TransactionStatus = "Processing" | "Success" | "Failure";

export interface OnRampTransaction {
    id: number;
    time: Date;
    amount: number;
    status: TransactionStatus;
    provider: string;
}

export interface P2PTransaction {
    id: number;
    time: Date;
    amount: number;
    toUser: string;
    type: "sent" | "received";
}

interface TransactionsResponse {
    onRamp: OnRampTransaction[];
    p2p: P2PTransaction[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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
        isLoading,
        isError: error,
        refresh: mutate,
        addOptimistic,
    };
}
