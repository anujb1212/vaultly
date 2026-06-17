"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../components/theme/ThemeToggle";
import { FloatingCards } from "../components/landing/FloatingCards";
import { FeaturesGrid } from "../components/landing/FeaturesGrid";
import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#06020f] text-foreground dark:text-white transition-colors duration-300 relative overflow-x-hidden">

      {/* ================= BACKGROUND GLOW (Dark Mode) ================= */}
      <div className="hidden dark:block absolute inset-0 z-0 pointer-events-none h-[1400px] overflow-hidden">
        <div className="absolute inset-0 bg-[#06020f]" />

        {/* Center Horizon Glow */}
        <div
          className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] rounded-full mix-blend-screen opacity-70"
          style={{
            background: "radial-gradient(ellipse at center, rgba(249,115,22,0.35) 0%, rgba(147,51,234,0.2) 45%, rgba(6,2,15,0) 70%)",
            filter: "blur(60px)"
          }}
        />

        {/* Grid Background */}
        <div
          className="absolute inset-0 w-full h-full opacity-25"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
            backgroundSize: "64px 64px"
          }}
        />

        {/* Orbs */}
        <div className="absolute left-[-45px] top-[36%] w-28 h-28 rounded-full mix-blend-plus-lighter bg-gradient-to-br from-blue-700 via-purple-600 to-orange-500 blur-[2px]" style={{ boxShadow: "0 0 60px rgba(124, 58, 237, 0.6), 0 0 100px rgba(234, 88, 12, 0.4)" }} />
        <div className="absolute right-[-55px] top-[14%] w-44 h-44 rounded-full mix-blend-plus-lighter bg-gradient-to-br from-blue-600 via-purple-500 to-orange-500 blur-[2px]" style={{ boxShadow: "0 0 80px rgba(168, 85, 247, 0.5), 0 0 120px rgba(249, 115, 22, 0.3)" }} />

        {/* Ambient Text-Highlight */}
        <div className="absolute left-1/2 top-[25%] -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-purple-600/10 blur-[120px] mix-blend-screen" />

        {/* The Spherical Dome (No border line) */}
        <div
          className="absolute top-[52%] left-1/2 -translate-x-1/2 w-[240vw] sm:w-[140vw] h-[900px] rounded-[100%]"
          style={{
            background: "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(38, 14, 74, 0.8) 0%, rgba(10, 5, 20, 1) 40%, #06020f 100%)"
          }}
        />
      </div>

      {/* ================= NAVIGATION ================= */}
      <nav className="relative z-50 py-6 border-b border-black/5 dark:border-white/5 bg-white/70 dark:bg-transparent backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-foreground dark:bg-white text-background dark:text-[#06020f] grid place-items-center font-bold text-lg">V</div>
            <span className="font-semibold tracking-tight text-xl">Vaultly</span>
          </button>

          <div className="flex items-center gap-8">
            <ThemeToggle />
            <button onClick={() => router.push("/signin")} className="text-xs font-bold tracking-[0.2em] text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white transition-colors">SIGN IN</button>
            <button onClick={scrollToFeatures} className="hidden sm:inline text-xs font-bold tracking-[0.2em] text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white transition-colors">FEATURES</button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-24 pb-24">

        {/* ================= HERO SECTION ================= */}
        <motion.div
          className="flex flex-col items-center text-center px-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-normal tracking-tight leading-[1.12] mb-6 text-foreground dark:text-white">
            Banking That<br /> Works for You
          </h1>
          <p className="text-muted-foreground dark:text-white/60 text-sm sm:text-base max-w-xl leading-relaxed tracking-wide font-light mb-8">
            No queues. No clutter. Just effortless control over your finances.
          </p>
          <button
            onClick={() => router.push("/signup")}
            className="px-8 py-3 rounded-full bg-foreground text-background dark:bg-white dark:text-[#06020f] text-sm font-semibold tracking-wide shadow-xl hover:opacity-90 transition-all"
          >
            Create account
          </button>
        </motion.div>

        {/* Hero Visuals */}
        <div className="relative w-full max-w-5xl mx-auto h-[440px] flex justify-center items-center overflow-visible">
          <FloatingCards />
        </div>

        {/* Features Section */}
        <div ref={featuresRef} className="mt-12 bg-muted/30 dark:bg-black/30 backdrop-blur-2xl">
          <FeaturesGrid />
        </div>

        {/* Footer */}
        <div className="max-w-5xl mx-auto px-6 border-t border-black/10 dark:border-white/5 pt-12 text-center">
          <div className="flex justify-center items-center gap-2.5 text-muted-foreground dark:text-white/50 text-xs tracking-wider">
            <ShieldCheck className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span>Bank-grade security standards</span>
          </div>
          <p className="mt-6 text-[10px] text-muted-foreground/60 dark:text-white/30 tracking-widest font-mono">
            &copy; {new Date().getFullYear()} Vaultly Inc.
          </p>
        </div>

      </main>
    </div>
  );
}