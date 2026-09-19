import React from "react";
import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  className,
  bodyClassName,
}) => {
  return (
    <div className={clsx("bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden", className)}>
      {(title || action) && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            {typeof title === "string" ? (
              <h3 className="font-semibold text-slate-800 text-base">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={clsx("p-5", bodyClassName)}>{children}</div>
    </div>
  );
};
