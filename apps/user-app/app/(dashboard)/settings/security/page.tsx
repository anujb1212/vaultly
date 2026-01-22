"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, KeyRound, Smartphone, Monitor, Activity, CheckCircle2, AlertCircle } from "lucide-react";

// Helper for status badges
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
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Security Center</h1>
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
                                    <div className="font-bold text-lg text-slate-900 dark:text-white">Two‑Factor Authentication</div>
                                    <div className="text-sm text-slate-500 dark:text-neutral-400">TOTP (Google Authenticator)</div>
                                </div>
                            </div>
                            <StatusBadge enabled={false} />
                        </div>

                        <div className="p-8 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
                            <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-lg leading-relaxed">
                                Add an extra layer of security. We’ll ask for a code from your authenticator app when you sign in from a new device.
                            </p>
                            <button
                                className="h-12 px-8 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition shadow-lg"
                            >
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
                                    <div className="font-bold text-lg text-slate-900 dark:text-white">Transaction PIN</div>
                                    <div className="text-sm text-slate-500 dark:text-neutral-400">Required for money movement</div>
                                </div>
                            </div>
                            <StatusBadge enabled={false} />
                        </div>

                        <div className="p-8 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
                            <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-lg leading-relaxed">
                                A 4-digit PIN required to authorize transfers. This protects your funds even if your account is logged in.
                            </p>
                            <button className="h-12 px-8 rounded-2xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-800 transition">
                                Set PIN
                            </button>
                        </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                <Monitor className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <div className="font-bold text-lg text-slate-900 dark:text-white">Active Sessions</div>
                                <div className="text-sm text-slate-500 dark:text-neutral-400">Devices currently logged in</div>
                            </div>
                        </div>

                        <div className="p-6 space-y-3">
                            {/* Dynamic List Placeholder */}
                            {[
                                { browser: "Chrome on macOS", location: "Lucknow, IN", current: true },
                                { browser: "Safari on iPhone", location: "Mumbai, IN", current: false },
                            ].map((s, i) => (
                                <div key={i} className="p-5 rounded-3xl bg-slate-50/50 dark:bg-neutral-950/50 border border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${s.current ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-neutral-700'}`} />
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white text-sm">{s.browser}</div>
                                            <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">{s.location} • {s.current ? 'Active Now' : 'Last seen 2h ago'}</div>
                                        </div>
                                    </div>
                                    {!s.current && (
                                        <button className="h-9 px-4 rounded-xl border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 font-bold text-xs hover:bg-white dark:hover:bg-neutral-800 transition">
                                            Revoke
                                        </button>
                                    )}
                                </div>
                            ))}
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
