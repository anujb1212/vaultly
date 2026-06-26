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
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 animate-fade-in">
            <div className="mb-12">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
                    Settings
                </h1>
                <p className="text-slate-500 dark:text-white/60 mt-3 font-medium">
                    Manage your account details and security.
                </p>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="relative overflow-hidden bg-white dark:bg-[#06020f] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl transition-colors duration-300 isolate p-8 flex flex-col justify-center">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="relative group cursor-pointer shrink-0">
                                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 overflow-hidden shadow-inner transition-all group-hover:scale-[0.98]">
                                    <User className="w-8 h-8 text-slate-500 dark:text-white/40 group-hover:opacity-30 transition-opacity" />
                                </div>
                                <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm shadow-xl">
                                    <Camera className="w-6 h-6 text-white drop-shadow-md" />
                                </div>
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white truncate drop-shadow-sm">
                                        {displayName}
                                    </h2>
                                    {emailVerified && (
                                        <CheckCircle2 className="w-5 h-5 text-blue-500 drop-shadow-sm shrink-0" />
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 text-sm text-slate-500 dark:text-white/50 font-bold">
                                    <span>{emailVerified ? "Verified Account" : "Email not verified"}</span>
                                    {userId && (
                                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0a0515] px-3 py-1 rounded-lg border border-slate-200 dark:border-white/5 w-fit shadow-sm">
                                            <span className="font-mono text-slate-600 dark:text-white/60 text-xs">ID: {userId}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section
                        onClick={() => router.push("/settings/security")}
                        className="group relative overflow-hidden bg-slate-900 dark:bg-[#06020f] rounded-[2.5rem] p-8 border border-slate-800 dark:border-white/5 shadow-2xl cursor-pointer flex flex-col justify-center min-h-[160px] isolate transition-all hover:border-indigo-500/30"
                    >
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-500 transform group-hover:scale-110 pointer-events-none group-hover:-rotate-12">
                            <ShieldCheck className="w-32 h-32 rotate-12 text-white drop-shadow-xl" />
                        </div>
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shrink-0 shadow-inner group-hover:bg-white/10 transition-colors">
                                <ShieldCheck className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-extrabold text-white mb-1.5 drop-shadow-sm">Security Center</h3>
                                <p className="text-slate-400 text-sm leading-relaxed max-w-[200px] font-medium">
                                    Active sessions & security log.
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:text-black transition-all">
                                <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-black transition-colors" />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section
                        onClick={() => setPwdDialogOpen(true)}
                        className="group relative overflow-hidden bg-white dark:bg-[#06020f] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl p-8 cursor-pointer hover:border-indigo-500/30 transition-all isolate"
                    >
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[60px] pointer-events-none" />
                        <div className="relative z-10 flex items-start justify-between mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <KeyRound className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 group-hover:bg-indigo-500 group-hover:border-indigo-500 group-hover:text-white transition-all shadow-sm">
                                <ChevronRight className="w-5 h-5 text-slate-500 dark:text-white/50 group-hover:text-white" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-extrabold text-xl text-slate-900 dark:text-white drop-shadow-sm">Password</h3>
                            <p className="text-sm text-slate-500 dark:text-white/50 mt-1.5 font-medium">
                                Update your login password securely.
                            </p>
                        </div>
                    </section>

                    <section
                        onClick={() => setPinDialogOpen(true)}
                        className="group relative overflow-hidden bg-white dark:bg-[#06020f] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl p-8 cursor-pointer hover:border-emerald-500/30 transition-all isolate"
                    >
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[60px] pointer-events-none" />
                        <div className="relative z-10 flex items-start justify-between mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <LockKeyhole className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold border tracking-wider uppercase shadow-sm transition-colors ${pinIsSet ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:border-white/10 dark:text-white/50"}`}>
                                {pinIsSet ? "ACTIVE" : "OFF"}
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-extrabold text-xl text-slate-900 dark:text-white drop-shadow-sm">Transaction PIN</h3>
                            <p className="text-sm text-slate-500 dark:text-white/50 mt-1.5 font-medium">
                                Require PIN for transfers and payments.
                            </p>
                        </div>
                    </section>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="relative overflow-hidden bg-white dark:bg-[#06020f] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl flex flex-col justify-center isolate">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                        {[
                            { title: "Default Currency", subtitle: "Indian Rupee (INR)", icon: Globe },
                        ].map((pref, i) => (
                            <div key={i} className="relative z-10 flex items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition cursor-pointer group border-b border-slate-100 dark:border-white/5 last:border-0">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#0a0515] flex items-center justify-center border border-slate-200 dark:border-white/5 shadow-inner text-slate-500 dark:text-white/40 group-hover:bg-white dark:group-hover:bg-white/10 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-all">
                                        <pref.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="font-extrabold text-slate-900 dark:text-white text-lg drop-shadow-sm">{pref.title}</div>
                                        <div className="text-sm font-medium text-slate-500 dark:text-white/50">{pref.subtitle}</div>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-slate-500 dark:text-white/50 bg-slate-100 dark:bg-[#0a0515] px-4 py-2 rounded-xl border border-slate-200 dark:border-white/5 group-hover:bg-white dark:group-hover:bg-white/10 shadow-sm transition-all tracking-wider">
                                    INR
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className="relative overflow-hidden bg-white dark:bg-[#06020f] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl p-8 flex flex-col justify-center items-center text-center isolate">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-16 w-48 h-48 bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-[60px] pointer-events-none" />
                        
                        <div className="relative z-10 w-full">
                            <h3 className="text-sm font-extrabold text-slate-500 dark:text-white/40 mb-6 uppercase tracking-widest drop-shadow-sm">
                                Session Management
                            </h3>
                            <button
                                onClick={async () => signOut({ callbackUrl: "/" })}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm"
                            >
                                <LogOut className="w-5 h-5" /> Sign out securely
                            </button>
                        </div>
                    </section>
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
