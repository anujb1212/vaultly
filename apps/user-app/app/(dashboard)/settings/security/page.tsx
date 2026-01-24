"use client";

import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    KeyRound,
    Smartphone,
    Monitor,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getTransactionPinStatus } from "../../../lib/actions/getTransactionPinStatus";
import { setTransactionPin } from "../../../lib/actions/setTransactionPin";
import { listUserSessions } from "../../../lib/actions/listUserSessions";
import { revokeUserSession } from "../../../lib/actions/revokeUserSession";
import { revokeOtherUserSessions } from "../../../lib/actions/revokeOtherUserSessions";

function StatusBadge({ enabled }: { enabled: boolean }) {
    if (enabled) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-slate-50 text-slate-600 border-slate-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
            <AlertCircle className="w-3.5 h-3.5" /> Not Set
        </span>
    );
}

export default function SecuritySettingsPage() {
    const router = useRouter();

    const [pinLoaded, setPinLoaded] = useState(false);
    const [pinIsSet, setPinIsSet] = useState(false);
    const [pinLockedUntil, setPinLockedUntil] = useState<string | null>(null);

    const [pinDialogOpen, setPinDialogOpen] = useState(false);
    const [pinInput, setPinInput] = useState("");
    const [pinSaving, setPinSaving] = useState(false);
    const [pinError, setPinError] = useState<string | null>(null);
    const [sessionsLoaded, setSessionsLoaded] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [sessionsError, setSessionsError] = useState<string | null>(null);

    async function refreshSessions() {
        setSessionsError(null);
        const res = await listUserSessions();
        if (!res.success) {
            setSessionsLoaded(true);
            setSessionsError(res.message || "Failed to load sessions");
            return;
        }
        setSessions(res.sessions);
        setSessionsLoaded(true);
    }

    useEffect(() => {
        refreshSessions();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await getTransactionPinStatus();
                if (res.success) {
                    setPinIsSet(res.isSet);
                    setPinLockedUntil(res.lockedUntil);
                }
            } finally {
                setPinLoaded(true);
            }
        })();
    }, []);

    const pinLockedMsg = useMemo(() => {
        if (!pinLockedUntil) return null;
        const dt = new Date(pinLockedUntil);
        if (Number.isNaN(dt.getTime())) return null;
        return `Locked until ${dt.toLocaleString()}`;
    }, [pinLockedUntil]);

    return (
        <div className="w-full relative">
            {/* Background Effect */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:6rem_4rem]">
                <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)] dark:bg-[radial-gradient(circle_800px_at_100%_200px,#312e81,transparent)] opacity-20 dark:opacity-40" />
            </div>

            <div className="mb-8">
                <button
                    onClick={() => router.push("/settings")}
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition mb-6"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Settings
                </button>

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Security Center
                        </h1>
                        <p className="text-slate-500 dark:text-neutral-400 mt-2 font-medium">
                            Manage 2FA, transaction PIN, and active sessions.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- LEFT COLUMN --- */}
                <div className="lg:col-span-2 space-y-8">
                    {/* 2FA Card */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-neutral-800 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                                    <Smartphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-slate-900 dark:text-white">
                                        Two‑Factor Authentication
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-neutral-400">
                                        TOTP (Google Authenticator)
                                    </div>
                                </div>
                            </div>
                            <StatusBadge enabled={false} />
                        </div>

                        <div className="p-8 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
                            <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-lg leading-relaxed">
                                Add an extra layer of security. We’ll ask for a code from your
                                authenticator app when you sign in from a new device.
                            </p>
                            <button className="h-12 px-8 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition shadow-lg">
                                Enable 2FA
                            </button>
                        </div>
                    </div>

                    {/* Transaction PIN Card */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-neutral-800 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-neutral-700">
                                    <KeyRound className="w-6 h-6 text-slate-700 dark:text-neutral-200" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-slate-900 dark:text-white">
                                        Transaction PIN
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-neutral-400">
                                        Required for money movement
                                    </div>
                                </div>
                            </div>
                            <StatusBadge enabled={pinLoaded ? pinIsSet : false} />
                        </div>

                        <div className="p-8 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-lg leading-relaxed">
                                    A 6-digit PIN required to authorize transfers. This protects
                                    your funds even if your account is logged in.
                                </p>
                                {pinLockedMsg && (
                                    <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-3">
                                        {pinLockedMsg}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    if (pinIsSet) return;
                                    setPinError(null);
                                    setPinInput("");
                                    setPinDialogOpen(true);
                                }}
                                disabled={pinSaving || pinIsSet}
                                className="h-12 px-8 rounded-2xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {pinIsSet ? "PIN Set" : "Set PIN"}
                            </button>
                        </div>

                        {pinDialogOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <div
                                    className="absolute inset-0 bg-black/40"
                                    onClick={() => (!pinSaving ? setPinDialogOpen(false) : null)}
                                />
                                <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xl p-6">
                                    <div className="font-bold text-lg text-slate-900 dark:text-white">
                                        Set Transaction PIN
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                        Enter a 6-digit PIN. It will be required for transfers.
                                    </div>

                                    <div className="mt-4">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                                            6-digit PIN
                                        </label>
                                        <input
                                            value={pinInput}
                                            onChange={(e) => {
                                                const next = e.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 6);
                                                setPinInput(next);
                                            }}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={6}
                                            className="mt-2 w-full h-12 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500/40"
                                            placeholder="••••••"
                                            type="password"
                                            disabled={pinSaving}
                                        />
                                    </div>

                                    {pinError && (
                                        <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm font-semibold">
                                            {pinError}
                                        </div>
                                    )}

                                    <div className="mt-5 flex gap-3 justify-end">
                                        <button
                                            onClick={() => setPinDialogOpen(false)}
                                            disabled={pinSaving}
                                            className="h-11 px-5 rounded-2xl border border-slate-200 dark:border-neutral-800 font-bold text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            onClick={async () => {
                                                setPinError(null);
                                                setPinSaving(true);
                                                try {
                                                    const res = await setTransactionPin(pinInput);
                                                    if (!res.success) {
                                                        setPinError(res.message);
                                                        return;
                                                    }

                                                    const status = await getTransactionPinStatus();
                                                    if (status.success) {
                                                        setPinIsSet(status.isSet);
                                                        setPinLockedUntil(status.lockedUntil);
                                                    }

                                                    setPinDialogOpen(false);
                                                } finally {
                                                    setPinSaving(false);
                                                }
                                            }}
                                            disabled={pinSaving}
                                            className="h-11 px-5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition"
                                        >
                                            {pinSaving ? "Saving..." : "Save PIN"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Active Sessions*/}
                    <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                    <Monitor className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-slate-900 dark:text-white">Active Sessions</div>
                                    <div className="text-sm text-slate-500 dark:text-neutral-400">Devices currently logged in</div>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    const res = await revokeOtherUserSessions();
                                    if (!res.success) {
                                        setSessionsError(res.message || "Failed to revoke sessions");
                                        return;
                                    }
                                    await refreshSessions();
                                }}
                                className="h-10 px-4 rounded-2xl border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-neutral-800 transition"
                            >
                                Revoke all other sessions
                            </button>
                        </div>

                        <div className="p-6 space-y-3">
                            {sessionsError && (
                                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm font-semibold">
                                    {sessionsError}
                                </div>
                            )}

                            {!sessionsLoaded ? (
                                <div className="p-5 rounded-3xl bg-slate-50/50 dark:bg-neutral-950/50 border border-slate-100 dark:border-neutral-800 text-sm text-slate-500 dark:text-neutral-400">
                                    Loading sessions…
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="p-5 rounded-3xl bg-slate-50/50 dark:bg-neutral-950/50 border border-slate-100 dark:border-neutral-800 text-sm text-slate-500 dark:text-neutral-400">
                                    No sessions found.
                                </div>
                            ) : (
                                sessions.map((s) => (
                                    <div
                                        key={s.id}
                                        className="p-5 rounded-3xl bg-slate-50/50 dark:bg-neutral-950/50 border border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`w-2 h-2 rounded-full ${s.isCurrent
                                                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                                    : s.revokedAt
                                                        ? "bg-slate-300 dark:bg-neutral-700"
                                                        : "bg-indigo-500"
                                                    }`}
                                            />
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">
                                                    {s.deviceLabel || (s.userAgent ? "Browser Session" : "Session")}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                                                    {s.isCurrent ? "This device" : s.revokedAt ? "Revoked" : "Active"} •{" "}
                                                    {s.lastSeenAt ? new Date(s.lastSeenAt).toLocaleString() : "Last seen unknown"}
                                                </div>
                                            </div>
                                        </div>

                                        {!s.isCurrent && !s.revokedAt && (
                                            <button
                                                onClick={async () => {
                                                    const res = await revokeUserSession(s.id);
                                                    if (!res.success) {
                                                        setSessionsError(res.message || "Failed to revoke session");
                                                        return;
                                                    }
                                                    await refreshSessions();
                                                }}
                                                className="h-9 px-4 rounded-xl border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 font-bold text-xs hover:bg-white dark:hover:bg-neutral-800 transition"
                                            >
                                                Revoke
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="space-y-8">
                    {/* Security Health Score Widget */}
                    <div className="bg-slate-900 dark:bg-neutral-900 rounded-[2.5rem] p-8 border border-slate-800 dark:border-neutral-800 shadow-2xl relative overflow-hidden group text-white">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-transparent opacity-50" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800 dark:text-neutral-800" />
                                    <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="377" strokeDashoffset="282" className="text-emerald-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-bold">25%</span>
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Secure</span>
                                </div>
                            </div>


                            <h3 className="text-xl font-bold mb-2">Account Protection</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                Your account is vulnerable. Enable 2FA and set a PIN to reach 100%.
                            </p>


                            <div className="w-full space-y-3 text-left">
                                <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">✓</div>
                                    <span className="text-slate-200">Strong Password</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-white/5 border border-white/10 opacity-50">
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
                                    <span className="text-slate-400">Two-Factor Auth</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-white/5 border border-white/10 opacity-50">
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
                                    <span className="text-slate-400">Transaction PIN</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
