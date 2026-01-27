"use client";

import { useEffect, useMemo, useState } from "react";

export function ChangePasswordDialog(props: {
    open: boolean;
    onClose: () => void;
    onConfirm: (payload: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }) => Promise<void>;
}) {
    const { open, onClose, onConfirm } = props;

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErr(null);
        setSaving(false);
    }, [open]);

    const canSubmit = useMemo(() => {
        if (saving) return false;
        if (!currentPassword) return false;
        if (newPassword.trim().length < 8) return false;
        if (confirmPassword.trim().length < 8) return false;
        if (newPassword !== confirmPassword) return false;
        return true;
    }, [saving, currentPassword, newPassword, confirmPassword]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-md"
                onClick={() => (!saving ? onClose() : null)}
            />

            <div className="relative w-full max-w-md rounded-[2.5rem] bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xl p-6">
                <div className="font-bold text-lg text-slate-900 dark:text-white">Change password</div>
                <div className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                    Enter your current password, then set a new one.
                </div>

                <div className="mt-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                            Current password
                        </label>
                        <input
                            value={currentPassword}
                            onChange={(e) => {
                                setCurrentPassword(e.target.value);
                                setErr(null);
                            }}
                            className="mt-2 w-full h-12 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500/40"
                            type="password"
                            disabled={saving}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                            New password
                        </label>
                        <input
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setErr(null);
                            }}
                            className="mt-2 w-full h-12 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500/40"
                            type="password"
                            disabled={saving}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                            Confirm new password
                        </label>
                        <input
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setErr(null);
                            }}
                            className="mt-2 w-full h-12 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500/40"
                            type="password"
                            disabled={saving}
                        />
                    </div>

                    {newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword ? (
                        <div className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                            Passwords do not match
                        </div>
                    ) : null}

                    {err ? (
                        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-sm font-semibold">
                            {err}
                        </div>
                    ) : null}
                </div>

                <div className="mt-6 flex gap-3 justify-end">
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

                            if (newPassword.trim().length < 8) {
                                setErr("New password must be at least 8 characters");
                                return;
                            }
                            if (newPassword !== confirmPassword) {
                                setErr("Passwords do not match");
                                return;
                            }

                            setSaving(true);
                            try {
                                await onConfirm({ currentPassword, newPassword, confirmPassword });
                            } catch (e) {
                                setErr(e instanceof Error ? e.message : "Failed");
                                return;
                            } finally {
                                setSaving(false);
                            }
                        }}
                        disabled={!canSubmit}
                        className="h-11 px-5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-black font-bold hover:opacity-90 transition disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Change password"}
                    </button>
                </div>
            </div>
        </div>
    );
}
