"use client";

import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    KeyRound,
    CheckCircle2,
    AlertCircle,
    Mail,
    Shield,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import { getTransactionPinStatus } from "../../../lib/actions/getTransactionPinStatus";
import { listUserSessions } from "../../../lib/actions/listUserSessions";
import { EmailVerificationDialog } from "../../../../components/dialog/EmailVerificationDialog";
import { sendEmailVerificationOtp } from "../../../lib/actions/sendEmailVerificationOtp";
import { verifyEmailOtp } from "../../../lib/actions/verifyEmailOtp";
import { getEmailVerificationStatus } from "../../../lib/actions/getEmailVerificationStatus";
import { toggle2FA } from "../../../lib/actions/toggle2FA";
import { setTransactionPin, changeTransactionPin } from "../../../lib/actions/setTransactionPin";
import { TransactionPinDialog } from "../../../../components/dialog/TransactionPinDialog";
import { ActiveSessionsList } from "../../../../components/settings/ActiveSessionsList";

function StatusBadge({ enabled }: { enabled: boolean }) {
    if (enabled) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 drop-shadow-sm" /> Enabled
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold border bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-white/50 dark:border-white/10 shadow-sm">
            <AlertCircle className="w-3.5 h-3.5 opacity-80" /> Not set
        </span>
    );
}

