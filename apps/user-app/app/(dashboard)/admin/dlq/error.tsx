"use client";

import Link from "next/link";

function isUnauthorized(err: unknown) {
    const msg = String((err as any)?.message ?? err ?? "");
    return msg.toLowerCase().includes("unauthorized");
}

export default function AdminDlqError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const unauthorized = isUnauthorized(error);

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="rounded-3xl border border-border bg-card text-cardForeground shadow-elev-1 p-6">
                <h1 className="text-lg font-semibold tracking-tight">
                    {unauthorized ? "Admin access required" : "Couldn’t load DLQ inbox"}
                </h1>

                <p className="mt-2 text-sm text-mutedForeground">
                    {unauthorized
                        ? "You’re signed in, but your account isn’t allowed to view this page."
                        : "Something went wrong while fetching DLQ jobs. You can retry safely."}
                </p>

                {!unauthorized && (
                    <pre className="mt-4 rounded-2xl border border-border bg-muted/40 p-4 text-xs text-foreground overflow-auto">
                        {String(error?.message ?? "Unknown error")}
                    </pre>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => reset()}
                        className="inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-black dark:hover:bg-slate-200"
                    >
                        Retry
                    </button>

                    <Link
                        href="/signin"
                        className="inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 px-5 py-2.5 bg-transparent border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800"
                    >
                        Go to sign in
                    </Link>

                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 px-5 py-2.5 bg-transparent border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800"
                    >
                        Back to dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
