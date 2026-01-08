"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger";
}

export const Button = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  className,
  ...rest
}: ButtonProps) => {

  const variants = {
    primary: "bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-200 dark:shadow-none dark:bg-white dark:text-black dark:hover:bg-slate-200",
    secondary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 dark:shadow-none",
    outline: "bg-transparent border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  };

  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none px-5 py-2.5",
        variants[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};
