"use client";

import { motion } from "motion/react";

export function FloatingCards() {
  return (
    <div className="relative w-full max-w-3xl h-full flex justify-center items-center" style={{ perspective: "1500px", transformStyle: "preserve-3d" }}>

      {/* Card 2: Background / Right (Deep Blue/Purple Neon) */}
      <motion.div
        initial={{ opacity: 0, x: 50, y: 50, rotateY: -15, rotateX: 20, rotateZ: 5 }}
        animate={{ opacity: 1, x: 80, y: -20, rotateY: -20, rotateX: 25, rotateZ: 10 }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        className="absolute w-[340px] h-[215px] rounded-2xl p-6 flex flex-col justify-between shadow-[0_30px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(168,85,247,0.4)] border border-white/10 backdrop-blur-md overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
          zIndex: 1,
        }}
      >
        {/* Neon glowing orbs inside Card 2 */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500 rounded-full blur-[50px] opacity-60" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600 rounded-full blur-[50px] opacity-60" />

        {/* Content */}
        <div className="relative z-10 flex justify-between items-start">
          <div className="w-12 h-10 rounded bg-white/20 backdrop-blur-sm border border-white/10" />
          {/* Dual-circle logo */}
          <div className="flex">
            <div className="w-8 h-8 rounded-full bg-orange-500/80 mix-blend-screen" />
            <div className="w-8 h-8 rounded-full bg-purple-500/80 -ml-4 mix-blend-screen" />
          </div>
        </div>
        <div className="relative z-10 mt-auto space-y-4">
          <div className="text-white/90 font-mono text-xl tracking-[0.15em] drop-shadow-md">
            •••• •••• •••• 7654
          </div>
        </div>
      </motion.div>

      {/* Card 1: Foreground / Left (Gold/Bronze + Black Glassmorphic) */}
      <motion.div
        initial={{ opacity: 0, x: -50, y: 50, rotateY: 15, rotateX: 20, rotateZ: -5 }}
        animate={{ opacity: 1, x: -60, y: 30, rotateY: 20, rotateX: 15, rotateZ: -8 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute w-[360px] h-[225px] rounded-2xl p-6 flex flex-col justify-between shadow-[0_40px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(218,165,32,0.15)] border border-white/10 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)",
          zIndex: 2,
        }}
      >
        {/* Black Glassmorphic Overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        {/* Content */}
        <div className="relative z-10 flex justify-between items-start">
          <div className="w-12 h-10 rounded bg-gradient-to-br from-yellow-400/80 to-yellow-600/80 shadow-inner" />
          {/* Dual-circle logo */}
          <div className="flex">
            <div className="w-8 h-8 rounded-full bg-red-500/80 mix-blend-screen" />
            <div className="w-8 h-8 rounded-full bg-yellow-500/80 -ml-4 mix-blend-screen" />
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="text-white font-mono text-xl sm:text-2xl tracking-[0.2em] mb-4 drop-shadow-lg">
            9821 9311 2675 1122
          </div>
          <div className="flex justify-between items-end text-xs font-semibold tracking-wider text-white/70">
            <div>
              <div className="text-[10px] text-white/50 mb-1">CARDHOLDER</div>
              <div className="text-white uppercase">Giselle W</div>
            </div>
            <div>
              <div className="text-[10px] text-white/50 mb-1">VALID THRU</div>
              <div className="text-white">09/26</div>
            </div>
            <div>
              <div className="text-[10px] text-white/50 mb-1">CVV</div>
              <div className="text-white">123</div>
            </div>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
