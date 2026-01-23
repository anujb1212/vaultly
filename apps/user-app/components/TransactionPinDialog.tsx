"use client";

import { useState } from "react";

export function TransactionPinDialog(props: {
    open: boolean;
    title: string;
    subtitle: string;
    confirmText?: string;
    onClose: () => void;
    onConfirm: (pin: string) => Promise<void>;
}) {
    const { open, title, subtitle, confirmText = "Confirm", onClose, onConfirm } = props;

    const [pin, setPin] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => (!saving ? onClose() : null)} />
            <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xl p-6">
                <div className="font-bold text-lg text-slate-900 dark:text-white">{title}</div>
                <div className="text-sm text-slate-500 dark:text-neutral-400 mt-1">{subtitle}</div>

                <div className="mt-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                        6-digit PIN
                    </label>
                    <input
                        value={pin}
                        onChange={(e) => {
                            const next = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setPin(next);
                            setErr(null);
                        }}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        className="mt-2 w-full h-12 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500/40"
                        placeholder="••••••"
                        type="password"
                        disabled={saving}
                    />
                </div>

                {err && (
                    <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm font-semibold">
                        {err}
                    </div>
                )}

                <div className="mt-5 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="h-11 px-5 rounded-2xl border border-slate-200 dark:border-neutral-800 font-bold text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={async () => {
                            setErr(null);
                            if (pin.length !== 6) {
                                setErr("PIN must be exactly 6 digits");
                                return;
                            }
                            setSaving(true);
                            try {
                                await onConfirm(pin);
                            } catch (e) {
                                setErr(e instanceof Error ? e.message : "Failed");
                                return;
                            } finally {
                                setSaving(false);
                            }
                        }}
                        disabled={saving}
                        className="h-11 px-5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition"
                    >
                        {saving ? "Verifying..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
