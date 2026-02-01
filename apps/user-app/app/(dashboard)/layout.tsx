"use client";

import { AppbarClient } from "../../components/AppbarClient";
import { SidebarItem } from "../../components/SidebarItem";
import { LayoutDashboard, ArrowRightLeft, Clock, Users, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-black font-sans text-slate-900 dark:text-slate-50 overflow-hidden selection:bg-indigo-100 dark:selection:bg-indigo-900">

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/20 via-slate-50 to-slate-50 dark:from-indigo-900/20 dark:via-black dark:to-black" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-100/30 dark:bg-violet-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>
      <aside className="relative hidden md:flex flex-col w-72 shrink-0 h-full border-r border-slate-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl z-[50]">

        <div className="h-16 shrink-0 flex items-center px-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="group flex items-center gap-2.5 outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 text-white dark:text-black grid place-items-center font-bold text-lg shadow-lg shadow-indigo-500/20 dark:shadow-none group-hover:scale-95 transition-transform duration-200">
              V
            </div>
            <span className="font-bold tracking-tight text-lg text-slate-900 dark:text-white">Vaultly</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-8 px-4">
          <p className="px-4 text-xs font-semibold text-slate-400 dark:text-neutral-500 tracking-wider mb-4 uppercase">Menu</p>
          <nav className="space-y-1">
            <SidebarItem href="/dashboard" icon={<LayoutDashboard className="w-5 h-5" strokeWidth={1.5} />} title="Dashboard" />
            <SidebarItem href="/transfer" icon={<ArrowRightLeft className="w-5 h-5" strokeWidth={1.5} />} title="Transfer Funds" />
            <SidebarItem href="/transactions" icon={<Clock className="w-5 h-5" strokeWidth={1.5} />} title="History" />
            <SidebarItem href="/p2ptransfer" icon={<Users className="w-5 h-5" strokeWidth={1.5} />} title="P2P Transfer" />
          </nav>
        </div>

        {/* User Status Card */}
        <div className="p-4 shrink-0">
          <div className="relative overflow-hidden bg-white/40 dark:bg-neutral-800/40 rounded-2xl p-4 border border-slate-200/50 dark:border-neutral-700/50 backdrop-blur-sm group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-colors" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Verified</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">Tier 1 • Limit ₹1L</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col h-full overflow-hidden z-0">
        <AppbarClient />

        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-none relative z-0">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
