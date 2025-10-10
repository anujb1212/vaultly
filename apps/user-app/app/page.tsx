"use client";

import { useRouter } from "next/navigation";
import { ThemeToggle } from "../components/ThemeToggle";

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Layered gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"></div>
        <div className="absolute inset-0 bg-gradient-radial from-indigo-300/40 via-transparent to-transparent dark:from-indigo-900/40"></div>
      </div>
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      {/* Hero Card */}
      <div className="z-10 text-center space-y-6 p-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100 dark:border-gray-800 max-w-md w-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-8 animate-bounce" width="64" height="64" fill="none" viewBox="0 0 24 24">
          <rect x="2" y="6" width="20" height="12" rx="3" fill="#6366f1" />
          <rect x="2" y="10" width="20" height="2" fill="#a5b4fc" />
          <rect x="6" y="16" width="6" height="2" rx="1" fill="#fff" />
        </svg>
        <h1 className="text-5xl font-extrabold text-indigo-700 dark:text-indigo-200 drop-shadow-sm">
          Vaultly
        </h1>
        <h2 className="text-base text-indigo-400 dark:text-indigo-300 font-semibold tracking-wide mb-2">
          Your Wallet, Reimagined.
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Experience seamless payments and effortless money management.
        </p>
        <div className="flex gap-6 justify-center mt-6">
          <button
            onClick={() => router.push("/signup")}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 dark:from-indigo-700 dark:to-blue-800 text-white font-semibold rounded-lg shadow-md hover:scale-105 hover:shadow-lg transition-transform duration-200"
          >
            Sign Up
          </button>
          <button
            onClick={() => router.push("/signin")}
            className="px-6 py-3 border-2 border-indigo-500 dark:border-indigo-300 text-indigo-600 dark:text-indigo-200 font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-800 hover:scale-105 transition-transform duration-200"
          >
            Sign In
          </button>
        </div>
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center hover:scale-105 hover:shadow-indigo-300 transition-all duration-300 border border-indigo-50 dark:border-gray-700">
            <span className="text-2xl mb-2 text-indigo-500 dark:text-indigo-300">⚡</span>
            <span className="font-semibold text-indigo-700 dark:text-indigo-200 mb-1 text-sm">Instant Payments</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center hover:scale-105 hover:shadow-indigo-300 transition-all duration-300 border border-indigo-50 dark:border-gray-700">
            <span className="text-2xl mb-2 text-indigo-500 dark:text-indigo-300">🔒</span>
            <span className="font-semibold text-indigo-700 dark:text-indigo-200 mb-1 text-sm">Private & Secure</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center hover:scale-105 hover:shadow-indigo-300 transition-all duration-300 border border-indigo-50 dark:border-gray-700">
            <span className="text-2xl mb-2 text-indigo-500 dark:text-indigo-300">💳</span>
            <span className="font-semibold text-indigo-700 dark:text-indigo-200 mb-1 text-sm">Multi-Bank Support</span>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="z-10 absolute bottom-2 left-0 right-0 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
        Vaultly is secure & private. © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
