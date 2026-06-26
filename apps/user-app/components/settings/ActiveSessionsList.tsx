"use client";

import { useState, useEffect } from "react";
import { Monitor } from "lucide-react";
import { listUserSessions } from "../../app/lib/actions/listUserSessions";
import { revokeUserSession } from "../../app/lib/actions/revokeUserSession";
import { revokeOtherUserSessions } from "../../app/lib/actions/revokeOtherUserSessions";

export function ActiveSessionsList() {
    const [sessionsLoaded, setSessionsLoaded] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    async function refreshSessions() {
        setError(null);
        const res = await listUserSessions();
        if (!res.success) {
            setSessionsLoaded(true);
            setError(res.message || "Failed to load sessions");
            return;
        }
        const activeSessions = (res.sessions || []).filter((s: any) => !s.revokedAt);
        setSessions(activeSessions);
        setSessionsLoaded(true);
    }

    useEffect(() => {
        refreshSessions();
    }, []);

    const handleRevoke = async (sessionId: string) => {
        const previousSessions = [...sessions];

        setSessions((prev) => prev.filter((s) => s.id !== sessionId));

        const res = await revokeUserSession(sessionId);

        if (!res.success) {
            setSessions(previousSessions);
            setError(res.message || "Failed to revoke session");
        }
    };

    const handleRevokeAll = async () => {
        const currentSession = sessions.find(s => s.isCurrent);
        const previousSessions = [...sessions];

        if (currentSession) setSessions([currentSession]);
        else setSessions([]);

        const res = await revokeOtherUserSessions();
        if (!res.success) {
            setSessions(previousSessions);
            setError(res.message || "Failed to revoke sessions");
        } else {
            await refreshSessions();
        }
    };

    return (
        <section className="relative overflow-hidden bg-white dark:bg-[#06020f] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl transition-colors duration-300 flex flex-col w-full isolate">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between gap-4 shrink-0 relative z-10 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shadow-inner">
                        <Monitor className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <div className="font-extrabold text-xl text-slate-900 dark:text-white drop-shadow-sm">
                            Active Sessions
                        </div>
                        <div className="text-sm text-slate-500 dark:text-white/50 font-medium mt-1">
                            Devices currently logged in
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleRevokeAll}
                    className="h-10 px-5 rounded-2xl bg-white dark:bg-[#0a0515] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-extrabold text-xs hover:bg-slate-50 dark:hover:bg-white/5 shadow-sm active:scale-95 transition-all"
                >
                    Revoke all other
                </button>
            </div>

            {/* Scrollable Area */}
            <div className="p-8 space-y-4 overflow-y-auto custom-scrollbar relative z-10">
                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm font-bold border border-rose-100 dark:border-rose-500/20 shadow-sm">
                        {error}
                    </div>
                )}
                {!sessionsLoaded ? (
                    <div className="p-5 text-sm text-slate-500 dark:text-white/40 font-medium">Loading...</div>
                ) : sessions.length === 0 ? (
                    <div className="p-5 text-sm text-slate-500 dark:text-white/40 font-medium">No active sessions.</div>
                ) : (
                    sessions.map((s) => (
                        <div
                            key={s.id}
                            className="p-5 rounded-2xl bg-slate-50/50 dark:bg-[#0a0515] border border-slate-200 dark:border-white/5 flex items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-white/10 shadow-sm"
                        >
                            <div className="flex items-center gap-5">
                                <div
                                    className={`w-3 h-3 rounded-full shrink-0 border-2 ${s.isCurrent
                                        ? "bg-emerald-500 border-emerald-200 dark:border-emerald-900 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                                        : "bg-indigo-500 border-indigo-200 dark:border-indigo-900"
                                        }`}
                                />
                                <div>
                                    <div className="font-extrabold text-slate-900 dark:text-white text-sm drop-shadow-sm">
                                        {s.deviceLabel || (s.userAgent ? "Browser Session" : "Session")}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-white/50 mt-1 font-medium">
                                        {s.isCurrent ? "This device" : "Active"}
                                        <span className="mx-1.5 opacity-50">•</span>
                                        {s.lastSeenAt ? new Date(s.lastSeenAt).toLocaleString() : "Unknown"}
                                    </div>
                                </div>
                            </div>
                            {!s.isCurrent && (
                                <button
                                    onClick={() => handleRevoke(s.id)}
                                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-white px-4 py-2 rounded-xl border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-500 dark:hover:bg-rose-500/20 transition-all active:scale-95 shadow-sm"
                                >
                                    Revoke
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
