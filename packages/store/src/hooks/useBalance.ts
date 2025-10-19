"use client";

import useSWR from "swr";

export interface Balance {
    amount: number;
    locked: number;
}

export interface BalanceResponse {
    balance: Balance;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useBalance() {
    const { data, error, mutate, isLoading } = useSWR<BalanceResponse>(
        "/api/user/balance",
        fetcher,
        {
            refreshInterval: 10000,
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
        }
    );

    return {
        balance: data?.balance || { amount: 0, locked: 0 },
        isLoading,
        isError: error,
        refresh: mutate,
    };
}
