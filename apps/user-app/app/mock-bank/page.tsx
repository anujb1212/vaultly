"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Scenario = "success" | "failure" | "chaos-slow" | "chaos-duplicate" | "chaos-race";

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

    const [scenario, setScenario] = useState<Scenario>("success");
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<"idle" | "ok" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState<string>("");

    // Ensure this URL is correct in your env
    const gatewayBase = process.env.NEXT_PUBLIC_GATEWAY_URL?.replace(/\/$/, "") || "http://localhost:3004";

    async function onAuthorize() {
        if (!isValid || submitting) return;
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
                    scenario,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.message ?? `Gateway returned ${res.status}`);
            }

            setResult("ok");
            if (scenario === "chaos-slow") return;
            // Slightly faster feedback loop
            setTimeout(() => router.push(`/dashboard?onramp=1&token=${encodeURIComponent(token)}`), 600);
        } catch (e: any) {
            setResult("error");
            setErrorMsg(e?.message ?? "Payment could not be processed.");
        } finally {
            setSubmitting(false);
        }
    }

    if (!isValid) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
                <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 shadow-xl p-8 text-center">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">⚠️</div>
                    <h2 className="text-xl font-bold text-slate-900">Invalid Request</h2>
                    <p className="text-slate-500 mt-2 text-sm">Please initiate payment from the app.</p>
                    <button onClick={() => router.push("/dashboard")} className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-medium">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900 selection:bg-indigo-100">
            {/* Abstract Background */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50 to-transparent"></div>

            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm mb-4">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Secure Gateway</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">{provider}</h1>
                    </div>

                    {/* Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">

                        {/* Amount Display */}
                        <div className="text-center border-b border-slate-100 pb-6 mb-6">
                            <p className="text-slate-500 text-sm mb-1">Total Payable</p>
                            <div className="text-5xl font-bold tracking-tight text-slate-900">
                                ₹{formatINR(amount)}
                            </div>
                            <p className="text-xs text-slate-400 mt-2 font-mono">ID: {userId}</p>
                        </div>

                        {/* Scenarios */}
                        <div className="mb-6">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Simulation Mode</label>
                            <div className="grid grid-cols-2 gap-2">
                                {scenarios.map((s) => (
                                    <button
                                        key={s.key}
                                        onClick={() => setScenario(s.key)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all border ${scenario === s.key
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300'
                                            }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Feedback */}
                        {result === "error" && (
                            <div className="mb-6 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl flex items-center gap-2">
                                <span>❌</span> {errorMsg}
                            </div>
                        )}
                        {result === "ok" && (
                            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-xl flex items-center gap-2">
                                <span>✅</span> Payment Authorized. Redirecting...
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={onAuthorize}
                                disabled={submitting}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-indigo-200 transition-all transform active:scale-95 ${submitting ? 'bg-slate-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                            >
                                {submitting ? "Processing..." : `Pay ₹${formatINR(amount)}`}
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
                        <span className="font-semibold">Vaultly Secure</span> · 256-bit SSL Encrypted
                    </div>
                </div>
            </div>
        </div>
    );
}
