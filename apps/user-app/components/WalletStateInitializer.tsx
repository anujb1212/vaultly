"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useWalletStore } from "@repo/store";

export function WalletStateInitializer({ children }: { children: React.ReactNode }) {
    const clearWalletState = useWalletStore((s) => s.clearWalletState);
    const { data: session, status } = useSession();
    const prevUserId = useRef<string | null>(null);

    const currentUserId = (session?.user as any)?.id ?? null;

    useEffect(() => {
        if (status === "unauthenticated") {
            clearWalletState();
            prevUserId.current = null;
        } else if (currentUserId && currentUserId !== prevUserId.current) {
            clearWalletState();
            prevUserId.current = currentUserId;
        } else if (currentUserId) {
            prevUserId.current = currentUserId;
        }
    }, [status, currentUserId, clearWalletState]);

    return <>{children}</>;
}
