"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { SWRConfig } from "swr";

const fetcher = (url: string) =>
    fetch(url).then((r) => {
        if (!r.ok) throw new Error("Fetch failed");
        return r.json();
    });

export const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <SWRConfig
                    value={{
                        fetcher,
                        revalidateOnFocus: true,
                        revalidateOnReconnect: true,
                        dedupingInterval: 2000,
                        errorRetryCount: 3,
                        shouldRetryOnError: true,
                    }}
                >
                    {children}
                </SWRConfig>
            </ThemeProvider>
        </SessionProvider>
    );
};
