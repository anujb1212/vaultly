"use client";

import { motion } from "framer-motion";
import { Zap, Link as LinkIcon, ShieldCheck, ArrowRight, Brain, Activity } from "lucide-react";

export function FeaturesGrid() {
  return (
    <div className="relative mt-8 sm:mt-16 max-w-[1040px] mx-auto px-4 sm:px-6 w-full pb-20">
      {/* Center glowing line traversing the grid from beneath FloatingCards */}
      <div className="absolute left-1/2 top-[-100px] bottom-0 w-[1px] -translate-x-1/2 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent pointer-events-none z-0 hidden md:block">
        <motion.div
          className="w-[3px] h-[150px] absolute -left-[1px] bg-gradient-to-b from-transparent via-blue-400 to-transparent blur-[2px]"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-6 gap-4 sm:gap-6">
        
        {/* Top Left: Text block */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="col-span-1 md:col-span-3 rounded-[1.5rem] bg-[#06020f]/80 border border-white/5 p-8 sm:p-12 flex flex-col justify-center backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 w-max mb-6">
            <div className="w-1.5 h-1.5 bg-white/80" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/80 font-bold">What We Do</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white mb-4 leading-[1.15]">
            Banking at full throttle. <span className="text-white/40">Execute your financial strategy with precision. Design powerful workflows.</span>
          </h2>
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <button className="px-6 py-2.5 rounded-lg bg-white text-black font-bold text-[11px] tracking-[0.1em] shadow-lg hover:opacity-90 transition-opacity">
              START BUILDING
            </button>
            <button className="px-6 py-2.5 rounded-lg bg-white/5 text-white/80 font-bold text-[11px] tracking-[0.1em] border border-white/10 hover:bg-white/10 transition-colors">
              EXPLORE VAULTLY
            </button>
          </div>
        </motion.div>

        {/* Top Right: Node visualization */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} delay={0.1}
          className="col-span-1 md:col-span-3 rounded-[1.5rem] bg-[#06020f]/80 border border-white/5 p-8 flex items-center justify-center relative overflow-hidden min-h-[350px] backdrop-blur-xl shadow-2xl group hover:border-white/10 transition-colors"
        >
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
          
          {/* Nodes visualization */}
          <div className="relative w-full h-full flex items-center justify-center">
             {/* Left Node */}
             <motion.div 
               className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center z-10 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
               animate={{ y: [-5, 5, -5] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             >
               <Zap className="w-6 h-6 text-white/70" />
             </motion.div>

             {/* Dashed Line */}
             <div className="w-12 sm:w-16 h-[2px] border-t-2 border-dashed border-white/20" />

             {/* Center Big Node */}
             <motion.div 
               className="w-24 h-24 rounded-[1.5rem] bg-white/10 border border-white/20 flex items-center justify-center z-10 shadow-[0_0_50px_rgba(255,255,255,0.1)] relative overflow-hidden"
               animate={{ scale: [0.98, 1.02, 0.98] }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
             >
               <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
               <div className="w-12 h-12 rounded-[0.8rem] bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                 <ShieldCheck className="w-6 h-6 text-black" />
               </div>
             </motion.div>

             {/* Branches */}
             <div className="flex flex-col justify-center h-full">
                <div className="w-8 sm:w-12 h-[2px] border-t-2 border-dashed border-white/20 mb-10 -mr-2" />
                <div className="w-8 sm:w-12 h-[2px] border-t-2 border-dashed border-white/20 mt-10 -mr-2" />
             </div>

             <div className="flex flex-col gap-8">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  animate={{ x: [-2, 2, -2] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <ArrowRight className="w-5 h-5 text-white/50" />
                </motion.div>
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                  animate={{ x: [-2, 2, -2] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <ArrowRight className="w-5 h-5 text-white/50" />
                </motion.div>
             </div>
          </div>
        </motion.div>

        {/* Bottom 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} delay={0.2}
          className="col-span-1 md:col-span-2 rounded-[1.5rem] bg-[#06020f]/80 border border-white/5 p-8 flex flex-col items-start backdrop-blur-xl shadow-2xl group hover:border-white/10 transition-all overflow-hidden relative"
        >
          <div className="w-full flex items-center gap-4 mb-16 opacity-80 mix-blend-screen">
             <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:-translate-y-1 transition-transform">
               <Brain className="w-5 h-5 text-white/60" />
             </div>
             <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:-translate-y-1 transition-transform delay-75">
               <Zap className="w-5 h-5 text-white/60" />
             </div>
          </div>
          <div className="w-16 h-16 rounded-[1.2rem] bg-white/10 border border-white/20 flex items-center justify-center shadow-xl mb-6 relative z-10 backdrop-blur-md">
             <Brain className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-white mb-2 tracking-tight">AI-Powered Automation</h3>
          <p className="text-xs sm:text-sm text-white/40 leading-relaxed font-light">
            Add Intelligence To Your Workflows Using GPT, Predictive Models, Or Smart Alerts.
          </p>
        </motion.div>

        {/* Bottom 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} delay={0.3}
          className="col-span-1 md:col-span-2 rounded-[1.5rem] bg-[#06020f]/80 border border-white/5 p-8 flex flex-col items-start backdrop-blur-xl shadow-2xl group hover:border-white/10 transition-all overflow-hidden relative"
        >
          <div className="w-full flex justify-center mb-16 mt-4 relative">
             <div className="w-16 h-16 rounded-[1.2rem] bg-white/10 border border-white/20 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform z-10 backdrop-blur-md">
               <LinkIcon className="w-7 h-7 text-white" />
             </div>
             {/* Connecting lines aesthetic */}
             <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-6 z-0">
               <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 opacity-50" />
               <div className="absolute left-1/4 right-1/4 top-1/2 h-[1px] bg-white/10 border-t border-dashed border-white/20" />
               <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 opacity-50" />
             </div>
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-white mb-2 tracking-tight">Connect Any Data</h3>
          <p className="text-xs sm:text-sm text-white/40 leading-relaxed font-light">
            Sync Product And Financial Data For A Real-Time Single Source Of Truth.
          </p>
        </motion.div>

        {/* Bottom 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} delay={0.4}
          className="col-span-1 md:col-span-2 rounded-[1.5rem] bg-[#06020f]/80 border border-white/5 p-8 flex flex-col items-start backdrop-blur-xl shadow-2xl group hover:border-white/10 transition-all overflow-hidden relative"
        >
          <div className="w-full flex justify-center mb-16 mt-4 relative">
             {/* Orbital animation aesthetic */}
             <div className="absolute inset-0 flex items-center justify-center opacity-60">
               <motion.div 
                 className="w-32 h-10 border border-white/10 rounded-[50%]"
                 animate={{ rotate: 360 }}
                 transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               />
               <motion.div 
                 className="w-10 h-32 border border-white/10 rounded-[50%] absolute"
                 animate={{ rotate: -360 }}
                 transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
               />
             </div>
             <div className="w-16 h-16 rounded-[1.2rem] bg-white/10 border border-white/20 flex items-center justify-center shadow-xl relative z-10 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-shadow backdrop-blur-md">
               <Activity className="w-7 h-7 text-white" />
             </div>
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-white mb-2 tracking-tight">Real-Time Monitoring</h3>
          <p className="text-xs sm:text-sm text-white/40 leading-relaxed font-light">
            Track Executions, Webhooks, And Performance In A Clean Unified Dashboard.
          </p>
        </motion.div>

      </div>
    </div>
  );
}