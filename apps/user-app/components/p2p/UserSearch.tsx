"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, Loader2, X } from "lucide-react";
import { searchUsers } from "../../app/lib/actions/searchUsers";

interface UserResult {
    id: number;
    name: string | null;
    number: string;
}

interface UserSearchProps {
    onSelect: (user: UserResult | null) => void;
    selectedUser: UserResult | null;
}

export const UserSearch = ({ onSelect, selectedUser }: UserSearchProps) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<UserResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce 
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 3) {
                setIsLoading(true);
                try {
                    const users = await searchUsers(query);
                    setResults(users);
                    setIsOpen(true);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (selectedUser) {
        return (
            <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
                <label className="text-sm font-medium text-slate-900 dark:text-white block">
                    Recipient
                </label>
                <div className="flex items-center justify-between p-3 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-700">
                            {selectedUser.name?.[0]?.toUpperCase() || <User size={20} />}
                        </div>
                        <div>
                            <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                                {selectedUser.name || "Vaultly User"}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                {selectedUser.number}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            onSelect(null);
                            setQuery("");
                        }}
                        className="p-2 hover:bg-white dark:hover:bg-neutral-800 rounded-full transition-colors text-slate-400 hover:text-rose-500"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div ref={wrapperRef} className="space-y-1 relative z-20">
            <label className="text-sm font-medium text-slate-900 dark:text-white block">
                Search User
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                    ) : (
                        <Search className="h-4 w-4 text-slate-400" />
                    )}
                </div>
                <input
                    type="text"
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900 pl-9"
                    placeholder="Enter name or mobile number"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-slate-200 dark:border-neutral-800 overflow-hidden max-h-60 overflow-y-auto z-50">
                    {results.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => {
                                onSelect(user);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-neutral-800 flex items-center gap-3 transition-colors duration-150 border-b last:border-0 border-slate-100 dark:border-neutral-800"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 shrink-0">
                                {user.name?.[0]?.toUpperCase() || <User size={14} />}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-900 dark:text-white">
                                    {user.name || "Vaultly User"}
                                </div>
                                <div className="text-xs text-slate-500 font-mono">
                                    {user.number}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
            {isOpen && results.length === 0 && query.length >= 3 && !isLoading && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-slate-200 dark:border-neutral-800 p-4 text-center text-sm text-slate-500 z-50">
                    No user found with that details.
                </div>
            )}
        </div>
    );
};
