"use client";

import { useState } from "react";
import { Table2, BarChart3, X, Pencil } from "lucide-react";
import { CountItem } from "@/lib/insights";

export default function ChartCard({
  title,
  subtitle,
  tableData,
  valueHeader = "Count",
  dragHandle,
  onEdit,
  onRemove,
  children,
}: {
  title: string;
  subtitle?: string;
  tableData?: CountItem[];
  valueHeader?: string;
  dragHandle?: React.ReactNode;
  onEdit?: () => void;
  onRemove?: () => void;
  children: React.ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);

  return (
    <figure className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-1.5">
          {dragHandle}
          <div>
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {tableData && (
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              title={showTable ? "View as chart" : "View as table"}
              aria-label={showTable ? "View as chart" : "View as table"}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              {showTable ? <BarChart3 className="h-4 w-4" /> : <Table2 className="h-4 w-4" />}
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              title="Edit this dashboard"
              aria-label="Edit this dashboard"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              title="Remove this dashboard"
              aria-label="Remove this dashboard"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1">
        {showTable && tableData ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-semibold">Category</th>
                <th className="pb-2 font-semibold">{valueHeader}</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.label} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 text-slate-700">{row.label}</td>
                  <td className="py-1.5 font-semibold tabular-nums text-slate-800">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          children
        )}
      </div>
    </figure>
  );
}
