"use client";

import { useCallback, useEffect, useRef } from "react";
import useSWR from "swr";
import { useWalletStore, type LinkedAccount } from "../store";

interface LinkedAccountsResponse {
    linkedAccounts: LinkedAccount[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export { type LinkedAccount };

export function useLinkedAccounts() {
    const linkedAccounts = useWalletStore((s) => s.linkedAccounts);
    const setLinkedAccounts = useWalletStore((s) => s.setLinkedAccounts);
    const setLinkedAccountsError = useWalletStore((s) => s.setLinkedAccountsError);
    const syncedRef = useRef(false);

    const { data, error, mutate, isLoading } = useSWR<LinkedAccountsResponse>(
        "/api/user/linked-accounts",
        fetcher,
        {
            refreshInterval: 30000,
            revalidateOnFocus: true,
        }
    );

    useEffect(() => {
        if (data?.linkedAccounts) {
            setLinkedAccounts(data.linkedAccounts);
            syncedRef.current = true;
        } else if (error) {
            setLinkedAccountsError(error.message || "Failed to fetch linked accounts");
        }
    }, [data, error, setLinkedAccounts, setLinkedAccountsError]);

    const refresh = useCallback(() => {
        mutate();
    }, [mutate]);

    return {
        linkedAccounts,
        isLoading: isLoading && !syncedRef.current,
        error: error,
        refresh,
    };
}
