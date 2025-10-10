"use client";

export const Select = ({
    options,
    onSelect,
}: {
    onSelect: (value: string) => void;
    options: { key: string; value: string }[];
}) => {
    return (
        <select
            onChange={(e) => onSelect(e.target.value)}
            className="bg-gray-50 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        >
            {options.map((option) => (
                <option key={option.key} value={option.key}>
                    {option.value}
                </option>
            ))}
        </select>
    );
};
