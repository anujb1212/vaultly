"use client";

import { forwardRef, MouseEvent } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Sparkles, History } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "On-ramp Transfer",
    desc: "Add funds to your wallet from any bank. No friction, no delays.",
    accent: "bg-blue-500",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    iconColor: "text-blue-400",
  },
  {
    icon: Users,
    title: "P2P Payments",
    desc: "Send money to anyone with just their phone number. Instant and free.",
    accent: "bg-purple-500",
    glow: "shadow-[0_0_15px_rgba(168,85,247,0.5)]",
    iconColor: "text-purple-400",
  },
  {
    icon: Sparkles,
    title: "AI Insights",
    desc: "Your spending decoded. Smart alerts before things go wrong.",
    accent: "bg-orange-500",
    glow: "shadow-[0_0_15px_rgba(249,115,22,0.5)]",
    iconColor: "text-orange-400",
  },
  {
    icon: History,
    title: "History",
    desc: "A timeline of every transaction — searchable in a single tap.",
    accent: "bg-pink-500",
    glow: "shadow-[0_0_15px_rgba(236,72,153,0.5)]",
    iconColor: "text-pink-400",
  },
];

export const FeaturesGrid = forwardRef<HTMLDivElement>(function FeaturesGrid(
  _props,
  ref
) {
  // Mouse movement handler to calculate cursor position relative to the card
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top } = currentTarget.getBoundingClientRect();

    // Set CSS variables for the exact X and Y coordinates of the mouse
    currentTarget.style.setProperty("--mouse-x", `${clientX - left}px`);
    currentTarget.style.setProperty("--mouse-y", `${clientY - top}px`);
  };

  return (
    <div ref={ref} className="mt-8 sm:mt-16 max-w-[1040px] mx-auto px-4 sm:px-6 w-full">
      <motion.div
        onMouseMove={handleMouseMove}
        className="group relative rounded-[2.5rem] bg-[#0a0515]/60 border border-white/[0.08] backdrop-blur-2xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      >

        {/* 1. Internal Soft Spotlight Glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0"
          style={{
            background: "radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(139, 92, 246, 0.08), transparent 40%)"
          }}
        />

        {/* 2. Dynamic Border Highlight Overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0"
          style={{
            background: "radial-gradient(400px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(255, 255, 255, 0.15), transparent 40%)",
            // Use mask to only show the gradient ON the 1px border perimeter
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            padding: "1px" // Thickness of the glowing border
          }}
        />

        <div className="relative z-10 p-10 sm:p-14 lg:p-16">

          {/* Top label row */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
            <span className="text-xs font-bold tracking-[0.25em] uppercase text-blue-400/90">
              Future payment
            </span>
          </div>

          {/* Intro Text Section (Optimized whitespace & gap) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-20 items-end">
            <h2 className="md:col-span-6 text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white text-balance leading-[1.15]">
              Experience that grows
              <br />
              with your scale.
            </h2>
            <p className="md:col-span-6 text-sm sm:text-base text-white/50 leading-relaxed font-light md:pl-6">
              From your first on-ramp deposit to your ten-thousandth P2P payment, Fundix&apos;s cash flow engine scales seamlessly. No spreadsheets, no chaos — just clean, automated money movement that keeps pace with your ambition.
            </p>
          </div>

          {/* 4-column Features Grid (Balanced spacing) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8 sm:gap-x-12 relative">

            {/* Subtle internal dividers for desktop */}
            <div className="hidden lg:block absolute top-0 bottom-0 left-1/4 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
            <div className="hidden lg:block absolute top-0 bottom-0 left-2/4 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
            <div className="hidden lg:block absolute top-0 bottom-0 left-3/4 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                className="group/item relative flex flex-col items-start"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.1 + idx * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {/* Icon Container */}
                <div className="relative mb-8 inline-block">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.08] grid place-items-center transition-all duration-300 group-hover/item:scale-110 group-hover/item:bg-white/[0.05] group-hover/item:border-white/20 group-hover/item:shadow-lg">
                    <feature.icon className={`w-6 h-6 stroke-[1.5] text-white/50 group-hover/item:${feature.iconColor} transition-colors duration-300`} />
                  </div>

                  {/* Expanding underline accent on hover */}
                  <div
                    className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full ${feature.accent} ${feature.glow} opacity-0 group-hover/item:opacity-100 transition-all duration-300`}
                  />
                </div>

                {/* Typography */}
                <h3 className="text-base font-semibold tracking-wide text-white/90 mb-3 group-hover/item:text-white transition-colors">
                  {feature.title}
                </h3>

                <p className="text-sm text-white/40 leading-relaxed font-light group-hover/item:text-white/60 transition-colors">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
});