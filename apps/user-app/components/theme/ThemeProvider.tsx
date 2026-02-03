"use client";

import { ThemeProviderProps } from "next-themes";
import dynamic from "next/dynamic";

const NextThemesProvider = dynamic(
    () => import("next-themes").then((mod) => mod.ThemeProvider),
    { ssr: false }
);

export function ThemeProvider(props: ThemeProviderProps) {
    return <NextThemesProvider {...props} />;
}
