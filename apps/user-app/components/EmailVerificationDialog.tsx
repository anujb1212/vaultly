"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { TextInput } from "@repo/ui/textinput";

type Props = {
    initialEmail?: string | null;
    onSend: (email: string) => Promise<void>;
    onClose: () => void;
};

export function EmailVerificationDialog({ initialEmail, onSend, onClose }: Props) {
    const [mounted, setMounted] = useState(false);

    const [email, setEmail] = useState(initialEmail ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSend = useMemo(() => email.trim().length > 3 && !loading, [email, loading]);

    useEffect(() => {
        setMounted(true);
    }, []);

    async function handleSend() {
        setLoading(true);
        setError(null);
        try {
            await onSend(email.trim());
            onClose();
        } catch (e: any) {
            setError(e?.message ?? "Failed to send verification email.");
        } finally {
            setLoading(false);
        }
    }

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-md"
                onClick={() => (!loading ? onClose() : null)}
            />

            {/* Dialog */}
            <div
                className="relative w-full max-w-xl rounded-[2.5rem] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8 border-b border-slate-100 dark:border-neutral-800">
                    <div className="font-bold text-lg text-slate-900 dark:text-white">Verify email</div>
                    <div className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                        We will send a verification link to this email.
                    </div>

                    <div className={`mt-5 ${loading ? "pointer-events-none opacity-70" : ""}`}>
                        <TextInput
                            label="Email"
                            value={email}
                            onChange={(value: string) => setEmail(value)}
                            placeholder="you@example.com"
                        />
                    </div>

                    {error ? (
                        <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm font-semibold">
                            {error}
                        </div>
                    ) : null}
                </div>

                <div className="p-6 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="h-11 px-5 rounded-2xl border border-slate-200 dark:border-neutral-800 font-bold text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSend}
                        disabled={!canSend}
                        className="h-11 px-5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Sending..." : "Send verification link"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
