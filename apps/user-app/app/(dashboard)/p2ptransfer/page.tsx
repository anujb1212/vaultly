import { SendMoneyCard } from "../../../components/p2p/SendMoneyCard";

export default function P2PTransferPage() {
    return (
        <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Send Money
                    </h1>
                    <p className="text-slate-500 dark:text-neutral-400 mt-2">
                        Instant peer-to-peer transfers to anyone on Vaultly.
                    </p>
                </div>
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-[2rem] opacity-20 blur-2xl dark:opacity-40"></div>
                    <div className="relative">
                        <SendMoneyCard />
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400 dark:text-neutral-500 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Secure 256-bit encrypted transfer
                    </p>
                </div>
            </div>
        </div>
    );
}
