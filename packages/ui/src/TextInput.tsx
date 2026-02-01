"use client";

export const TextInput = ({
    placeholder,
    onChange,
    label,
    type = "text",
    value,
    className
}: {
    placeholder: string;
    onChange: (value: string) => void;
    label: string;
    type?: string;
    value?: string;
    className?: string
}) => {
    return (
        <div className="w-full">
            <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-neutral-300">
                {label}
            </label>
            <input
                onChange={(e) => onChange(e.target.value)}
                type={type}
                value={value}
                className="w-full bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-3 transition-colors placeholder:text-slate-400 dark:placeholder:text-neutral-600"
                placeholder={placeholder}
            />
        </div>
    );
};
