"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { IncidentType } from "@/lib/types";
import { TYPE_ICONS } from "./TypeIcon";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";

const TYPES: { type: IncidentType; hint: string; escalated?: boolean }[] = [
  { type: "Emergency", hint: "Life safety, fire, police", escalated: true },
  { type: "Service Disruption", hint: "Delay, detour, missed trip" },
  { type: "Rider Complaint", hint: "Conduct, fare, accessibility" },
  { type: "Mechanical", hint: "Breakdown, warning light" },
  { type: "Accident", hint: "Collision, contact, damage" },
  { type: "Other", hint: "Anything not listed" },
];

function statusText(selected: IncidentType | null) {
  if (!selected) return "Select a type to continue";
  if (selected === "Emergency") return "Emergency — dispatch is alerted on continue";
  return `${selected} selected`;
}

export default function IncidentTypeModal({
  onCancel,
  onContinue,
  showHints = true,
}: {
  onCancel: () => void;
  onContinue: (type: IncidentType) => void;
  showHints?: boolean;
}) {
  const [selected, setSelected] = useState<IncidentType | null>(null);

  return (
    <Dialog onClose={onCancel} maxWidthClassName="max-w-[680px]">
      <div className="flex items-start justify-between gap-5 border-b border-slate-100 px-6 py-5">
        <h2 className="text-[19px] font-semibold tracking-tight text-slate-900">
          Report an incident
        </h2>
        <Button variant="icon" aria-label="Close" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-col gap-3.5 px-6 py-6">
        <div className="flex items-baseline justify-between">
          <span
            id="incident-type-label"
            className="text-[13px] font-semibold uppercase tracking-wide text-slate-500"
          >
            Incident type
          </span>
          <span className="text-xs text-slate-400">Required</span>
        </div>

        <div
          role="radiogroup"
          aria-labelledby="incident-type-label"
          className="grid grid-cols-3 gap-3"
        >
          {TYPES.map(({ type, hint, escalated }) => {
            const Icon = TYPE_ICONS[type];
            const isSelected = selected === type;
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected((s) => (s === type ? null : type))}
                className={`flex flex-col items-center gap-2.5 rounded-[10px] border px-4 py-5 text-center transition duration-[120ms] hover:-translate-y-px ${
                  escalated
                    ? "border-red-200 bg-red-50 hover:border-red-400"
                    : "border-slate-200 bg-white hover:border-slate-400"
                } ${isSelected ? "ring-2 ring-inset ring-blue-600" : ""}`}
              >
                <Icon
                  className={`h-[34px] w-[34px] ${escalated ? "text-red-600" : "text-slate-600"}`}
                />
                <span
                  className={`text-[15px] ${
                    escalated ? "font-semibold text-slate-900" : "font-medium text-slate-700"
                  }`}
                >
                  {type}
                </span>
                {showHints && (
                  <span className="text-xs leading-snug text-slate-400">{hint}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50 px-6 py-4">
        <span className="text-[13px] text-slate-500">{statusText(selected)}</span>
        <div className="flex items-center gap-2.5">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!selected}
            onClick={() => selected && onContinue(selected)}
          >
            Continue
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
