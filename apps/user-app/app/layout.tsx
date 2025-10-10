import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "../provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vaultly",
  description: "Simple payments & wallet app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
