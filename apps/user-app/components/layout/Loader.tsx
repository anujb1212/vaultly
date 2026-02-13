"use client";

interface LoaderProps {
    message?: string;
}

export function Loader({ message = "Processing securely..." }: LoaderProps) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative flex flex-col items-center gap-6">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-[ping_2s_ease-in-out_infinite]" />
                    <div className="absolute inset-2 rounded-full border-2 border-white/30 animate-[ping_2s_ease-in-out_infinite_0.5s]" />
                    <div className="absolute inset-4 rounded-full border-2 border-white/40 animate-[ping_2s_ease-in-out_infinite_1s]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.5)] animate-pulse" />
                    </div>
                </div>

                <div className="text-white font-medium text-sm tracking-wide animate-pulse">
                    {message}
                </div>
            </div>
        </div>
    );
}
