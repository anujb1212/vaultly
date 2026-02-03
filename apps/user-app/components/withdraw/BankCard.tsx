"use client";

import { Check, Wifi } from "lucide-react";

interface BankCardProps {
    bankName: string;
    accountNumber: string;
    balance: number;
    colorFrom: string;
    colorTo: string;
    isSelected: boolean;
    onSelect: () => void;
    showBalance: boolean;
}

export const BankCard = ({
    bankName,
    accountNumber,
    balance,
    colorFrom,
    colorTo,
    isSelected,
    onSelect,
    showBalance
}: BankCardProps) => {
    return (
        <div
            onClick={onSelect}
            className={`relative w-full aspect-[1.586/1] min-h-[200px] rounded-[1.5rem] overflow-hidden cursor-pointer transition-all duration-300 group select-none
        ${isSelected
                    ? 'ring-4 ring-offset-4 ring-indigo-500/40 scale-[1.02] shadow-2xl z-10 translate-y-[-4px]'
                    : 'hover:scale-[1.02] hover:shadow-xl hover:opacity-100 opacity-90'
                }
        dark:ring-offset-neutral-950
      `}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${colorFrom} ${colorTo} z-0`} />

            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light filter contrast-150"></div>
            <div className="absolute -top-[50%] -right-[50%] w-[100%] h-[100%] bg-white/10 blur-[80px] rounded-full pointer-events-none mix-blend-overlay"></div>

            <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">

                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-extrabold text-2xl text-white tracking-tight drop-shadow-md leading-none">
                            {bankName}
                        </h3>
                        <span className="text-[10px] uppercase tracking-[0.15em] opacity-80 mt-1 font-medium block">
                            Platinum Debit
                        </span>
                    </div>

                    <div className={`
              w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300
              ${isSelected
                            ? 'bg-white text-indigo-600 shadow-lg scale-110'
                            : 'bg-white/10 border border-white/20'
                        }
          `}>
                        {isSelected && <Check className="w-4 h-4 stroke-[4]" />}
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-2">
                    <div className="w-12 h-9 rounded-md border border-white/20 bg-gradient-to-br from-yellow-100/30 to-yellow-500/30 backdrop-blur-sm relative overflow-hidden shadow-inner">
                        <div className="absolute inset-0 border border-white/10 rounded-md"></div>
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/30"></div>
                        <div className="absolute left-1/3 top-0 h-full w-[1px] bg-white/30"></div>
                        <div className="absolute right-1/3 top-0 h-full w-[1px] bg-white/30"></div>
                    </div>
                    <Wifi className="w-6 h-6 opacity-60 rotate-90" />
                </div>

                <div className="flex justify-between items-end mt-auto pt-4">

                    <div>
                        <p className="font-mono text-lg tracking-widest opacity-95 shadow-sm">
                            {accountNumber}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider opacity-75 mt-1">
                            {showBalance ? "Available Balance" : "Hidden"}
                        </p>
                    </div>

                    {showBalance && (
                        <div className="text-right">
                            <span className="text-xl font-bold tracking-tight drop-shadow-md bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm block">
                                ₹{(balance / 100).toLocaleString('en-IN')}
                            </span>
                        </div>
                    )}

                    {!showBalance && (
                        <div className="flex items-center justify-center relative w-10 h-6 opacity-80">
                            <div className="absolute right-3 w-6 h-6 bg-white/80 rounded-full mix-blend-overlay"></div>
                            <div className="absolute right-0 w-6 h-6 bg-white/50 rounded-full mix-blend-overlay"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
