"use client";

import { useRouter } from "next/navigation";
import {
    ShieldCheck,
    Bell,
    User,
    LogOut,
    CheckCircle2,
    ShieldAlert,
    Globe,
    Camera,
    KeyRound,
    LockKeyhole,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { TransactionPinDialog } from "../../../components/dialog/TransactionPinDialog";
import { ChangePasswordDialog } from "../../../components/dialog/ChangePasswordDialog";

import {
    setTransactionPin,
    changeTransactionPin,
} from "../../lib/actions/setTransactionPin";
import { changePassword } from "../../lib/actions/changePassword";

export default function SettingsPage() {
    const router = useRouter();
    const { data: session, update } = useSession();

    const displayName = session?.user?.name || "Vaultly User";
    const emailVerified = session?.user?.emailVerified === true;
    const pinIsSetFromSession = session?.user?.pinIsSet === true;

    const [pinDialogOpen, setPinDialogOpen] = useState(false);
    const [pwdDialogOpen, setPwdDialogOpen] = useState(false);

    const [pinIsSet, setPinIsSet] = useState(pinIsSetFromSession);
    useEffect(() => setPinIsSet(pinIsSetFromSession), [pinIsSetFromSession]);

    return (
        <div className="w-full relative pb-20 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Settings
                </h1>
                <p className="text-slate-500 dark:text-neutral-400 mt-1 font-medium">
                    Manage your profile, preferences, and security.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Card */}
                    <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-200/50 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative group cursor-pointer">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center border border-slate-200 dark:border-neutral-700 overflow-hidden">
                                        <User className="w-7 h-7 text-slate-600 dark:text-neutral-300 group-hover:opacity-50 transition" />
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-[1px]">
                                        <Camera className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold text-xl text-slate-900 dark:text-white">
                                            {displayName}
                                        </div>
                                        {emailVerified && (
                                            <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/10" />
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-neutral-400 font-medium">
                                        {emailVerified ? "Verified Account" : "Email not verified"}
                                    </div>
                                </div>
                            </div>
                            <button className="hidden sm:inline-flex px-4 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-neutral-800 transition">
                                Edit Profile
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Password Box */}
                                <div className="p-5 rounded-3xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-neutral-950/30">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center shadow-sm">
                                            <KeyRound className="w-5 h-5 text-slate-700 dark:text-neutral-200" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white">
                                                Password
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-neutral-400">
                                                Login password
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setPwdDialogOpen(true)}
                                        className="w-full h-10 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-neutral-700 transition shadow-sm"
                                    >
                                        Change
                                    </button>
                                </div>

                                {/* PIN Box */}
                                <div className="p-5 rounded-3xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-neutral-950/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center shadow-sm">
                                                <LockKeyhole className="w-5 h-5 text-slate-700 dark:text-neutral-200" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    PIN
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-neutral-400">
                                                    Transactions
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${pinIsSet
                                                ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/40"
                                                : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                                                }`}
                                        >
                                            {pinIsSet ? "ON" : "OFF"}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setPinDialogOpen(true)}
                                        className="w-full h-10 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-neutral-700 transition shadow-sm"
                                    >
                                        {pinIsSet ? "Change PIN" : "Set PIN"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preferences Card */}
                    <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-200/50 dark:border-white/5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                                <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <div className="font-bold text-lg text-slate-900 dark:text-white">
                                    Preferences
                                </div>
                                <div className="text-sm text-slate-500 dark:text-neutral-400">
                                    Notifications & Defaults
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-1">
                            {[
                                {
                                    title: "Transaction alerts",
                                    subtitle: "Push notifications for money movement",
                                    enabled: true,
                                    icon: Bell,
                                },
                                {
                                    title: "Default Currency",
                                    subtitle: "Indian Rupee (INR)",
                                    enabled: null,
                                    icon: Globe,
                                },
                            ].map((pref, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between rounded-2xl p-4 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 dark:text-neutral-400 group-hover:bg-white dark:group-hover:bg-neutral-700 transition">
                                            <pref.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900 dark:text-white">
                                                {pref.title}
                                            </div>
                                            <div className="text-sm text-slate-500 dark:text-neutral-400">
                                                {pref.subtitle}
                                            </div>
                                        </div>
                                    </div>

                                    {pref.enabled !== null ? (
                                        <div
                                            className={`w-12 h-7 rounded-full relative transition-colors duration-200 ease-in-out ${pref.enabled
                                                ? "bg-indigo-600"
                                                : "bg-slate-200 dark:bg-neutral-700"
                                                }`}
                                        >
                                            <div
                                                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${pref.enabled ? "translate-x-6" : "translate-x-1"
                                                    }`}
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase">
                                            Change
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="rounded-[2.5rem] border border-rose-200 dark:border-rose-900/30 overflow-hidden bg-rose-50/30 dark:bg-rose-900/10 backdrop-blur-sm">
                        <div className="p-8 border-b border-rose-200/50 dark:border-rose-900/20 flex items-center gap-3">
                            <ShieldAlert className="w-6 h-6 text-rose-600" />
                            <div>
                                <div className="font-bold text-lg text-rose-700 dark:text-rose-400">
                                    Danger Zone
                                </div>
                                <div className="text-sm text-rose-600/80 dark:text-rose-400/60">
                                    Irreversible account actions
                                </div>
                            </div>
                        </div>

                        <div className="p-8 flex flex-col sm:flex-row gap-4">
                            <button className="flex-1 h-12 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 font-bold bg-white/50 dark:bg-transparent hover:bg-rose-100/50 dark:hover:bg-rose-900/20 transition">
                                Sign out all devices
                            </button>

                            <button
                                onClick={async () => signOut({ callbackUrl: "/" })}
                                className="flex-1 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition inline-flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
                            >
                                <LogOut className="w-4 h-4" /> Sign out
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-8">
                    <div
                        onClick={() => router.push("/settings/security")}
                        className="group relative overflow-hidden bg-slate-900 dark:bg-neutral-900 rounded-[2.5rem] p-8 border border-slate-800 dark:border-neutral-800 shadow-2xl text-white cursor-pointer"
                    >
                        {/* Hover Effect */}
                        <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
                            <ShieldCheck className="w-40 h-40 rotate-12" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                                <ShieldCheck className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 tracking-tight">
                                Security Center
                            </h3>
                            <p className="text-slate-300 leading-relaxed mb-8">
                                Enhance your account protection with 2FA, PIN, and active
                                session management.
                            </p>
                            <div className="w-full py-4 px-4 bg-white hover:bg-indigo-50 text-slate-900 rounded-2xl text-sm font-bold transition-all text-center">
                                Open Security Center
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ChangePasswordDialog
                open={pwdDialogOpen}
                onClose={() => setPwdDialogOpen(false)}
                onConfirm={async (payload) => {
                    const res = await changePassword(payload);
                    if (!res.success) throw new Error(res.message);
                    setPwdDialogOpen(false);
                    await update();
                }}
            />

            <TransactionPinDialog
                open={pinDialogOpen}
                pinIsSet={pinIsSet}
                title={pinIsSet ? "Change Transaction PIN" : "Set Transaction PIN"}
                subtitle={
                    pinIsSet
                        ? "Enter current PIN, then choose a new PIN."
                        : "Set a 6-digit PIN for sensitive actions."
                }
                onClose={() => setPinDialogOpen(false)}
                onSetFirstPin={async (newPin) => {
                    const res = await setTransactionPin(newPin);
                    if (!res.success) throw new Error(res.message);
                    setPinDialogOpen(false);
                    setPinIsSet(true);
                    await update();
                }}
                onChangePin={async ({ currentPin, newPin, confirmPin }) => {
                    const res = await changeTransactionPin({
                        currentPin,
                        newPin,
                        confirmPin,
                    });
                    if (!res.success) throw new Error(res.message);
                    setPinDialogOpen(false);
                    setPinIsSet(true);
                    await update();
                }}
            />
        </div>
    );
}
