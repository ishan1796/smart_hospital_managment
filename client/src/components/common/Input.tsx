import React from "react";
import { clsx } from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>}
      <div className="relative rounded-lg shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={clsx(
            "block w-full rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:cursor-not-allowed",
            icon ? "pl-10 pr-3.5 py-2" : "px-3.5 py-2",
            error
              ? "border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-slate-300 text-slate-900 focus:border-teal-500 focus:ring-teal-500/20 hover:border-slate-400",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
};
