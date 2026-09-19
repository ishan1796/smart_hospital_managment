import React from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

export const LoadingSpinner: React.FC<{ size?: "sm" | "md" | "lg"; label?: string; className?: string }> = ({
  size = "md",
  label = "Loading data...",
  className,
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={clsx("flex flex-col items-center justify-center p-8 text-slate-500", className)}>
      <Loader2 className={clsx("animate-spin text-teal-600 mb-2", sizes[size])} />
      {label && <p className="text-xs font-medium text-slate-500 animate-pulse">{label}</p>}
    </div>
  );
};
