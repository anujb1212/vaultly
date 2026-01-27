"use client";

import { AppbarClient } from "../../components/AppbarClient";
import { SidebarItem } from "../../components/SidebarItem";
import { LayoutDashboard, ArrowRightLeft, Clock, Users, ShieldCheck } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black font-sans text-slate-900 dark:text-slate-50 overflow-hidden">

      {/* Fixed Sidebar */}
      <aside
        className="hidden md:flex flex-col w-72 shrink-0 h-full border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 z-50"
      >
        <div className="h-16 shrink-0 flex items-center px-8 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
            <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 dark:shadow-none">
              <ShieldCheck className="w-5 h-5 text-white dark:text-black" strokeWidth={3} />
            </div>
            <span className="text-xl font-bold tracking-tight">VAULTLY</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-1">
            <SidebarItem href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} title="Dashboard" />
            <SidebarItem href="/transfer" icon={<ArrowRightLeft className="w-5 h-5" />} title="Transfer Funds" />
            <SidebarItem href="/transactions" icon={<Clock className="w-5 h-5" />} title="History" />
            <SidebarItem href="/p2ptransfer" icon={<Users className="w-5 h-5" />} title="P2P Transfer" />
          </nav>
        </div>

        <div className="p-4 shrink-0 border-t border-slate-200 dark:border-neutral-800">
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
      <div className="flex-1 relative flex flex-col h-full overflow-y-auto overflow-x-hidden scroll-smooth bg-neutral-50 dark:bg-black">

        {/* Appbar */}
        <AppbarClient />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
          {children}
        </main>
      </div>
    </div>
  );
}
