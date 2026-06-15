"use client";

import useSWR from "swr";
import { useEffect, useRef } from "react";
import { useWalletStore, type Balance } from "../store";

interface BalanceResponse {
    balance: Balance;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useBalance() {
    const balance = useWalletStore((s) => s.balance);
    const setBalance = useWalletStore((s) => s.setBalance);
    const setBalanceError = useWalletStore((s) => s.setBalanceError);
    const syncedRef = useRef(false);

    const { data, error, mutate, isLoading, isValidating } = useSWR<BalanceResponse>(
        "/api/user/balance",
        fetcher,
        {
            refreshInterval: 10000,
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
        }
    );

    useEffect(() => {
        if (data?.balance) {
            setBalance(data.balance);
            syncedRef.current = true;
        } else if (error) {
            setBalanceError(error.message || "Failed to fetch balance");
        }
    }, [data, error, setBalance, setBalanceError]);

    return {
        balance,
        isLoading: isLoading && !syncedRef.current,
        isValidating,
        isError: error,
        refresh: mutate,
    };
}
