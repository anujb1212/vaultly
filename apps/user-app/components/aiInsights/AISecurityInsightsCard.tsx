// "use client";

// import Link from "next/link";
// import { ShieldAlert, Sparkles, ChevronRight, Eye } from "lucide-react";
// import { useEffect, useState } from "react";

// type AIInsightSeverity = "LOW" | "MEDIUM" | "HIGH";
// type AIInsightStatus = "COMPLETED" | "FAILED";

// type AISecurityInsightItem = {
//     id: number;
//     createdAt: string;
//     severity: AIInsightSeverity;
//     title: string;
//     summary: string;
//     recommendedActions: string[];
//     status: AIInsightStatus;
// };

// function formatTimeAgo(iso: string) {
//     const diff = Date.now() - new Date(iso).getTime();
//     const minutes = Math.floor(diff / 60000);
//     if (minutes < 60) return `${minutes}m ago`;
//     const hours = Math.floor(minutes / 60);
//     if (hours < 24) return `${hours}h ago`;
//     return new Date(iso).toLocaleDateString("en-IN", {
//         month: "short",
//         day: "numeric",
//     });
// }

// const severityConfig = {
//     HIGH: {
//         bg: "bg-rose-500/10 dark:bg-rose-500/20",
//         text: "text-rose-700 dark:text-rose-300",
//         border: "border-rose-200 dark:border-rose-500/30",
//     },
//     MEDIUM: {
//         bg: "bg-amber-500/10 dark:bg-amber-500/20",
//         text: "text-amber-700 dark:text-amber-300",
//         border: "border-amber-200 dark:border-amber-500/30",
//     },
//     LOW: {
//         bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
//         text: "text-emerald-700 dark:text-emerald-300",
//         border: "border-emerald-200 dark:border-emerald-500/30",
//     },
// };

// export function AISecurityInsightsCard({ limit = 3 }: { limit?: number }) {
//     const [isRevealed, setIsRevealed] = useState(false);
//     const [items, setItems] = useState<AISecurityInsightItem[]>([]);
//     const [isLoading, setIsLoading] = useState(false);
//     const [hasLoaded, setHasLoaded] = useState(false);

//     useEffect(() => {
//         if (!isRevealed || hasLoaded) return;

//         let isMounted = true;
//         async function load() {
//             setIsLoading(true);
//             try {
//                 const res = await fetch(`/api/user/security/insights?limit=${limit}`);
//                 if (!res.ok) throw new Error();
//                 const data = await res.json();
//                 if (isMounted) {
//                     setItems(data.items || []);
//                     setHasLoaded(true);
//                 }
//             } catch (e) {
//                 // Silent fail, user can try again by refreshing page 
//             } finally {
//                 if (isMounted) setIsLoading(false);
//             }
//         }
//         load();
//         return () => {
//             isMounted = false;
//         };
//     }, [isRevealed, hasLoaded, limit]);

//     return (
//         <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 backdrop-blur-sm p-8 shadow-lg shadow-indigo-500/5">
//             <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />

//             <div className="relative z-10">
//                 <div className="flex items-center justify-between mb-6">
//                     <div className="flex items-center gap-3">
//                         <div className="p-2 bg-indigo-50 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-neutral-800 border border-indigo-100 dark:border-indigo-500/20 rounded-xl shadow-sm">
//                             <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
//                         </div>
//                         <div>
//                             <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
//                                 Security Insights
//                             </h3>
//                             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
//                                 AI-Powered Monitoring
//                             </p>
//                         </div>
//                     </div>
//                     {isRevealed && (
//                         <Link
//                             href="/settings/security"
//                             className="group flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
//                         >
//                             Details{" "}
//                             <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
//                         </Link>
//                     )}
//                 </div>

//                 {!isRevealed ? (
//                     <div className="flex flex-col items-center justify-center py-6 text-center">
//                         <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-[240px]">
//                             Review AI-generated security analysis for your account activity.
//                         </p>
//                         <button
//                             onClick={() => setIsRevealed(true)}
//                             className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
//                         >
//                             <Eye className="w-4 h-4" />
//                             Reveal Insights
//                         </button>
//                     </div>
//                 ) : isLoading ? (
//                     <div className="space-y-3">
//                         {[1, 2].map((i) => (
//                             <div
//                                 key={i}
//                                 className="h-20 rounded-2xl bg-slate-100 dark:bg-neutral-800/50 animate-pulse"
//                             />
//                         ))}
//                     </div>
//                 ) : items.length === 0 ? (
//                     <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in slide-in-from-bottom-2">
//                         <div className="p-3 bg-slate-50 dark:bg-neutral-800 rounded-full mb-3">
//                             <Sparkles className="w-5 h-5 text-slate-400" />
//                         </div>
//                         <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
//                             All systems secure
//                         </p>
//                         <p className="text-xs text-slate-400">No anomalies detected.</p>
//                     </div>
//                 ) : (
//                     <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
//                         {items.map((it) => {
//                             const style = severityConfig[it.severity];
//                             return (
//                                 <div
//                                     key={it.id}
//                                     className="group relative rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-neutral-900/40 p-4 hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors"
//                                 >
//                                     <div className="flex justify-between items-start mb-2">
//                                         <span
//                                             className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border ${style.bg} ${style.text} ${style.border}`}
//                                         >
//                                             {it.severity}
//                                         </span>
//                                         <span className="text-[10px] font-medium text-slate-400">
//                                             {formatTimeAgo(it.createdAt)}
//                                         </span>
//                                     </div>
//                                     <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
//                                         {it.title}
//                                     </h4>
//                                     <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
//                                         {it.summary}
//                                     </p>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }
