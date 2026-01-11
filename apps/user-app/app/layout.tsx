import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "../provider";
import "./globals.css";
import { JSX } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Vaultly | Modern Payments",
  description: "Secure, fast, and simple payments.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-slate-50 selection:bg-indigo-100 dark:selection:bg-indigo-900`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
