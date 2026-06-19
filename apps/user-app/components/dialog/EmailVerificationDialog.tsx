"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { TextInput } from "@repo/ui/textinput";

type Props = {
    initialEmail?: string | null;
    onSend: (email: string) => Promise<{ success: boolean; errorCode?: string; message?: string; retryAfterSec?: number; expiresInSec?: number }>;
    onVerify: (code: string) => Promise<{ success: boolean; errorCode?: string; message?: string; remaining?: number }>;
    onClose: () => void;
    onVerified: () => void;
};

export function EmailVerificationDialog({ initialEmail, onSend, onVerify, onClose, onVerified }: Props) {
    const [mounted, setMounted] = useState(false);

    const [phase, setPhase] = useState<"email" | "otp">("email");
    const [email, setEmail] = useState(initialEmail ?? "");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSend = useMemo(() => email.trim().length > 3 && !loading, [email, loading]);
    const canVerify = useMemo(() => code.trim().length === 6 && !loading, [code, loading]);

    useEffect(() => {
        setMounted(true);
    }, []);

    async function handleSend() {
        setLoading(true);
        setError(null);
        try {
            const res = await onSend(email.trim());
            if (res.success) {
                setPhase("otp");
            } else {
                setError(res.message ?? "Failed to send code.");
            }
        } catch (e: any) {
            setError(e?.message ?? "Failed to send code.");
        } finally {
            setLoading(false);
        }
    }

    async function handleVerify() {
        setLoading(true);
        setError(null);
        try {
            const res = await onVerify(code.trim());
            if (res.success) {
                onVerified();
                onClose();
            } else {
                setError(res.message ?? "Invalid code.");
            }
        } catch (e: any) {
            setError(e?.message ?? "Verification failed.");
        } finally {
            setLoading(false);
        }
    }

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-md"
                onClick={() => (!loading ? onClose() : null)}
            />
            <div
                className="relative w-full max-w-xl rounded-[2.5rem] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {phase === "email" ? (
                    <>
                        <div className="p-8 border-b border-slate-100 dark:border-neutral-800">
                            <div className="font-bold text-lg text-slate-900 dark:text-white">Verify email</div>
                            <div className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                A 6-digit code will be sent to this email.
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
                                {loading ? "Sending..." : "Send code"}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="p-8 border-b border-slate-100 dark:border-neutral-800">
                            <div className="font-bold text-lg text-slate-900 dark:text-white">Enter verification code</div>
                            <div className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                We sent a 6-digit code to <span className="font-semibold text-slate-700 dark:text-neutral-200">{email}</span>.
                            </div>

                            <div className={`mt-5 ${loading ? "pointer-events-none opacity-70" : ""}`}>
                                <TextInput
                                    label="Verification code"
                                    value={code}
                                    onChange={(value: string) => setCode(value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="000000"
                                />
                            </div>

                            {error ? (
                                <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm font-semibold">
                                    {error}
                                </div>
                            ) : null}
                        </div>

                        <div className="p-6 flex gap-3 justify-between">
                            <button
                                onClick={() => { setPhase("email"); setCode(""); setError(null); }}
                                disabled={loading}
                                className="h-11 px-5 rounded-2xl border border-slate-200 dark:border-neutral-800 font-bold text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                            >
                                ← Back
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className="h-11 px-5 rounded-2xl border border-slate-200 dark:border-neutral-800 font-bold text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleVerify}
                                    disabled={!canVerify}
                                    className="h-11 px-5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Verifying..." : "Verify"}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}
