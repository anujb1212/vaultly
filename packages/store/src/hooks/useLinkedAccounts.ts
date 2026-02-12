"use client";

import { useCallback, useEffect, useState } from "react";

export type LinkedAccount = {
    id: number;
    providerKey: string;
    displayName: string;
    maskedAccount: string;
    amount: number;
    locked: number;
    updatedAt?: string | Date;
};

export function useLinkedAccounts() {
    const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/user/linked-accounts", { method: "GET" });
            const json = await res.json();

            if (!res.ok) {
                const msg = typeof json?.error === "string" ? json.error : "Failed to fetch linked accounts";
                throw new Error(msg);
            }

            const rows = Array.isArray(json?.linkedAccounts) ? (json.linkedAccounts as LinkedAccount[]) : [];
            setLinkedAccounts(rows);
        } catch (e: any) {
            setError(e?.message ?? "Failed to fetch linked accounts");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { linkedAccounts, isLoading, error, refresh };
}
