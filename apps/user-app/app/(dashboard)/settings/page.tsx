"use client";

import { useRouter } from "next/navigation";
import { Copy, ChevronRight, ShieldCheck, Bell, User, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

function maskEmail(email?: string | null) {
    if (!email) return "—";
    const [name, domain] = email.split("@");
    if (!domain) return email;
    const maskedName = name.length <= 2 ? `${name[0] ?? ""}*` : `${name.slice(0, 2)}***`;
    return `${maskedName}@${domain}`;
}

export default function SettingsPage() {
    const router = useRouter();
    const { data: session } = useSession();

    const displayName = session?.user?.name || "Vaultly User";
    const email = session?.user?.email || null;
    // TODO: Fetch from DB
    const publicId = session?.user?.id || "6386101131";

    return (
        <div className="w-full relative">
            {/* Background Effect */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:6rem_4rem]">
                <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)] dark:bg-[radial-gradient(circle_800px_at_100%_200px,#312e81,transparent)] opacity-20 dark:opacity-40" />
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-slate-500 dark:text-neutral-400 mt-1 font-medium">
                    Manage your profile, preferences, and security.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- LEFT COLUMN --- */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Profile Card */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center border border-slate-200 dark:border-neutral-700">
                                    <User className="w-6 h-6 text-slate-600 dark:text-neutral-300" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-slate-900 dark:text-white">Profile</div>
                                    <div className="text-sm text-slate-500 dark:text-neutral-400">Basic account info</div>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push("/settings/security")}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white dark:bg-white dark:text-black hover:opacity-90 transition shadow-lg shadow-slate-900/10 dark:shadow-white/5"
                            >
                                Security Center <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition border border-transparent hover:border-slate-100 dark:hover:border-neutral-800">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-500">Name</div>
                                    <div className="mt-1 font-semibold text-slate-900 dark:text-white text-lg">{displayName}</div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition border border-transparent hover:border-slate-100 dark:hover:border-neutral-800">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-500">Email</div>
                                    <div className="mt-1 font-semibold text-slate-900 dark:text-white text-lg">{maskEmail(email)}</div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-500">Public ID</div>
                                    <div className="mt-1 font-mono font-medium text-slate-900 dark:text-white">{publicId}</div>
                                </div>
                                <button
                                    onClick={async () => {
                                        await navigator.clipboard.writeText(publicId);
                                        // Optional: Toast notification here
                                    }}
                                    className="h-10 px-4 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-neutral-700 transition inline-flex items-center gap-2 shadow-sm"
                                >
                                    <Copy className="w-3.5 h-3.5" /> Copy ID
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preferences Card */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <div className="font-bold text-lg text-slate-900 dark:text-white">Preferences</div>
                                <div className="text-sm text-slate-500 dark:text-neutral-400">Notifications & Defaults</div>
                            </div>
                        </div>

                        <div className="p-8 space-y-4">
                            {[
                                { title: "Transaction alerts", subtitle: "Get notified when money moves", enabled: true },
                                { title: "Marketing updates", subtitle: "Product news and tips", enabled: false }
                            ].map((pref, i) => (
                                <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition">
                                    <div>
                                        <div className="font-semibold text-slate-900 dark:text-white">{pref.title}</div>
                                        <div className="text-sm text-slate-500 dark:text-neutral-400">{pref.subtitle}</div>
                                    </div>
                                    {/* Placeholder Toggle */}
                                    <button className={`h-7 w-12 rounded-full relative transition-colors ${pref.enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-neutral-700'}`}>
                                        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${pref.enabled ? 'left-6' : 'left-1'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/20 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-rose-100 dark:border-rose-900/20">
                            <div className="font-bold text-lg text-rose-600 dark:text-rose-400">Danger Zone</div>
                            <div className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                                Irreversible account actions.
                            </div>
                        </div>

                        <div className="p-8 flex flex-col sm:flex-row gap-4">
                            <button
                                className="flex-1 h-12 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/10 transition"
                            >
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

                {/* --- RIGHT COLUMN --- */}
                <div className="space-y-8">
                    <div className="bg-slate-900 dark:bg-neutral-900 rounded-[2.5rem] p-8 border border-slate-800 dark:border-neutral-800 shadow-2xl relative overflow-hidden group text-white">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-10 transition-opacity duration-500">
                            <ShieldCheck className="w-40 h-40 rotate-12" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                <ShieldCheck className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2 tracking-tight">Security</h3>
                            <p className="text-slate-300 leading-relaxed mb-8">
                                Enhance your account protection with 2FA and a Transaction PIN.
                            </p>
                            <button
                                onClick={() => router.push("/settings/security")}
                                className="w-full py-4 px-4 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Open Security Center
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
