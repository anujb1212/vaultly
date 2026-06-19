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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-slate-50 text-slate-600 border-slate-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
            <AlertCircle className="w-3.5 h-3.5" /> Not set
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
        <div className="w-full relative pb-20 animate-fade-in">
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
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Two-Factor Authentication Card */}
                    <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-200/50 dark:border-white/5 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                                    <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-slate-900 dark:text-white">
                                        Two-Factor Authentication
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-neutral-400">
                                        Add an extra layer of security to your account
                                    </div>
                                </div>
                            </div>
                            <StatusBadge enabled={twoFactorEnabled} />
                        </div>

                        <div className="p-8 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-lg leading-relaxed">
                                    When enabled, you'll need to enter a one-time code sent to your
                                    email each time you sign in. This protects your account even if
                                    your password is compromised.
                                </p>
                            </div>
                            <button
                                onClick={handleToggle2FA}
                                disabled={toggling2FA || (!twoFactorEnabled && !emailVerified)}
                                className={`h-12 px-8 rounded-2xl font-bold transition shadow-sm ${
                                    twoFactorEnabled
                                        ? "bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20"
                                        : emailVerified
                                        ? "bg-slate-900 text-white dark:bg-white dark:text-black hover:opacity-90"
                                        : "bg-slate-300 dark:bg-neutral-700 text-white dark:text-neutral-400 cursor-not-allowed"
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
                    </div>

                    {/* Email verification */}
                    <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-200/50 dark:border-white/5 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-neutral-700">
                                    <Mail className="w-6 h-6 text-slate-700 dark:text-neutral-200" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-slate-900 dark:text-white">
                                        Email verification
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-neutral-400">
                                        Verify your email for account security
                                    </div>
                                </div>
                            </div>
                            <StatusBadge enabled={emailVerified} />
                        </div>

                        <div className="p-8 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-lg leading-relaxed">
                                    We will send a 6-digit code to your inbox. Enter the code to
                                    verify your email address.
                                </p>
                                {email && (
                                    <div className="text-xs text-slate-500 dark:text-neutral-400 mt-3 font-semibold">
                                        Email: {email}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setShowEmailDialog(true)}
                                disabled={emailLoading || emailVerified}
                                className="h-12 px-8 rounded-2xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-800 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                            >
                                {emailVerified ? "Verified" : "Send code"}
                            </button>
                        </div>
                    </div>

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
                    <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-200/50 dark:border-white/5 flex items-start justify-between gap-4">
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
                                onClick={() => setPinDialogOpen(true)}
                                disabled={!pinLoaded}
                                className="h-12 px-8 rounded-2xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-neutral-800 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                            >
                                {pinIsSet ? "Change PIN" : "Set PIN"}
                            </button>
                        </div>
                    </div>

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
                    <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-8 border border-slate-800 dark:border-neutral-800 shadow-2xl relative overflow-hidden group text-white">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-transparent opacity-50" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                                <svg
                                    className="w-full h-full transform -rotate-90"
                                    viewBox="0 0 128 128"
                                >
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="60"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-slate-800 dark:text-neutral-800"
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
                                        className="text-emerald-500 transition-all duration-1000 ease-out"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-bold">{securityScore}%</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                        Secure
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-2">Account Protection</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed px-2">
                                Improve security by enabling 2FA, verifying your email, and setting
                                a transaction PIN.
                            </p>

                            <div className="w-full space-y-2 text-left">
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
                                        className={`flex items-center gap-3 text-sm p-3 rounded-xl bg-white/5 border border-white/10 ${item.check ? "" : "opacity-40"
                                            }`}
                                    >
                                        {item.check ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
                                        )}
                                        <span
                                            className={item.check ? "text-slate-200" : "text-slate-400"}
                                        >
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showDisable2FAConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-[2rem] border border-slate-200 dark:border-neutral-800 shadow-2xl p-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-100 dark:border-rose-500/20 mb-5">
                                <Shield className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                                Disable two-factor authentication?
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-neutral-400 leading-relaxed mb-6">
                                Your account will no longer require a verification code
                                at sign-in, making it <span className="font-bold text-rose-600 dark:text-rose-400">less secure</span>.
                                Only do this if you're having trouble with your
                                authenticator method.
                            </p>
                            <div className="w-full flex gap-3">
                                <button
                                    onClick={() => setShowDisable2FAConfirm(false)}
                                    className="flex-1 h-11 rounded-2xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 font-bold text-sm text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        setShowDisable2FAConfirm(false);
                                        await doToggle2FA(false);
                                    }}
                                    disabled={toggling2FA}
                                    className="flex-1 h-11 rounded-2xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition disabled:opacity-50"
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
