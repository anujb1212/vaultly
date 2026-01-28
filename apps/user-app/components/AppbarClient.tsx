"use client";

import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useRef, useEffect } from "react";
import { Bell, LogOut, Settings, User } from "lucide-react";
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
    <header className="sticky top-0 z-[100] w-full border-b border-slate-200/50 dark:border-neutral-800/50 bg-white/70 dark:bg-black/70 backdrop-blur-xl transition-all duration-300 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/60">
      <div className="flex items-center justify-between px-6 h-16 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 md:hidden">
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Vaultly</span>
        </div>
        <div className="hidden md:block" />

        <div className="flex items-center gap-3 md:gap-4">
          <ThemeToggle />

          <button
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white dark:border-neutral-900" />
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-neutral-800 mx-1 hidden md:block" />

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full border border-slate-200/50 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all group relative z-50"
            >
              <div className="hidden md:flex flex-col items-end mr-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-neutral-200">
                  {session?.user?.name?.split(" ")[0] || "User"}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-transparent group-hover:ring-slate-200 dark:group-hover:ring-neutral-700 transition-all">
                {userInitials}
              </div>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl shadow-slate-200/50 dark:shadow-black/80 border border-slate-100 dark:border-neutral-800 ring-1 ring-black/5 focus:outline-none z-[200] animate-in fade-in zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/50 rounded-t-2xl">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {session?.user?.name || "Vaultly User"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-neutral-500 truncate mt-0.5 font-medium">
                    {session?.user?.email || "user@repo.com"}
                  </p>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => { setShowMenu(false); router.push("/settings"); }}
                    className="w-full px-3 py-2.5 flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all"
                  >
                    <User className="w-4 h-4" /> Profile
                  </button>

                  <button
                    onClick={() => { setShowMenu(false); router.push("/settings"); }}
                    className="w-full px-3 py-2.5 flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all"
                  >
                    <Settings className="w-4 h-4" /> Settings
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
                    <LogOut className="w-4 h-4" /> Sign out
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
