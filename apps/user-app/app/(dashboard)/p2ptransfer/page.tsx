import { SendMoneyCard } from "../../../components/p2p/SendMoneyCard";

export default function P2PTransferPage() {
    return (
        <div className="w-full min-h-[calc(100vh-100px)] flex flex-col items-center justify-center py-10 px-4 animate-fade-in">
            <div className="w-full max-w-[28rem]">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
                        Send Money
                    </h1>
                    <p className="text-slate-500 dark:text-white/60 mt-3 font-medium">
                        Instant peer-to-peer transfers to anyone on Vaultly.
                    </p>
                </div>
                
                <div className="relative group isolate">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-[2.5rem] opacity-20 blur-2xl dark:opacity-30 group-hover:opacity-40 dark:group-hover:opacity-50 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="relative">
                        <SendMoneyCard />
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400 dark:text-white/40 flex items-center justify-center gap-2 font-bold tracking-[0.15em] uppercase">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Secure 256-bit encrypted transfer
                    </p>
                </div>
            </div>
        </div>
    );
}
