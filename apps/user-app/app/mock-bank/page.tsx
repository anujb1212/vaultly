"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, SlidersHorizontal, User as UserIcon, Wrench } from "lucide-react";

type Scenario = "success" | "failure" | "chaos-slow" | "chaos-duplicate" | "chaos-race";
type Mode = "user" | "dev";

const scenarios: Array<{ key: Scenario; label: string; hint: string }> = [
    { key: "success", label: "Approve", hint: "Payment succeeds normally." },
    { key: "failure", label: "Decline", hint: "Simulate a failed payment." },
    { key: "chaos-slow", label: "Slow", hint: "Delays webhook delivery." },
    { key: "chaos-duplicate", label: "Duplicate", hint: "Sends duplicate webhooks." },
    { key: "chaos-race", label: "Race", hint: "Concurrent deliveries." },
];

function formatINR(paise: number) {
    const rupees = paise / 100;
    return rupees.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function MockBankPage() {
    const router = useRouter();
    const params = useSearchParams();

    const token = params.get("token") ?? "";
    const provider = params.get("provider") ?? "Vaultly Bank";
    const userId = params.get("userId") ?? "";
    const amountRaw = params.get("amount") ?? "";

    const amount = useMemo(() => {
        const n = Number(amountRaw);
        return Number.isFinite(n) ? n : NaN;
    }, [amountRaw]);

    const isValid = token.length > 0 && userId.length > 0 && Number.isFinite(amount) && amount > 0;

    const [mode, setMode] = useState<Mode>("user");
    const [scenario, setScenario] = useState<Scenario>("success");

    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<"idle" | "ok" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState<string>("");

    const gatewayBase =
        process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/$/, "") || "http://localhost:3004";

    async function onAuthorize() {
        if (!isValid || submitting) return;

        const effectiveScenario: Scenario = mode === "user" ? "success" : scenario;

        setSubmitting(true);
        setResult("idle");
        setErrorMsg("");

        try {
            const res = await fetch(`${gatewayBase}/api/process-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    user_identifier: String(userId),
                    amount: Number(amount),
                    scenario: effectiveScenario,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.message ?? `Gateway returned ${res.status}`);
            }

            setResult("ok");

            if (effectiveScenario === "chaos-slow") return;

            setTimeout(() => router.push(`/dashboard?onramp=1&token=${encodeURIComponent(token)}`), 600);
        } catch (e: any) {
            setResult("error");
            setErrorMsg(e?.message ?? "Payment could not be processed.");
        } finally {
            setSubmitting(false);
        }
    }

    const payLabel = useMemo(() => {
        if (submitting) return "Processing...";
        return `Pay ₹${formatINR(amount)}`;
    }, [submitting, amount]);

    if (!isValid) return null;

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900 selection:bg-indigo-100">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50 to-transparent" />

            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm mb-4">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                Secure Gateway
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">{provider}</h1>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
                        {/* Mode toggle */}
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-2 text-slate-600">
                                <SlidersHorizontal className="w-4 h-4" />
                                <span className="text-xs font-semibold uppercase tracking-wide">Mode</span>
                            </div>

                            <div className="inline-flex rounded-xl border border-slate-200 bg-white overflow-hidden">
                                <button
                                    onClick={() => setMode("user")}
                                    className={`px-3 py-2 text-xs font-bold inline-flex items-center gap-2 ${mode === "user" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                    type="button"
                                >
                                    <UserIcon className="w-4 h-4" />
                                    User
                                </button>
                                <button
                                    onClick={() => setMode("dev")}
                                    className={`px-3 py-2 text-xs font-bold inline-flex items-center gap-2 ${mode === "dev" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                    type="button"
                                >
                                    <Wrench className="w-4 h-4" />
                                    Dev
                                </button>
                            </div>
                        </div>

                        <div className="text-center border-b border-slate-100 pb-6 mb-6">
                            <p className="text-slate-500 text-sm mb-1">Total Payable</p>
                            <div className="text-5xl font-bold tracking-tight text-slate-900">
                                ₹{formatINR(amount)}
                            </div>

                            {mode === "dev" ? (
                                <p className="text-xs text-slate-400 mt-2 font-mono break-all">
                                    userId: {userId} - token: {token}
                                </p>
                            ) : (
                                <p className="text-xs text-slate-400 mt-2 font-mono">Reference: {userId}</p>
                            )}
                        </div>

                        {/* Dev-only simulation controls */}
                        {mode === "dev" ? (
                            <div className="mb-6">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">
                                    Simulation Mode
                                </label>

                                <div className="grid grid-cols-2 gap-2">
                                    {scenarios.map((s) => (
                                        <button
                                            key={s.key}
                                            onClick={() => setScenario(s.key)}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all border ${scenario === s.key
                                                ? "bg-slate-900 text-white border-slate-900"
                                                : "bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300"
                                                }`}
                                            type="button"
                                            title={s.hint}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="mt-3 text-xs text-slate-500">{scenarios.find((s) => s.key === scenario)?.hint}</div>
                            </div>
                        ) : null}

                        {result === "error" ? (
                            <div className="mb-6 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl flex items-center gap-2">
                                <XCircle className="w-4 h-4" />
                                <span className="font-semibold">{errorMsg}</span>
                            </div>
                        ) : null}

                        {result === "ok" ? (
                            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="font-semibold">Authorized. Redirecting...</span>
                            </div>
                        ) : null}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={onAuthorize}
                                disabled={submitting}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${submitting ? "bg-slate-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                                    }`}
                            >
                                {payLabel}
                            </button>

                            <button
                                onClick={() => router.push("/dashboard")}
                                disabled={submitting}
                                className="w-full py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition"
                            >
                                Cancel Transaction
                            </button>
                        </div>
                    </div>

                    <div className="text-center mt-8 text-xs text-slate-400">
                        <span className="font-semibold">Vaultly Secure</span> - 256-bit SSL Encrypted
                    </div>
                </div>
            </div>
        </div>
    );
}
