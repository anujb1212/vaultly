"use client";

import { AppbarClient } from "../../components/AppbarClient";
import { SidebarItem } from "../../components/SidebarItem";
import { LayoutDashboard, ArrowRightLeft, Clock, Users, ShieldCheck } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-black font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">

      {/* Fixed Sidebar */}
      <aside
        className="hidden md:flex flex-col w-72 shrink-0 h-screen sticky top-0 border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 z-40 transition-colors duration-300"
        aria-label="Sidebar navigation"
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-8 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
            <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 dark:shadow-none">
              <ShieldCheck className="w-5 h-5 text-white dark:text-black" strokeWidth={3} />
            </div>
            <span className="text-xl font-bold tracking-tight">VAULTLY</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-1">
            <SidebarItem
              href="/dashboard"
              icon={<LayoutDashboard className="w-5 h-5" />}
              title="Dashboard"
            />
            <SidebarItem
              href="/transfer"
              icon={<ArrowRightLeft className="w-5 h-5" />}
              title="Transfer Funds"
            />
            <SidebarItem
              href="/transactions"
              icon={<Clock className="w-5 h-5" />}
              title="History"
            />
            <SidebarItem
              href="/p2ptransfer"
              icon={<Users className="w-5 h-5" />}
              title="P2P Transfer"
            />
          </nav>
        </div>

        {/* Sidebar Footer / User Profile hint could go here */}
        <div className="p-4 border-t border-slate-200 dark:border-neutral-800">
          <div className="bg-slate-50 dark:bg-neutral-800/50 rounded-xl p-4 flex items-center gap-3 border border-slate-100 dark:border-neutral-800">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">Verified Account</p>
              <p className="text-[10px] text-slate-500 truncate">Tier 1 • Limit ₹1L</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
        <AppbarClient />
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