export default function SecuritySettingsPage() {
    const router = useRouter();
    const { data: session, update } = useSession();

    const [pinLoaded, setPinLoaded] = useState(false);
    const [pinIsSet, setPinIsSet] = useState(false);
    const [pinLockedUntil, setPinLockedUntil] = useState<string | null>(null);

    const [, setSessionsLoaded] = useState(false);
    const [, setSessions] = useState<any[]>([]);
    const [, setSessionsError] = useState<string | null>(null);

    const [email, setEmail] = useState<string | null>(null);
    const [emailVerified, setEmailVerified] = useState(false);
    const [emailLoading, setEmailLoading] = useState(true);
    const [, setEmailError] = useState<string | null>(null);
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [pinDialogOpen, setPinDialogOpen] = useState(false);

    async function refreshEmailStatus() {
        setEmailLoading(true);
        setEmailError(null);
        const res = await getEmailVerificationStatus();
        if (!res.success) {
            setEmail(null);
            setEmailVerified(false);
            setEmailError(res.message);
            setEmailLoading(false);
            return;
        }
        setEmail(res.email);
        setEmailVerified(res.isVerified);
        setEmailLoading(false);
    }

    useEffect(() => {
        refreshEmailStatus();
        refreshSessions();
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

    async function handleSendOtp(emailInput: string) {
        const res = await sendEmailVerificationOtp(emailInput);
        if (!res.success) {
            const retryHint =
                typeof res.retryAfterSec === "number" && res.retryAfterSec > 0
                    ? ` Try again in ${res.retryAfterSec}s.`
                    : "";
            throw new Error(`${res.message}${retryHint}`);
        }
        return res;
    }

    async function handleVerifyOtp(code: string) {
        return await verifyEmailOtp(code);
    }

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

    const pinLockedMsg = useMemo(() => {
        if (!pinLockedUntil) return null;
        const dt = new Date(pinLockedUntil);
        if (Number.isNaN(dt.getTime())) return null;
        return `Locked until ${dt.toLocaleString()}`;
    }, [pinLockedUntil]);

    const twoFactorEnabled = (session?.user as any)?.twoFactorEnabled ?? false;
    const [toggling2FA, setToggling2FA] = useState(false);
    const [showDisable2FAConfirm, setShowDisable2FAConfirm] = useState(false);

    async function handleToggle2FA() {
        if (twoFactorEnabled) {
            setShowDisable2FAConfirm(true);
            return;
        }
        await doToggle2FA(true);
    }

    async function doToggle2FA(enable: boolean) {
        setToggling2FA(true);
        try {
            const res = await toggle2FA(enable);
            if (res.success) {
                await update();
            }
        } finally {
            setToggling2FA(false);
        }
    }

    const securityEnabledCount = useMemo(
        () => [twoFactorEnabled, emailVerified, pinIsSet].filter(Boolean).length,
        [twoFactorEnabled, emailVerified, pinIsSet]
    );
    const securityScore = useMemo(
        () => Math.round((securityEnabledCount / 3) * 100),
        [securityEnabledCount]
    );
    const circleDasharray = 377;
    const circleDashoffset = useMemo(
        () => Math.round(circleDasharray * (1 - securityScore / 100)),
        [securityScore]
    );

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 animate-fade-in relative">
            <div className="mb-12">
                <button
                    onClick={() => router.push("/settings")}
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white transition-colors mb-8 group bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-sm active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Settings
                </button>

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
                            Security Center
                        </h1>
                        <p className="text-slate-500 dark:text-white/60 mt-3 font-medium">
                            Manage 2FA, transaction PIN, and active sessions.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Two-Factor Authentication Card */}
                    <section className="relative overflow-hidden bg-white dark:bg-[#06020f] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl transition-colors duration-300 isolate">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 bg-slate-50/50 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
                                    <Shield className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <div className="font-extrabold text-xl text-slate-900 dark:text-white drop-shadow-sm">
                                        Two-Factor Authentication
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-white/50 font-medium mt-1">
                                        Add an extra layer of security to your account
                                    </div>
                                </div>
                            </div>
                            <StatusBadge enabled={twoFactorEnabled} />
                        </div>

                        <div className="p-8 flex flex-col md:flex-row gap-8 md:items-center md:justify-between relative z-10">
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 dark:text-white/60 max-w-lg leading-relaxed font-medium">
                                    When enabled, you'll need to enter a one-time code sent to your
                                    email each time you sign in. This protects your account even if
                                    your password is compromised.
                                </p>
                            </div>
                            <button
                                onClick={handleToggle2FA}
                                disabled={toggling2FA || (!twoFactorEnabled && !emailVerified)}
                                className={`h-12 px-8 rounded-2xl font-extrabold transition-all shadow-sm flex items-center justify-center active:scale-95 ${
                                    twoFactorEnabled
                                        ? "bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:-translate-y-0.5"
                                        : emailVerified
                                        ? "bg-slate-900 text-white dark:bg-white dark:text-black hover:opacity-90 hover:-translate-y-0.5"
                                        : "bg-slate-300 dark:bg-white/5 text-white dark:text-white/30 border border-transparent dark:border-white/10 cursor-not-allowed"
                                }`}
                            >
                                {toggling2FA
                                    ? "Updating..."
                                    : twoFactorEnabled
                                    ? "Disable 2FA"
                                    : emailVerified
                                    ? "Enable 2FA"
                                    : "Verify email first"
                                }
                            </button>
                        </div>
                    </section>

                    {/* Email verification */}
                    <section className="relative overflow-hidden bg-white dark:bg-[#06020f] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl transition-colors duration-300 isolate">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 bg-slate-50/50 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-slate-50 dark:bg-[#0a0515] rounded-2xl flex items-center justify-center border border-slate-100 dark:border-white/5 shadow-inner">
                                    <Mail className="w-7 h-7 text-slate-700 dark:text-white/80" />
                                </div>
                                <div>
                                    <div className="font-extrabold text-xl text-slate-900 dark:text-white drop-shadow-sm">
                                        Email verification
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-white/50 font-medium mt-1">
                                        Verify your email for account security
                                    </div>
                                </div>
                            </div>
                            <StatusBadge enabled={emailVerified} />
                        </div>

                        <div className="p-8 flex flex-col md:flex-row gap-8 md:items-center md:justify-between relative z-10">
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 dark:text-white/60 max-w-lg leading-relaxed font-medium">
                                    We will send a 6-digit code to your inbox. Enter the code to
                                    verify your email address.
                                </p>
                                {email && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0a0515] border border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-white/60 mt-4 font-bold shadow-sm">
                                        <Mail className="w-3.5 h-3.5" /> {email}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setShowEmailDialog(true)}
                                disabled={emailLoading || emailVerified}
                                className="h-12 px-8 rounded-2xl bg-white dark:bg-[#0a0515] border border-slate-200 dark:border-white/10 font-extrabold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
                            >
                                {emailVerified ? "Verified" : "Send code"}
                            </button>
                        </div>
                    </section>

                    {showEmailDialog && (
                        <EmailVerificationDialog
                            initialEmail={email}
                            onSend={handleSendOtp}
                            onVerify={handleVerifyOtp}
                            onClose={() => setShowEmailDialog(false)}
                            onVerified={() => {
                                refreshEmailStatus();
                                setShowEmailDialog(false);
                            }}
                        />
                    )}

                    {/* Transaction PIN Card */}
                    <section className="relative overflow-hidden bg-white dark:bg-[#06020f] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl transition-colors duration-300 isolate">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 bg-slate-50/50 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shadow-inner">
                                    <KeyRound className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <div className="font-extrabold text-xl text-slate-900 dark:text-white drop-shadow-sm">
                                        Transaction PIN
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-white/50 font-medium mt-1">
                                        Required for money movement
                                    </div>
                                </div>
                            </div>
                            <StatusBadge enabled={pinLoaded ? pinIsSet : false} />
                        </div>

                        <div className="p-8 flex flex-col md:flex-row gap-8 md:items-center md:justify-between relative z-10">
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 dark:text-white/60 max-w-lg leading-relaxed font-medium">
                                    A 6-digit PIN required to authorize transfers. This protects
                                    your funds even if your account is logged in.
                                </p>
                                {pinLockedMsg && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 mt-4 font-bold shadow-sm">
                                        <AlertCircle className="w-3.5 h-3.5" /> {pinLockedMsg}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setPinDialogOpen(true)}
                                disabled={!pinLoaded}
                                className="h-12 px-8 rounded-2xl bg-white dark:bg-[#0a0515] border border-slate-200 dark:border-white/10 font-extrabold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
                            >
                                {pinIsSet ? "Change PIN" : "Set PIN"}
                            </button>
                        </div>
                    </section>

                    <TransactionPinDialog
                        open={pinDialogOpen}
                        onClose={() => setPinDialogOpen(false)}
                        pinIsSet={pinIsSet}
                        onSetFirstPin={async (newPin) => {
                            const res = await setTransactionPin(newPin);
                            if (!res.success) throw new Error(res.message);
                            setPinDialogOpen(false);
                            setPinIsSet(true);
                        }}
                        onChangePin={async ({ currentPin, newPin, confirmPin }) => {
                            const res = await changeTransactionPin({ currentPin, newPin, confirmPin });
                            if (!res.success) throw new Error(res.message);
                            setPinDialogOpen(false);
                        }}
                    />

                    {/* Active Sessions */}
                    <ActiveSessionsList />
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="space-y-8">
                    {/* Security Health Score Widget */}
                    <section className="bg-slate-900 dark:bg-[#06020f] rounded-[2.5rem] p-8 border border-slate-800 dark:border-white/5 shadow-2xl relative overflow-hidden group text-white isolate transition-colors duration-300">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />
                        
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="relative w-40 h-40 flex items-center justify-center mb-8 drop-shadow-xl">
                                <svg
                                    className="w-full h-full transform -rotate-90"
                                    viewBox="0 0 128 128"
                                >
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="60"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="transparent"
                                        className="text-slate-800 dark:text-white/5"
                                    />
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="60"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={circleDasharray}
                                        strokeDashoffset={circleDashoffset}
                                        className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-extrabold tracking-tight drop-shadow-sm">{securityScore}%</span>
                                    <span className="text-[10px] text-slate-400 dark:text-white/50 font-bold uppercase tracking-widest mt-1">
                                        Secure
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-2xl font-extrabold mb-3 drop-shadow-sm">Account Protection</h3>
                            <p className="text-slate-400 dark:text-white/60 text-sm mb-8 leading-relaxed px-2 font-medium">
                                Improve security by enabling 2FA, verifying your email, and setting
                                a transaction PIN.
                            </p>

                            <div className="w-full space-y-3 text-left">
                                {[
                                    {
                                        label: "Two-Factor Auth",
                                        check: twoFactorEnabled,
                                    },
                                    {
                                        label: "Email Verified",
                                        check: emailVerified,
                                    },
                                    {
                                        label: "Transaction PIN",
                                        check: pinIsSet,
                                    },
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-4 text-sm p-4 rounded-2xl bg-white/5 dark:bg-[#0a0515] border border-white/10 dark:border-white/5 shadow-sm transition-all ${item.check ? "" : "opacity-50"
                                            }`}
                                    >
                                        {item.check ? (
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow-sm" />
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full border-2 border-slate-600 dark:border-white/20 shrink-0" />
                                        )}
                                        <span
                                            className={`font-bold ${item.check ? "text-slate-200 dark:text-white drop-shadow-sm" : "text-slate-400 dark:text-white/40"}`}
                                        >
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {showDisable2FAConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4 animate-in fade-in">
                    <div className="w-full max-w-md bg-white dark:bg-[#06020f] rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl p-8 isolate relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay dark:mix-blend-soft-light pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-100 dark:border-rose-500/20 mb-6 shadow-inner">
                                <Shield className="w-8 h-8 text-rose-600 dark:text-rose-400 drop-shadow-sm" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3 drop-shadow-sm">
                                Disable two-factor authentication?
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-white/60 leading-relaxed mb-8 font-medium px-2">
                                Your account will no longer require a verification code
                                at sign-in, making it <span className="font-extrabold text-rose-600 dark:text-rose-400">less secure</span>.
                                Only do this if you're having trouble with your
                                authenticator method.
                            </p>
                            <div className="w-full flex gap-4">
                                <button
                                    onClick={() => setShowDisable2FAConfirm(false)}
                                    className="flex-1 h-12 rounded-2xl bg-slate-100 dark:bg-[#0a0515] border border-slate-200 dark:border-white/10 font-extrabold text-sm text-slate-700 dark:text-white/80 hover:bg-slate-200 dark:hover:bg-white/5 transition-all shadow-sm active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        setShowDisable2FAConfirm(false);
                                        await doToggle2FA(false);
                                    }}
                                    disabled={toggling2FA}
                                    className="flex-1 h-12 rounded-2xl bg-rose-600 text-white font-extrabold text-sm hover:bg-rose-700 transition-all disabled:opacity-50 shadow-md hover:-translate-y-0.5 active:scale-95"
                                >
                                    {toggling2FA ? "Disabling..." : "Yes, disable"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
