"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Shield, ArrowLeft } from "lucide-react";
import { send2faOtp } from "../lib/actions/send2faOtp";
import { verify2faLogin } from "../lib/actions/verify2faLogin";

export default function Verify2faPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();

    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);

    const canVerify = useMemo(() => code.trim().length === 6 && !loading, [code, loading]);

    useEffect(() => {
        if (status === "authenticated" && !session?.user?.email) {
            router.replace("/signin");
        }
    }, [status, session, router]);

    useEffect(() => {
        if (status === "authenticated" && session?.user && !sent && !sending) {
            doSend();
        }
    }, [status]);

    async function doSend() {
        setSending(true);
        setError(null);
        try {
            const res = await send2faOtp();
            if (!res.success) {
                setError(res.message);
            } else {
                setSent(true);
            }
        } catch {
            setError("Failed to send code.");
        } finally {
            setSending(false);
        }
    }

    async function handleSend() {
        setSent(false);
        await doSend();
    }

    async function handleVerify() {
        setLoading(true);
        setError(null);
        try {
            const res = await verify2faLogin(code.trim());
            if (!res.success) {
                setError(res.message);
            } else {
                await update();
                router.replace("/dashboard");
            }
        } catch {
            setError("Verification failed.");
        } finally {
            setLoading(false);
        }
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
                <div className="animate-spin w-8 h-8 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black px-4">
            <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 shadow-xl p-10">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 mb-5">
                        <Shield className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Two-Factor Authentication
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2 max-w-xs">
                        {sent
                            ? `Enter the 6-digit code we sent to ${session?.user?.email ?? "your email"}.`
                            : sending
                                ? "Sending verification code..."
                                : "Click below to send a verification code to your email."
                        }
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                            Verification code
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="******"
                            autoFocus
                            disabled={!sent}
                            className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white text-lg font-bold text-center tracking-[0.5em] outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition disabled:opacity-50"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm font-semibold text-center">
                            {error}
                        </div>
                    )}

                    {!sent && !sending ? (
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            className="w-full h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition disabled:opacity-50"
                        >
                            Send code
                        </button>
                    ) : (
                        <button
                            onClick={handleVerify}
                            disabled={!canVerify}
                            className="w-full h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Verifying..." : "Verify"}
                        </button>
                    )}

                    {sent && (
                        <button
                            onClick={handleSend}
                            disabled={loading || sending}
                            className="w-full text-sm font-bold text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 transition disabled:opacity-50"
                        >
                            Resend code
                        </button>
                    )}

                    <div className="pt-4 border-t border-slate-100 dark:border-neutral-800">
                        <button
                            onClick={() => router.push("/settings/security")}
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 transition disabled:opacity-50"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back to Security Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
