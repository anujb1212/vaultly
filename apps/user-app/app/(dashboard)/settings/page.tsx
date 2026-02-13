"use client";

import { useRouter } from "next/navigation";
import {
    ShieldCheck,
    User,
    LogOut,
    CheckCircle2,
    Globe,
    Camera,
    KeyRound,
    LockKeyhole,
    ChevronRight,
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
    const userId = session?.user?.id;
    const emailVerified = session?.user?.emailVerified === true;
    const pinIsSetFromSession = session?.user?.pinIsSet === true;

    const [pinDialogOpen, setPinDialogOpen] = useState(false);
    const [pwdDialogOpen, setPwdDialogOpen] = useState(false);

    const [pinIsSet, setPinIsSet] = useState(pinIsSetFromSession);
    useEffect(() => setPinIsSet(pinIsSetFromSession), [pinIsSetFromSession]);

    return (
        <div className="w-full relative pb-20 animate-fade-in max-w-4xl mx-auto">
            <div className="mb-8 px-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Settings
                </h1>
                <p className="text-slate-500 dark:text-neutral-400 mt-1">
                    Manage your account details and security.
                </p>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-sm p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-5">
                            <div className="relative group cursor-pointer shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center border border-slate-200 dark:border-neutral-700 overflow-hidden">
                                    <User className="w-7 h-7 text-slate-600 dark:text-neutral-300 group-hover:opacity-50 transition" />
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-[1px]">
                                    <Camera className="w-5 h-5 text-white" />
                                </div>
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                                        {displayName}
                                    </h2>
                                    {emailVerified && (
                                        <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500/10 shrink-0" />
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-neutral-400 font-medium">
                                    <span>{emailVerified ? "Verified Account" : "Email not verified"}</span>
                                    {userId && (
                                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-neutral-700 w-fit">
                                            <span className="font-mono text-slate-600 dark:text-neutral-400">ID: {userId}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => router.push("/settings/security")}
                        className="group relative overflow-hidden bg-slate-900 dark:bg-black rounded-[2rem] p-6 border border-slate-800 dark:border-neutral-800 shadow-xl cursor-pointer flex flex-col justify-center min-h-[140px]"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110 pointer-events-none">
                            <ShieldCheck className="w-32 h-32 rotate-12 text-white" />
                        </div>
                        <div className="relative z-10 flex items-center gap-5">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shrink-0">
                                <ShieldCheck className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-white mb-1">Security Center</h3>
                                <p className="text-slate-400 text-xs leading-relaxed max-w-[200px]">
                                    Active sessions & security log.
                                </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                        onClick={() => setPwdDialogOpen(true)}
                        className="group bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-sm p-6 cursor-pointer hover:border-indigo-500/30 transition-all"
                    >
                        <div className="flex items-start justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                                <KeyRound className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Password</h3>
                            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                Update your login password securely.
                            </p>
                        </div>
                    </div>

                    <div
                        onClick={() => setPinDialogOpen(true)}
                        className="group bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-sm p-6 cursor-pointer hover:border-emerald-500/30 transition-all"
                    >
                        <div className="flex items-start justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                                <LockKeyhole className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${pinIsSet ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                {pinIsSet ? "ACTIVE" : "OFF"}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Transaction PIN</h3>
                            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                Require PIN for transfers and payments.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-sm overflow-hidden flex flex-col justify-center">
                        {[
                            { title: "Default Currency", subtitle: "Indian Rupee (INR)", icon: Globe },
                        ].map((pref, i) => (
                            <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 dark:text-neutral-400 group-hover:bg-white dark:group-hover:bg-neutral-700 transition">
                                        <pref.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">{pref.title}</div>
                                        <div className="text-sm text-slate-500 dark:text-neutral-400">{pref.subtitle}</div>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-slate-400 dark:text-neutral-500 bg-slate-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg group-hover:bg-white dark:group-hover:bg-neutral-700 transition">
                                    INR
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-[2rem] border border-rose-200 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/10 p-6 flex flex-col justify-center items-center text-center">
                        <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-4 uppercase tracking-wider">
                            Session Management
                        </h3>
                        <button
                            onClick={async () => signOut({ callbackUrl: "/" })}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/30 transition shadow-sm"
                        >
                            <LogOut className="w-4 h-4" /> Sign out
                        </button>
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
                subtitle={pinIsSet ? "Enter current PIN, then choose a new PIN." : "Set a 6-digit PIN for sensitive actions."}
                onClose={() => setPinDialogOpen(false)}
                onSetFirstPin={async (newPin) => {
                    const res = await setTransactionPin(newPin);
                    if (!res.success) throw new Error(res.message);
                    setPinDialogOpen(false);
                    setPinIsSet(true);
                    await update();
                }}
                onChangePin={async ({ currentPin, newPin, confirmPin }) => {
                    const res = await changeTransactionPin({ currentPin, newPin, confirmPin });
                    if (!res.success) throw new Error(res.message);
                    setPinDialogOpen(false);
                    setPinIsSet(true);
                    await update();
                }}
            />
        </div>
    );
}
