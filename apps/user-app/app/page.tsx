"use client";

import { useRouter } from "next/navigation";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "@repo/ui/button";
import { ArrowRight, Shield, Zap, Globe, Lock, Smartphone, Laptop } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white selection:bg-indigo-100 dark:selection:bg-indigo-900 overflow-x-hidden relative">

      {/* --- BACKGROUND EFFECT --- */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)] dark:bg-[radial-gradient(circle_800px_at_100%_200px,#312e81,transparent)] opacity-20 dark:opacity-40"></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-black/70 backdrop-blur-2xl transition-all supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-black/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight cursor-pointer group" onClick={() => router.push("/")}>
            <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-xl shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <span className="font-bold">V</span>
            </div>
            <span className="hidden sm:inline-block font-bold tracking-tighter text-slate-900 dark:text-white">Vaultly</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
              <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => router.push("/signin")}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition px-4 py-2"
              >
                Log In
              </button>
              <Button onClick={() => router.push("/signup")} className="rounded-full px-6 py-3 text-sm font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="pt-40 pb-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-10">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-800 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700 hover:border-indigo-500/30 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            New: Instant P2P Payments 2.0
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-slate-900 dark:text-white leading-[1.05] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Payments, but <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
              beautifully simple.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 font-medium">
            Send money to friends, manage your wallet, and track expenses.
            <span className="hidden sm:inline"> Built for the modern web with a focus on privacy and speed.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <button
              onClick={() => router.push("/signup")}
              className="h-14 px-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/10 flex items-center gap-2"
            >
              Create Free Account <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push("/signin")}
              className="h-14 px-8 rounded-full bg-white/50 dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 font-bold text-lg hover:bg-slate-100 dark:hover:bg-white/10 transition backdrop-blur-sm"
            >
              View Demo
            </button>
          </div>

          {/* --- UI PREVIEW --- */}
          <div className="mt-24 relative mx-auto max-w-7xl animate-in fade-in zoom-in-95 duration-1000 delay-300 group">
            <div className="absolute -inset-10 bg-gradient-to-t from-indigo-500/20 via-purple-500/20 to-transparent rounded-[3rem] blur-3xl opacity-50 dark:opacity-40 pointer-events-none"></div>

            <div className="relative rounded-2xl bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden ring-1 ring-slate-900/5">

              {/* Browser Header */}
              <div className="h-12 bg-slate-50/80 dark:bg-[#0A0A0A] border-b border-slate-200/50 dark:border-white/5 flex items-center px-4 gap-4 backdrop-blur-md z-20 relative">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
                </div>
                <div className="flex-1 max-w-2xl mx-auto h-8 bg-white dark:bg-white/5 rounded-lg border border-slate-200/50 dark:border-white/5 flex items-center justify-center text-xs font-medium text-slate-400 dark:text-neutral-500">
                  <Lock className="w-3 h-3 mr-2 opacity-50" /> vaultly.com/dashboard
                </div>
                <div className="w-16"></div>
              </div>

              {/* Image Container - Swaps based on dark mode class */}
              <div className="relative w-full bg-slate-50 dark:bg-black group-hover:scale-[1.005] transition-transform duration-700 ease-out overflow-hidden">

                {/* Light Mode Image*/}
                <div className="block dark:hidden">
                  <img
                    src="/dashboard-preview-light.jpg"
                    alt="Vaultly Dashboard Light"
                    className="w-full h-auto object-cover object-top"
                  />
                </div>

                {/* Dark Mode Image*/}
                <div className="hidden dark:block">
                  <img
                    src="/dashboard-preview-dark.jpg"
                    alt="Vaultly Dashboard Dark"
                    className="w-full h-auto object-cover object-top"
                  />
                </div>

                {/* Overlay Text Button*/}
                <div className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-center pb-12 pointer-events-none bg-gradient-to-t from-white/80 via-white/20 to-transparent dark:from-black/80 dark:via-black/20">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="pointer-events-auto px-8 py-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-full shadow-2xl transform hover:scale-105 transition-all opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 duration-500"
                  >
                    <span className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Experience the Interface <ArrowRight className="w-4 h-4" />
                    </span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* --- FEATURES GRID --- */}
        <div id="features" className="max-w-7xl mx-auto mt-40 scroll-mt-28 mb-40">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">Everything you need.</h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">Engineered for the future of personal finance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Lightning Fast", desc: "Transactions settle in milliseconds using our optimized OnRamp engine." },
              { icon: Lock, title: "Bank-Grade Encryption", desc: "Your financial data is encrypted at rest and in transit using AES-256." },
              { icon: Globe, title: "Global Access", desc: "Access your wallet from anywhere in the world. Borderless finance." },
              { icon: Shield, title: "Fraud Protection", desc: "Real-time AI monitoring detects and blocks suspicious activity instantly." },
              { icon: Laptop, title: "Cross-Platform", desc: "Seamless experience across Mobile, Tablet, and Desktop devices." },
              { icon: Smartphone, title: "Instant P2P", desc: "Send money to anyone using just their phone number or email." }
            ].map((f, i) => (
              <div key={i} className="group p-10 rounded-[2.5rem] bg-slate-50 dark:bg-neutral-900/30 border border-slate-200 dark:border-white/5 hover:border-indigo-500/20 dark:hover:border-indigo-500/30 hover:bg-white dark:hover:bg-neutral-900 transition-all duration-300">
                <div className="w-14 h-14 bg-white dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white tracking-tight">{f.title}</h3>
                <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black font-bold text-sm">V</div>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight">Vaultly</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-neutral-500">
            © {new Date().getFullYear()} Vaultly Inc. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-medium text-slate-500 dark:text-neutral-500">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
