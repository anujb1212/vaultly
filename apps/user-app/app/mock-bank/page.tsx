"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Scenario = "success" | "failure" | "chaos-slow" | "chaos-duplicate" | "chaos-race";

const scenarios: Array<{ key: Scenario; label: string; hint: string }> = [
    { key: "success", label: "Approve", hint: "Payment succeeds normally." },
    { key: "failure", label: "Decline", hint: "Simulate a failed payment." },
    { key: "chaos-slow", label: "Slow", hint: "Delays webhook delivery." },
    { key: "chaos-duplicate", label: "Duplicate", hint: "Sends duplicate webhooks." },
    { key: "chaos-race", label: "Race", hint: "Concurrent deliveries / ordering issues." },
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

            setTimeout(() => router.push(`/dashboard?onramp=1&token=${encodeURIComponent(token)}`), 600);
        } catch (e: any) {
            setResult("error");
            setErrorMsg(e?.message ?? "Payment could not be processed.");
        } finally {
            setSubmitting(false);
        }
    }

    function onCancel() {
        router.push("/dashboard");
    }

    if (!isValid) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-6">
                <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white shadow-sm p-8">
                    <div className="text-sm text-slate-500 mb-2">Vaultly Bank</div>
                    <div className="text-xl font-semibold text-slate-900">Invalid payment link</div>
                    <p className="mt-2 text-sm text-slate-600">
                        Invalid Request, Please follow through Add Money page
                    </p>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="mt-6 w-full rounded-xl bg-slate-900 text-white py-3 text-sm font-medium hover:bg-slate-800 transition"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
            <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />

            <div className="min-h-screen flex items-center justify-center px-6 py-10">
                <div className="w-full max-w-lg">
                    <div className="mb-6 text-center">
                        <div className="text-xs tracking-wide text-slate-500">Secure bank authorization</div>
                        <div className="mt-2 text-2xl font-semibold text-slate-900">{provider}</div>
                    </div>

                    <div className="rounded-3xl border border-white/50 bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] p-7">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-sm text-slate-500">Amount</div>
                                <div className="mt-1 text-4xl font-semibold text-slate-900 tracking-tight">
                                    ₹{formatINR(amount)}
                                </div>
                                <div className="mt-2 text-xs text-slate-500">
                                    User ID: <span className="text-slate-700">{userId}</span>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-600">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Verified session
                                </div>
                                <div className="mt-2 text-[11px] text-slate-500">
                                    Ref: <span className="font-mono">{token.slice(0, 10)}…</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="text-sm font-medium text-slate-800 mb-2">Test scenario</div>
                            <div className="grid grid-cols-2 gap-2">
                                {scenarios.map((s) => {
                                    const active = scenario === s.key;
                                    return (
                                        <button
                                            key={s.key}
                                            type="button"
                                            onClick={() => setScenario(s.key)}
                                            className={[
                                                "text-left rounded-2xl border px-4 py-3 transition",
                                                active
                                                    ? "border-slate-900 bg-slate-900 text-white"
                                                    : "border-slate-200 bg-white/60 text-slate-900 hover:bg-white",
                                            ].join(" ")}
                                        >
                                            <div className="text-sm font-medium">{s.label}</div>
                                            <div
                                                className={[
                                                    "mt-1 text-xs",
                                                    active ? "text-white/70" : "text-slate-500",
                                                ].join(" ")}
                                            >
                                                {s.hint}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {result === "error" && (
                            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {errorMsg || "Something went wrong."}
                            </div>
                        )}

                        {result === "ok" && (
                            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                Authorized.
                                {scenario === "chaos-slow"
                                    ? " Webhook delivery is delayed. You can go back and refresh transactions."
                                    : " Redirecting back to Vaultly…"}
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={onAuthorize}
                                disabled={submitting}
                                className={[
                                    "flex-1 rounded-2xl py-3 text-sm font-medium transition",
                                    submitting ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800",
                                ].join(" ")}
                            >
                                {submitting ? "Authorizing…" : "Authorize payment"}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push(`/dashboard?onramp=1&token=${encodeURIComponent(token)}`)}
                                disabled={submitting}
                                className="rounded-2xl border border-slate-200 bg-white/60 px-5 py-3 text-sm font-medium text-slate-800 hover:bg-white transition"
                            >
                                Back
                            </button>

                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={submitting}
                                className="rounded-2xl border border-slate-200 bg-white/60 px-5 py-3 text-sm font-medium text-slate-800 hover:bg-white transition"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="mt-6 text-center text-[11px] text-slate-500">
                            By continuing, you authorize this transaction. This is a mock bank for testing.
                        </div>
                    </div>

                    <div className="mt-6 text-center text-xs text-slate-500">
                        Vaultly · Mock Banking Interface
                    </div>
                </div>
            </div>
        </div>
    );
}
