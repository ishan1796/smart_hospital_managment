import React from "react";
import { clsx } from "clsx";

interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No records found.",
  onRowClick,
  className,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={clsx("overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm", className)}>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            {columns.map((col, idx) => (
              <th key={idx} className={clsx("py-3 px-4", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick && onRowClick(row)}
              className={clsx(
                "transition-colors duration-100",
                onRowClick ? "cursor-pointer hover:bg-teal-50/40" : "hover:bg-slate-50/60"
              )}
            >
              {columns.map((col, idx) => {
                let cellContent: React.ReactNode;
                if (typeof col.accessor === "function") {
                  cellContent = col.accessor(row);
                } else if (col.accessor) {
                  cellContent = row[col.accessor] as unknown as React.ReactNode;
                } else {
                  cellContent = null;
                }
                return (
                  <td key={idx} className={clsx("py-3 px-4 text-slate-700", col.className)}>
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
