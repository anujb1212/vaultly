"use client";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useRef, useEffect } from "react";

export function AppbarClient() {
  const { data } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    if (showMenu) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showMenu]);

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-br from-indigo-100/90 via-purple-100/90 to-blue-100/90 dark:from-neutral-900/80 dark:via-neutral-950/80 dark:to-neutral-900/80 backdrop-blur-md flex items-center justify-between px-8 py-3 border-b border-gray-200 dark:border-neutral-700 shadow-sm">
      <div />
      <div className="flex items-center gap-6">
        <button className="relative text-primary-600 dark:text-primary-400" aria-label="Notifications">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.5 14V10a6.5 6.5 0 00-13 0v4c0 .417-.163.822-.445 1.122L3 17h12z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowMenu((show) => !show)}
            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center border border-gray-300 dark:border-neutral-600"
            aria-label="User menu"
          >
            <svg className="w-7 h-7 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="12" cy="8" r="4" fill="currentColor" />
              <path d="M4 20a8 8 0 0116 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-44 rounded bg-white dark:bg-neutral-800 shadow-lg text-gray-700 dark:text-gray-100 overflow-hidden py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-300 dark:border-neutral-700 text-sm font-medium">{data?.user?.name || "User"}</div>
              <button
                onClick={async () => {
                  setShowMenu(false);
                  await signOut({ callbackUrl: "/" });
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-neutral-700 text-sm text-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
