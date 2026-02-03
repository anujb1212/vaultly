"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { Button } from "@repo/ui/button";
import { TextInput } from "@repo/ui/textinput";
import { ArrowRight, Loader2, Sparkles, Wallet, AlertCircle } from "lucide-react";
import { z } from "zod";
import { toFieldErrors, type FieldErrors } from "../../../components/auth/zodFieldErrors";

const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z
    .string()
    .length(10, { message: "Phone number must be exactly 10 digits." })
    .regex(/^\d+$/, { message: "Phone number must contain only numbers." }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Include at least one special character (!@#$%).",
    }),
});

type SignUpFields = "name" | "phone" | "email" | "password";

export default function SignupPage() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<SignUpFields>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    setLoading(true);

    const validation = signUpSchema.safeParse({
      name,
      phone,
      email: email || "",
      password
    });

    if (!validation.success) {
      const { fieldErrors: fe, formError: top } = toFieldErrors<SignUpFields>(validation.error);
      setFieldErrors(fe);
      if (top) setFormError(top);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          password,
          name,
          email: email || undefined
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setFormError(data.error || "Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      await signIn("credentials", { phone, password, callbackUrl: "/dashboard" });
    } catch {
      setFormError("Network connection error. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex relative bg-background selection:bg-indigo-500/20 overflow-hidden">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative bg-slate-50 dark:bg-black border-r border-border/40 p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-foreground text-background grid place-items-center font-bold text-lg shadow-sm">
            V
          </div>
          <span className="font-bold tracking-tight text-xl">Vaultly</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold tracking-tight text-balance mb-6">
            Financial freedom <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 dark:from-indigo-400 dark:to-violet-400">
              starts here.
            </span>
          </h1>

          <div className="space-y-5">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Instant Setup</h3>
                <p className="text-sm text-muted-foreground leading-tight">
                  Create your account in seconds. No paperwork, just a phone number.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Unified Wallet</h3>
                <p className="text-sm text-muted-foreground leading-tight">
                  Manage on-ramp, P2P transfers, and insights from one dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-muted-foreground/60 font-medium">
          © {new Date().getFullYear()} Vaultly Inc.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-foreground text-background grid place-items-center font-bold text-sm">V</div>
          <span className="font-bold tracking-tight text-lg">Vaultly</span>
        </div>

        <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-700 my-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Create your account</h2>
            <p className="text-sm text-muted-foreground">
              Join other users managing their money smarter.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-4">
              <TextInput
                label="Full Name"
                placeholder="John Doe"
                onChange={(val) => { setName(val); if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: undefined })); }}
                value={name}
                error={fieldErrors.name}
              />
              <TextInput
                label="Phone Number"
                placeholder="e.g. 9876543210"
                onChange={(val) => { setPhone(val.trim()); if (fieldErrors.phone) setFieldErrors(p => ({ ...p, phone: undefined })); }}
                type="tel"
                value={phone}
                error={fieldErrors.phone}
              />
              <TextInput
                label="Email (optional)"
                placeholder="you@example.com"
                onChange={(val) => { setEmail(val.trim()); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: undefined })); }}
                type="email"
                value={email}
                error={fieldErrors.email}
              />
              <TextInput
                label="Password"
                placeholder="Min 8 chars + special char"
                onChange={(val) => { setPassword(val); if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: undefined })); }}
                type="password"
                value={password}
                error={fieldErrors.password}
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground font-medium rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Create Account <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-medium text-foreground text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-4 decoration-muted-foreground/30"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
