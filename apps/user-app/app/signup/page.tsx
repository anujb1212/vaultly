"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Button } from "@repo/ui/button";
import { TextInput } from "@repo/ui/textinput";
import Link from "next/link";

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
        body: JSON.stringify({ phone, password, name, email: email || undefined })
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
    <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-black p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-neutral-800 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create an account</h2>
          <p className="text-slate-500 dark:text-neutral-400 text-sm mt-2">Join Vaultly for secure payments</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Full Name"
            placeholder="John Doe"
            onChange={(val) => setName(val)}
          />
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
            placeholder="••••••••"
            onChange={(val) => setPassword(val)}
            type="password"
          />

          <Button type="submit" disabled={loading} className="w-full py-3 mt-2">
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center font-medium">
              {error}
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
