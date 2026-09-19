import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon = <Inbox className="w-10 h-10 text-slate-300" />,
}) => {
  return (
    <div className="text-center py-12 px-4 flex flex-col items-center justify-center">
      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-3">{icon}</div>
      <h4 className="text-base font-semibold text-slate-700">{title}</h4>
      {description && <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};
