import { JSX } from "react";

export function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div className={`border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-3xl p-6 ${className || ""}`}>
      {title && (
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {title}
        </h2>
      )}
      <div>{children}</div>
    </div>
  );
}
