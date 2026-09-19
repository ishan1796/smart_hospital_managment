import React from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  icon,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]";

  const sizes = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  const variants = {
    primary: "bg-teal-600 hover:bg-teal-700 text-white focus:ring-teal-500",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400 border border-slate-200",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500",
    danger: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500",
    outline: "border border-teal-600 text-teal-700 hover:bg-teal-50 focus:ring-teal-500",
    ghost: "text-slate-600 hover:bg-slate-100 shadow-none focus:ring-slate-400",
  };

  return (
    <button
      className={clsx(base, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
};
