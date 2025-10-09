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
          <div className="min-w-screen min-h-screen bg-[#ebe6e6] dark:bg-gray-900">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
