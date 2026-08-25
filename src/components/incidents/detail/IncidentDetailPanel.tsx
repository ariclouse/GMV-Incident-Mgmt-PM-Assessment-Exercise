"use client";

import { useState } from "react";
import { ClipboardList, Paperclip, Bus } from "lucide-react";
import { Incident, MetaOptions } from "@/lib/types";
import DetailCommentTab from "./DetailCommentTab";
import AttachFilesTab from "./AttachFilesTab";
import VehicleHistoryTab from "./VehicleHistoryTab";
import ExportIncidentButton from "./ExportIncidentButton";

type Tab = "detail" | "attachments" | "vehicle";

const TABS: { key: Tab; label: string; icon: typeof ClipboardList }[] = [
  { key: "detail", label: "Detail & Comment", icon: ClipboardList },
  { key: "attachments", label: "Attach Files", icon: Paperclip },
  { key: "vehicle", label: "Vehicle History", icon: Bus },
];

export default function IncidentDetailPanel({
  incident,
  meta,
  onUpdate,
}: {
  incident: Incident;
  meta: MetaOptions | null;
  onUpdate: (incident: Incident) => void;
}) {
  const [tab, setTab] = useState<Tab>("detail");

  return (
    <div className="border-t border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-6 border-b border-slate-200 px-6">
        <div className="flex items-center gap-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 border-b-2 py-3 text-sm font-medium transition ${
                tab === key
                  ? "border-[#1b2436] text-[#1b2436]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab === key && <span>{label}</span>}
            </button>
          ))}
        </div>
        <ExportIncidentButton incident={incident} />
      </div>

      {tab === "detail" && (
        <DetailCommentTab incident={incident} meta={meta} onUpdate={onUpdate} />
      )}
      {tab === "attachments" && <AttachFilesTab incident={incident} onUpdate={onUpdate} />}
      {tab === "vehicle" && <VehicleHistoryTab incident={incident} />}
    </div>
  );
}
