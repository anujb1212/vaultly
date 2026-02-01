"use client";

import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useRef, useEffect } from "react";
import { Bell, LogOut, Settings, User, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export function AppbarClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showMenu]);

  const userInitials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-[40] w-full border-b border-slate-200/40 dark:border-neutral-800/40 bg-white/60 dark:bg-black/60 backdrop-blur-xl backdrop-saturate-150 transition-all">
      <div className="flex items-center justify-between px-6 h-16 w-full max-w-7xl mx-auto">

        <div className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
            <span className="text-white dark:text-black font-bold text-lg">V</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Vaultly</span>
        </div>

        <div className="hidden md:block" />

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {/* <button
            className="group relative p-2 rounded-xl text-slate-500 hover:bg-slate-100/80 hover:text-slate-700 dark:text-neutral-400 dark:hover:bg-neutral-800/80 dark:hover:text-white transition-all duration-200"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[1.5]" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-black scale-100 group-hover:scale-110 transition-transform" />
          </button> */}

          <div className="h-6 w-px bg-slate-200/60 dark:bg-neutral-800/60 mx-1 hidden md:block" />

          {/* User Menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100/50 dark:hover:bg-neutral-800/50 transition-colors group"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 p-[1px] shadow-sm">
                <div className="h-full w-full rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {userInitials}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl bg-white/90 dark:bg-neutral-900/95 backdrop-blur-xl shadow-2xl shadow-slate-200/50 dark:shadow-black/80 border border-slate-100 dark:border-neutral-800 ring-1 ring-black/5 focus:outline-none z-[100] animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {session?.user?.name || "Vaultly User"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-neutral-500 truncate mt-0.5 font-medium">
                    {session?.user?.email || "user@vaultly.com"}
                  </p>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => { setShowMenu(false); router.push("/profile"); }}
                    className="w-full px-3 py-2.5 flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all"
                  >
                    <User className="w-4 h-4 stroke-[1.5]" /> Profile
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); router.push("/settings"); }}
                    className="w-full px-3 py-2.5 flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all"
                  >
                    <Settings className="w-4 h-4 stroke-[1.5]" /> Settings
                  </button>
                </div>

                <div className="p-1.5 border-t border-slate-100 dark:border-neutral-800">
                  <button
                    onClick={async () => {
                      setShowMenu(false);
                      await signOut({ callbackUrl: "/" });
                    }}
                    className="w-full px-3 py-2.5 flex items-center gap-3 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all"
                  >
                    <LogOut className="w-4 h-4 stroke-[1.5]" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
