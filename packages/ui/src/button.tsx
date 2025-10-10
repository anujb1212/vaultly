"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  onClick?: () => void;
}

export const Button = ({ children, onClick, type = "button", disabled = false, className, ...rest }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={clsx(
        "text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};
