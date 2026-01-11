"use client";

export const Select = ({
    options,
    onSelect,
    label
}: {
    onSelect: (value: string) => void;
    options: { key: string; value: string }[];
    label?: string;
}) => {
    return (
        <div className="w-full">
            {label && <label className="block mb-2 text-sm font-medium text-slate-700 dark:text-neutral-300">{label}</label>}
            <select
                onChange={(e) => onSelect(e.target.value)}
                className="w-full bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-3 transition-colors cursor-pointer"
            >
                {options.map((option) => (
                    <option key={option.key} value={option.key}>
                        {option.value}
                    </option>
                ))}
            </select>
        </div>
    );
};
