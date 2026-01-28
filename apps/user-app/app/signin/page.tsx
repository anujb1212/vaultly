"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Button } from "@repo/ui/button";
import { TextInput } from "@repo/ui/textinput";
import { ShieldCheck, LockKeyhole, ArrowRight } from "lucide-react";

export default function SigninPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", { phone, password, redirect: false });

    setLoading(false);
    if (res?.error) {
      setError("Invalid phone number or password.");
      return;
    }
    if (res?.ok) router.push("/dashboard");
  }

  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-black">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:6rem_4rem]" />

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left */}
        <div className="hidden lg:flex relative overflow-hidden border-r border-slate-200 dark:border-neutral-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_700px_at_10%_10%,#c7d2fe,transparent)] dark:bg-[radial-gradient(circle_700px_at_10%_10%,#312e81,transparent)] opacity-40" />
          <div className="relative z-10 p-12 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200/70 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/40 backdrop-blur px-4 py-2">
                <div className="h-9 w-9 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-white dark:text-black" />
                </div>
                <div className="font-extrabold tracking-tight text-slate-900 dark:text-white">
                  VAULTLY
                </div>
              </div>

              <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Sign in to your wallet
              </h1>
              <p className="mt-3 text-slate-600 dark:text-neutral-300 max-w-md">
                Secure access, transaction PIN protection, and audit logs built-in.
              </p>

              <div className="mt-8 grid gap-3 max-w-md">
                <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/40 backdrop-blur p-4 flex items-start gap-3">
                  <LockKeyhole className="h-5 w-5 mt-0.5 text-slate-700 dark:text-neutral-200" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Protected actions</div>
                    <div className="text-sm text-slate-600 dark:text-neutral-300">
                      Transfers and onramp can be gated by your Transaction PIN.
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/40 backdrop-blur p-4 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 mt-0.5 text-slate-700 dark:text-neutral-200" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Account verification</div>
                    <div className="text-sm text-slate-600 dark:text-neutral-300">
                      Email verification improves your account protection score.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-neutral-400">
              Tip: Use a password manager and keep your PIN private.
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-neutral-800 p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
                  <p className="text-slate-500 dark:text-neutral-400 text-sm mt-2">
                    Enter your credentials to access your wallet.
                  </p>
                </div>
                <div className="lg:hidden h-11 w-11 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-white dark:text-black" />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <TextInput
                label="Phone Number"
                placeholder="1234567890"
                onChange={(val) => setPhone(val)}
                type="tel"
              />
              <TextInput
                label="Password"
                placeholder="Enter your password"
                onChange={(val) => setPassword(val)}
                type="password"
              />

              <Button type="submit" disabled={loading} className="w-full py-3 mt-2">
                <span className="inline-flex items-center justify-center gap-2">
                  {loading ? "Verifying..." : "Sign In"}
                  {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                </span>
              </Button>

              {error ? (
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center font-medium border border-red-100 dark:border-red-900/30">
                  {error}
                </div>
              ) : null}
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
