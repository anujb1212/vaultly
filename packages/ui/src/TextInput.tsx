"use client";

interface TextInputProps {
    placeholder: string;
    onChange: (value: string) => void;
    label: string;
    type?: string;
    value?: string;
    customClass?: string;
    error?: string;
}

export const TextInput = ({
    placeholder,
    onChange,
    label,
    type = "text",
    value,
    customClass,
    error,
}: TextInputProps) => {
    return (
        <div className={`w-full ${customClass || ""}`}>
            <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-neutral-300">
                {label}
            </label>
            <input
                onChange={(e) => onChange(e.target.value)}
                type={type}
                value={value}
                className={`
          w-full bg-white dark:bg-neutral-950 text-slate-900 dark:text-white text-sm rounded-xl block p-3 transition-all placeholder:text-slate-400 dark:placeholder:text-neutral-600
          ${error
                        ? "border border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        : "border border-slate-200 dark:border-neutral-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    }
        `}
                placeholder={placeholder}
            />
            {error && (
                <div className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                    {error}
                </div>
            )}
        </div>
    );
};
