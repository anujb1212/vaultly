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
    <header className="sticky top-0 z-40 w-full bg-[#181B31] flex items-center justify-between px-10 h-16 border-b border-[#232743]">
      <div className="text-2xl font-extrabold tracking-tight text-white select-none">VAULTLY</div>
      <div className="flex items-center gap-6">
        <button className="relative">
          <svg className="w-6 h-6 text-[#aac3f7]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.5 14V10a6.5 6.5 0 00-13 0v4c0 .417-.163.822-.445 1.122L3 17h12z" />
          </svg>
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
        <div ref={menuRef} className="relative">
          <button onClick={() => setShowMenu((v) => !v)} className="w-10 h-10 rounded-full bg-[#232743] flex items-center justify-center border border-[#353964]">
            <svg className="w-7 h-7 text-[#aac3f7]" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="12" cy="8" r="4" fill="#aac3f7" />
              <path stroke="#aac3f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 20a8 8 0 0116 0" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-44 rounded bg-white shadow text-gray-700 overflow-hidden py-2 z-50">
              <div className="px-4 py-2 border-b text-sm font-medium">{data?.user?.name || "User"}</div>
              <button onClick={async () => { setShowMenu(false); await signOut({ redirect: false }); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600">Logout</button>
            </div>
          )}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
