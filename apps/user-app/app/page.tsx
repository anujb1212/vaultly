"use client";

import { useRouter } from "next/navigation";
import { ThemeToggle } from "../components/theme/ThemeToggle";
import {
  ArrowRight,
  TrendingUp,
  Users,
  Sparkles,
  History,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

const FEATURES = [
  {
    title: "On-ramp Transfer",
    desc: "Seamlessly add funds to your digital wallet from external banks.",
    icon: TrendingUp,
    gradient: "from-blue-500/20 to-indigo-500/20"
  },
  {
    title: "P2P Payments",
    desc: "Send money to friends instantly using just their phone number.",
    icon: Users,
    gradient: "from-indigo-500/20 to-violet-500/20"
  },
  {
    title: "AI Powered Insights",
    desc: "Smart insights that analyze your transaction patterns for safety.",
    icon: Sparkles,
    gradient: "from-violet-500/20 to-fuchsia-500/20"
  },
  {
    title: "History",
    desc: "A clear, searchable timeline of every credit and debit.",
    icon: History,
    gradient: "from-fuchsia-500/20 to-pink-500/20"
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-indigo-500/20">

      <div className="fixed inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="absolute left-[10%] top-[20%] h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[120px] motion-safe:animate-pulse [animation-duration:8s]" />
        <div className="absolute right-[10%] bottom-[20%] h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[120px] motion-safe:animate-pulse [animation-duration:10s] delay-1000" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="group flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-foreground to-foreground/80 text-background grid place-items-center font-bold text-lg shadow-lg shadow-indigo-500/20 group-hover:scale-95 transition-transform duration-200">
              V
            </div>
            <span className="font-bold tracking-tight text-lg">Vaultly</span>
          </button>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => router.push("/signin")}
              className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="h-9 px-5 rounded-full bg-foreground text-background text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24 sm:pt-40 sm:pb-32 relative">

        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-300 text-xs font-semibold backdrop-blur-md shadow-sm cursor-default hover:bg-indigo-500/10 transition-colors">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span>Vaultly 2.0 is live</span>
          </div>

          <div className="relative">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-balance max-w-4xl z-10 relative">
              Payments, but <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                beautifully simple.
              </span>
            </h1>
            <div className="absolute inset-0 -z-10 bg-indigo-500/10 blur-[60px] rounded-full opacity-50 dark:opacity-20" />
          </div>

          {/* Subtext */}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl text-balance leading-relaxed font-normal">
            The financial OS for your personal wealth. <br className="hidden sm:block" />
            Transfer, track, and secure your assets without the noise.
          </p>

          {/* Primary CTA */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => router.push("/signup")}
              className="group relative h-14 px-8 rounded-full bg-foreground text-background text-base font-semibold shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1 flex items-center gap-2 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Create account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground px-4">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 sm:mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group relative p-8 h-full min-h-[220px] rounded-3xl border border-border/40 bg-background/40 hover:bg-background/60 transition-all duration-300 backdrop-blur-sm overflow-hidden hover:border-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out`} />

              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="w-12 h-12 rounded-2xl bg-background border border-border/50 shadow-sm grid place-items-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 ease-out">
                  <feature.icon className="w-6 h-6 stroke-[1.5] text-foreground" />
                </div>

                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed font-medium">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Trust Section */}
        <div className="mt-32 border-t border-border/40 pt-16 pb-8 text-center">
          <div className="flex justify-center items-center gap-2 text-foreground/80 font-medium">
            <ShieldCheck className="w-5 h-5" />
            <span>Bank-grade security standards</span>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">© {new Date().getFullYear()} Vaultly Inc.</p>
        </div>

      </main>
    </div>
  );
}
