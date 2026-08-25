"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Incident } from "@/lib/types";
import { exportSingleIncidentCsv, exportSingleIncidentPdfFile } from "@/lib/export";

export default function ExportIncidentButton({ incident }: { incident: Incident }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExport(format: "csv" | "pdf") {
    setExporting(true);
    if (format === "csv") {
      exportSingleIncidentCsv(incident);
    } else {
      await exportSingleIncidentPdfFile(incident);
    }
    setExporting(false);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={exporting}
        className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-40 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => handleExport("csv")}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <FileSpreadsheet className="h-4 w-4 text-slate-400" />
              Export as CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <FileText className="h-4 w-4 text-slate-400" />
              Export as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
