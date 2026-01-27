"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Button } from "@repo/ui/button";
import { TextInput } from "@repo/ui/textinput";
import { ShieldCheck, UserPlus, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, name, email: email || undefined }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      await signIn("credentials", { phone, password, callbackUrl: "/dashboard" });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-black">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:6rem_4rem]" />

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left */}
        <div className="hidden lg:flex relative overflow-hidden border-r border-slate-200 dark:border-neutral-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_700px_at_10%_10%,#dbeafe,transparent)] dark:bg-[radial-gradient(circle_700px_at_10%_10%,#1e3a8a,transparent)] opacity-40" />
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
                Create your account
              </h1>
              <p className="mt-3 text-slate-600 dark:text-neutral-300 max-w-md">
                Set up your profile, verify email, and enable Transaction PIN for stronger protection.
              </p>

              <div className="mt-8 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/40 backdrop-blur p-5 flex items-start gap-3 max-w-md">
                <UserPlus className="h-5 w-5 mt-0.5 text-slate-700 dark:text-neutral-200" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Fast onboarding</div>
                  <div className="text-sm text-slate-600 dark:text-neutral-300">
                    Phone sign-in, optional email, and secure session tracking.
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-neutral-400">
              Use a unique password and avoid reusing old credentials.
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-neutral-800 p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create an account</h2>
                  <p className="text-slate-500 dark:text-neutral-400 text-sm mt-2">
                    Join Vaultly for secure payments.
                  </p>
                </div>
                <div className="lg:hidden h-11 w-11 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-white dark:text-black" />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <TextInput label="Full Name" placeholder="John Doe" onChange={(val) => setName(val)} />
              <TextInput
                label="Phone Number"
                placeholder="1234567890"
                onChange={(val) => setPhone(val)}
                type="tel"
              />
              <TextInput
                label="Email (optional)"
                placeholder="you@example.com"
                onChange={(val) => setEmail(val)}
                type="email"
              />
              <TextInput
                label="Password"
                placeholder="Create a strong password"
                onChange={(val) => setPassword(val)}
                type="password"
              />

              <Button type="submit" disabled={loading} className="w-full py-3 mt-2">
                <span className="inline-flex items-center justify-center gap-2">
                  {loading ? "Creating Account..." : "Sign Up"}
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
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
