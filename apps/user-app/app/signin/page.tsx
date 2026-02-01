"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Button } from "@repo/ui/button";
import { TextInput } from "@repo/ui/textinput";
import { ArrowRight, LockKeyhole, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";

const signInSchema = z.object({
  phone: z
    .string()
    .length(10, { message: "Phone number must be exactly 10 digits" })
    .regex(/^\d+$/, { message: "Phone number must contain only numbers" }),
  password: z
    .string()
    .min(1, { message: "Password is required" }),
});

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

    const validation = signInSchema.safeParse({ phone, password });

    if (!validation.success) {
      setError(validation.error.message);
      setLoading(false);
      return;
    }

    const res = await signIn("credentials", {
      phone,
      password,
      redirect: false
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid credentials. Please check your details.");
      return;
    }

    if (res?.ok) router.push("/dashboard");
  }

  return (
    <div className="min-h-screen w-full flex relative bg-background selection:bg-primary/20 overflow-hidden">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative bg-slate-50 dark:bg-black border-r border-border/40 p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-foreground text-background grid place-items-center font-bold text-lg shadow-sm">V</div>
          <span className="font-bold tracking-tight text-xl">Vaultly</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold tracking-tight text-balance mb-6">
            Secure access to your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              financial fortress.
            </span>
          </h1>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Bank-Grade Encryption</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your data is encrypted end-to-end. We never store plain-text passwords.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <LockKeyhole className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Zero-Trust Security</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every session is verified. Every transaction is authenticated.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground/60 font-medium">
          © {new Date().getFullYear()} Vaultly Inc. All rights reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-foreground text-background grid place-items-center font-bold text-sm">V</div>
          <span className="font-bold tracking-tight text-lg">Vaultly</span>
        </div>

        <div className="w-full max-w-[360px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-8">
            <h2 className="text-4xl font-bold tracking-tight mb-2">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-4">
              <TextInput
                label="Phone Number"
                placeholder="e.g. 9876543210"
                onChange={(val) => {
                  setPhone(val.trim());
                  setError("");
                }}
                type="tel"
              />
              <TextInput
                label="Password"
                placeholder="••••••••"
                onChange={(val) => {
                  setPassword(val);
                  setError("");
                }}
                type="password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground font-medium rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              New to Vaultly?{" "}
              <Link
                href="/signup"
                className="font-medium text-foreground text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-4 decoration-muted-foreground/30"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
