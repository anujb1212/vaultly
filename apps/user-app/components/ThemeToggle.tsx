"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const currentTheme = theme === "system" ? systemTheme : theme;

    return (
        <button
            aria-label="Toggle theme"
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full p-2 shadow hover:scale-110 transition"
        >
            {currentTheme === "dark" ? (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path
                        d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            ) : (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="currentColor" />
                </svg>
            )}
        </button>
    );
}
