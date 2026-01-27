"use client";

import { useEffect, useMemo, useState } from "react";
import { XCircle, CheckCircle2 } from "lucide-react";

type ChangePinPayload = { currentPin: string; newPin: string; confirmPin: string };

type Props = {
    open: boolean;
    onClose: () => void;

    title?: string;
    subtitle?: string;
    pinIsSet?: boolean;
    onSetFirstPin?: (newPin: string) => Promise<void>;
    onChangePin?: (payload: ChangePinPayload) => Promise<void>;
    onSubmit?: (mpin: string) => Promise<void>;
    onVerify?: (mpin: string) => Promise<void>;
    onConfirm?: (mpin: string) => Promise<void>;
    confirmText?: string;
};

function cleanPin(v: string) {
    return (v || "").replace(/\D/g, "").slice(0, 6);
}

export function TransactionPinDialog({
    open,
    onClose,
    title,
    subtitle,
    pinIsSet,
    onSetFirstPin,
    onChangePin,
    onSubmit,
    onVerify,
    onConfirm,
    confirmText,
}: Props) {
    const [currentPin, setCurrentPin] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [okMsg, setOkMsg] = useState<string | null>(null);

    const verifyFn = useMemo(() => {
        if (typeof onVerify === "function") return onVerify;
        if (typeof onSubmit === "function") return onSubmit;
        if (typeof onConfirm === "function") return onConfirm;
        return null;
    }, [onVerify, onSubmit, onConfirm]);

    const flow = useMemo<"verify" | "set" | "change">(() => {
        if (verifyFn) return "verify";
        if (pinIsSet && typeof onChangePin === "function") return "change";
        if (!pinIsSet && typeof onSetFirstPin === "function") return "set";
        return pinIsSet ? "verify" : "set";
    }, [verifyFn, pinIsSet, onChangePin, onSetFirstPin]);

    const primaryText = useMemo(() => {
        if (flow === "verify") return confirmText || "Confirm";
        if (flow === "change") return "Change PIN";
        return "Set PIN";
    }, [flow, confirmText]);

    const dialogTitle = title ?? (flow === "verify" ? "Enter Transaction PIN" : "Set Transaction PIN");
    const dialogSubtitle =
        subtitle ??
        (flow === "verify"
            ? "Required to complete this action."
            : "Enter a new 6-digit PIN. It will be required for transfers.");

    useEffect(() => {
        if (!open) return;
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
        setError(null);
        setOkMsg(null);
        setSaving(false);
    }, [open]);

    const missingHandlerMsg = useMemo(() => {
        if (flow === "verify") return verifyFn ? null : "Missing verify handler (onVerify/onSubmit/onConfirm).";
        if (flow === "set") return typeof onSetFirstPin === "function" ? null : "Missing handler (onSetFirstPin).";
        return typeof onChangePin === "function" ? null : "Missing handler (onChangePin).";
    }, [flow, verifyFn, onSetFirstPin, onChangePin]);

    async function handlePrimary() {
        if (saving) return;
        setError(null);
        setOkMsg(null);

        if (missingHandlerMsg) {
            setError(missingHandlerMsg);
            return;
        }

        try {
            setSaving(true);

            if (flow === "verify") {
                const pin = cleanPin(currentPin);
                if (pin.length !== 6) throw new Error("Please enter a 6-digit PIN.");
                await (verifyFn as (mpin: string) => Promise<void>)(pin);
                setOkMsg("Verified.");
                onClose();
                return;
            }

            if (flow === "set") {
                const p1 = cleanPin(newPin);
                const p2 = cleanPin(confirmPin);
                if (p1.length !== 6) throw new Error("Please enter a 6-digit PIN.");
                if (p1 !== p2) throw new Error("PINs do not match.");
                await (onSetFirstPin as (p: string) => Promise<void>)(p1);
                setOkMsg("PIN set.");
                onClose();
                return;
            }

            const c = cleanPin(currentPin);
            const p1 = cleanPin(newPin);
            const p2 = cleanPin(confirmPin);
            if (c.length !== 6) throw new Error("Please enter your current 6-digit PIN.");
            if (p1.length !== 6) throw new Error("Please enter a new 6-digit PIN.");
            if (p1 !== p2) throw new Error("New PINs do not match.");
            await (onChangePin as (x: ChangePinPayload) => Promise<void>)({
                currentPin: c,
                newPin: p1,
                confirmPin: p2,
            });
            setOkMsg("PIN changed.");
            onClose();
        } catch (e: any) {
            setError(e?.message ?? "Something went wrong.");
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={() => (!saving ? onClose() : null)}
            />

            <div className="relative w-full max-w-md rounded-[2.5rem] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl p-6">
                <div className="text-lg font-extrabold text-slate-900 dark:text-white">{dialogTitle}</div>
                <div className="text-sm text-slate-500 dark:text-neutral-400 mt-1">{dialogSubtitle}</div>

                <div className="mt-5 space-y-3">
                    {flow === "verify" ? (
                        <>
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                                Transaction PIN
                            </label>
                            <input
                                value={currentPin}
                                onChange={(e) => setCurrentPin(cleanPin(e.target.value))}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                className="w-full h-12 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500/40"
                                placeholder="Enter 6-digit PIN"
                                type="password"
                                disabled={saving}
                            />
                        </>
                    ) : (
                        <>
                            {flow === "change" ? (
                                <>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                                        Current PIN
                                    </label>
                                    <input
                                        value={currentPin}
                                        onChange={(e) => setCurrentPin(cleanPin(e.target.value))}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        className="w-full h-12 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500/40"
                                        placeholder="Enter current 6-digit PIN"
                                        type="password"
                                        disabled={saving}
                                    />
                                </>
                            ) : null}

                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                                New PIN
                            </label>
                            <input
                                value={newPin}
                                onChange={(e) => setNewPin(cleanPin(e.target.value))}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                className="w-full h-12 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500/40"
                                placeholder="Enter new 6-digit PIN"
                                type="password"
                                disabled={saving}
                            />

                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                                Confirm new PIN
                            </label>
                            <input
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(cleanPin(e.target.value))}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                className="w-full h-12 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500/40"
                                placeholder="Re-enter new 6-digit PIN"
                                type="password"
                                disabled={saving}
                            />
                        </>
                    )}
                </div>

                {error ? (
                    <div className="mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                ) : null}

                {okMsg ? (
                    <div className="mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{okMsg}</span>
                    </div>
                ) : null}

                <div className="mt-6 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="h-11 px-5 rounded-2xl border border-slate-200 dark:border-neutral-800 font-bold text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handlePrimary}
                        disabled={saving}
                        className="h-11 px-5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {saving ? "Please wait..." : primaryText}
                    </button>
                </div>
            </div>
        </div>
    );
}
