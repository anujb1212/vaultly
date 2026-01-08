"use client";

import { useRouter } from "next/navigation";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "@repo/ui/button"; // Using your shared UI
import { ArrowRight, Shield, Zap, Globe } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white selection:bg-indigo-100 dark:selection:bg-indigo-900 overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black">V</div>
            Vaultly
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <button
              onClick={() => router.push("/signin")}
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            >
              Sign In
            </button>
            <Button onClick={() => router.push("/signup")} className="rounded-full px-6">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wide border border-indigo-100 dark:border-indigo-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            New: Instant P2P Transfers
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            The money app for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
              modern life.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Send, receive, and manage your money with zero friction.
            Bank-grade security meets beautiful design.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => router.push("/signup")}
              className="h-12 px-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black font-semibold hover:scale-105 transition-transform flex items-center gap-2"
            >
              Create Free Account <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push("/signin")}
              className="h-12 px-8 rounded-full bg-white dark:bg-neutral-800 text-slate-900 dark:text-white border border-slate-200 dark:border-neutral-700 font-semibold hover:bg-slate-50 dark:hover:bg-neutral-700 transition"
            >
              Log In
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-6xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Zap, title: "Lightning Fast", desc: "Transfers settle in seconds, not days. Built on real-time rails." },
            { icon: Shield, title: "Bank-Grade Security", desc: "256-bit encryption and fraud protection keep your funds safe." },
            { icon: Globe, title: "Global Scale", desc: "Send money to anyone, anywhere with just a phone number." }
          ].map((f, i) => (
            <div key={i} className="p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-none transition-all duration-300">
              <div className="w-12 h-12 bg-slate-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{f.title}</h3>
              <p className="text-slate-500 dark:text-neutral-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-slate-200 dark:border-neutral-800 mt-12">
        <p className="text-sm text-slate-500 dark:text-neutral-500">
          © {new Date().getFullYear()} Vaultly Inc. Secure Payments.
        </p>
      </footer>
    </div>
  );
}
