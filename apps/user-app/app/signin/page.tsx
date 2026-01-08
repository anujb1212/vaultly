"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Button } from "@repo/ui/button";
import { TextInput } from "@repo/ui/textinput";
import Link from "next/link";

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
    } else if (res?.ok) {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-black p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-neutral-800 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-xl mx-auto flex items-center justify-center mb-4">
            <span className="text-white dark:text-black font-bold text-xl">V</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
          <p className="text-slate-500 dark:text-neutral-400 text-sm mt-2">Enter your credentials to access your wallet</p>
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
            placeholder="••••••••"
            onChange={(val) => setPassword(val)}
            type="password"
          />

          <Button type="submit" disabled={loading} className="w-full py-3 mt-2">
            {loading ? "Verifying..." : "Sign In"}
          </Button>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center font-medium">
              {error}
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
