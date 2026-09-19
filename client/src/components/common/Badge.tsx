import React from "react";
import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "primary";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "sm",
  dot = false,
  className,
}) => {
  const base = "inline-flex items-center font-semibold rounded-full";

  const sizes = {
    sm: "px-2.5 py-0.5 text-xs gap-1.5",
    md: "px-3 py-1 text-xs gap-2",
  };

  const variants = {
    primary: "bg-teal-50 text-teal-700 border border-teal-200",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border border-amber-200",
    danger: "bg-rose-50 text-rose-700 border border-rose-200",
    info: "bg-sky-50 text-sky-700 border border-sky-200",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
  };

  const dotColors = {
    primary: "bg-teal-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-sky-500",
    neutral: "bg-slate-400",
  };

  return (
    <span className={clsx(base, sizes[size], variants[variant], className)}>
      {dot && <span className={clsx("w-1.5 h-1.5 rounded-full", dotColors[variant])} />}
      {children}
    </span>
  );
};
