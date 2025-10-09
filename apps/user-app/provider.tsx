"use client"
import { RecoilRoot } from "recoil";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./components/ThemeProvider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
    return <RecoilRoot>
        <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                {children}
            </ThemeProvider>
        </SessionProvider>
    </RecoilRoot>
}