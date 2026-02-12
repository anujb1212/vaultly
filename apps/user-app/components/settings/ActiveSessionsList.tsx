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
        <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-sm overflow-hidden flex flex-col w-full">
            <div className="p-8 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                        <Monitor className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <div className="font-bold text-lg text-slate-900 dark:text-white">
                            Active Sessions
                        </div>
                        <div className="text-sm text-slate-500 dark:text-neutral-400">
                            Devices currently logged in
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleRevokeAll}
                    className="h-9 px-4 rounded-xl border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 font-bold text-xs hover:bg-white dark:hover:bg-neutral-800 transition"
                >
                    Revoke all other
                </button>
            </div>

            {/* Scrollable Area */}
            <div className="p-6 space-y-3 overflow-y-auto custom-scrollbar">
                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm font-semibold">
                        {error}
                    </div>
                )}
                {!sessionsLoaded ? (
                    <div className="p-5 text-sm text-slate-500">Loading...</div>
                ) : sessions.length === 0 ? (
                    <div className="p-5 text-sm text-slate-500">No active sessions.</div>
                ) : (
                    sessions.map((s) => (
                        <div
                            key={s.id}
                            className="p-4 rounded-2xl bg-white/40 dark:bg-neutral-900/40 border border-slate-200/50 dark:border-neutral-800 flex items-center justify-between gap-4 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className={`w-2.5 h-2.5 rounded-full ${s.isCurrent
                                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                        : "bg-indigo-500"
                                        }`}
                                />
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                                        {s.deviceLabel || (s.userAgent ? "Browser Session" : "Session")}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                                        {s.isCurrent ? "This device" : "Active"}
                                        {" - "}
                                        {s.lastSeenAt ? new Date(s.lastSeenAt).toLocaleString() : "Unknown"}
                                    </div>
                                </div>
                            </div>
                            {!s.isCurrent && (
                                <button
                                    onClick={() => handleRevoke(s.id)}
                                    className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                                >
                                    Revoke
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
