"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import { Incident } from "@/lib/types";
import { ExportScope, exportIncidentListCsv, exportIncidentListPdf, filterByScope } from "@/lib/export";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";

const SCOPE_OPTIONS: { value: ExportScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

export default function ExportIncidentsModal({
  incidents,
  onClose,
}: {
  incidents: Incident[];
  onClose: () => void;
}) {
  const [scope, setScope] = useState<ExportScope>("all");
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [exporting, setExporting] = useState(false);

  const count = filterByScope(incidents, scope).length;

  async function handleExport() {
    setExporting(true);
    if (format === "csv") {
      exportIncidentListCsv(incidents, scope);
    } else {
      await exportIncidentListPdf(incidents, scope);
    }
    setExporting(false);
    onClose();
  }

  return (
    <Dialog onClose={onClose} maxWidthClassName="max-w-md">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold text-slate-800">Export Incidents</h2>
      </div>

      <div className="space-y-5 px-6 py-5">
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-600">Which incidents?</p>
          <div className="flex gap-2">
            {SCOPE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setScope(o.value)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  scope === o.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-slate-600">Format</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormat("csv")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                format === "csv"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </button>
            <button
              type="button"
              onClick={() => setFormat("pdf")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                format === "pdf"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          {count} incident{count === 1 ? "" : "s"} will be exported.
        </p>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleExport} disabled={exporting || count === 0}>
          <span className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export"}
          </span>
        </Button>
      </div>
    </Dialog>
  );
}
