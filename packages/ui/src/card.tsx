import { JSX } from "react";

export function Card({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}): JSX.Element {
  return (
    <div className="border border-gray-200 dark:border-neutral-700 p-6 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm">
      <h1 className="text-lg font-semibold border-b border-gray-200 dark:border-neutral-700 pb-2 text-neutral-800 dark:text-neutral-100">
        {title}
      </h1>
      <div className="pt-4">{children}</div>
    </div>
  );
}
