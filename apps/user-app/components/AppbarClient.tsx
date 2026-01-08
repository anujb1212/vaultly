"use client";

import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useRef, useEffect } from "react";
import { Bell, LogOut, Settings, User, ChevronDown } from "lucide-react";

export function AppbarClient() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showMenu]);

  // Get user initials
  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-neutral-800 transition-all duration-300">
      <div className="flex items-center justify-between px-6 h-16 max-w-7xl mx-auto w-full">

        {/* Left: Mobile Toggle (Hidden on Desktop) or Breadcrumbs could go here */}
        <div className="flex items-center gap-2 md:hidden">
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Vaultly</span>
        </div>
        <div className="hidden md:block"></div> {/* Spacer */}

        {/* Right Actions */}
        <div className="flex items-center gap-3 md:gap-4">

          <ThemeToggle />

          {/* Notifications */}
          <button
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white dark:border-neutral-900" />
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-neutral-800 mx-1 hidden md:block"></div>

          {/* Profile Dropdown */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full border border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all group"
            >
              <div className="hidden md:flex flex-col items-end mr-1">
                <span className="text-xs font-semibold text-slate-700 dark:text-neutral-200">
                  {session?.user?.name?.split(' ')[0] || "User"}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shadow-sm">
                {userInitials}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white dark:bg-neutral-900 shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-neutral-800 overflow-hidden ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/50">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {session?.user?.name || "Vaultly User"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-neutral-500 truncate">
                    {session?.user?.email || "user@vaultly.com"}
                  </p>
                </div>

                <div className="p-1">
                  <button className="w-full px-3 py-2 flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button className="w-full px-3 py-2 flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                </div>

                <div className="p-1 border-t border-slate-100 dark:border-neutral-800">
                  <button
                    onClick={async () => {
                      setShowMenu(false);
                      await signOut({ callbackUrl: "/" });
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
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
