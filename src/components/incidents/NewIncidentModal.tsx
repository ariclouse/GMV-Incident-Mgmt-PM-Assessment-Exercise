"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Incident, MetaOptions, Priority, IncidentType } from "@/lib/types";
import { MAX_DESCRIPTION_LENGTH } from "@/lib/constants";
import { CURRENT_USER } from "@/lib/currentUser";
import { TYPE_ICONS } from "./TypeIcon";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";

const PRIORITY_PILL_STYLES: Record<Priority, { selected: string; unselected: string }> = {
  Low: {
    selected: "border-slate-500 bg-slate-500 text-white",
    unselected: "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
  },
  Medium: {
    selected: "border-blue-500 bg-blue-500 text-white",
    unselected: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  High: {
    selected: "border-orange-500 bg-orange-500 text-white",
    unselected: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
  },
  Critical: {
    selected: "border-red-500 bg-red-500 text-white",
    unselected: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  },
};

export default function NewIncidentModal({
  initialType,
  onChangeType,
  onClose,
  meta,
  onCreated,
}: {
  initialType: IncidentType;
  onChangeType: () => void;
  onClose: () => void;
  meta: MetaOptions | null;
  onCreated: (incident: Incident) => void;
}) {
  const [priority, setPriority] = useState<Priority>(
    initialType === "Emergency" ? "Critical" : "Medium"
  );
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [route, setRoute] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const vehicle = meta?.vehicles.find((v) => v.number === vehicleNumber);
  const TypeIconComponent = TYPE_ICONS[initialType];

  async function submit() {
    setSubmitting(true);
    const res = await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: initialType,
        priority,
        vehicleNumber,
        driverName: vehicle?.driverName ?? "",
        route,
        location,
        description: description ? `<p>${description}</p>` : "",
        createdBy: CURRENT_USER,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    onCreated(data.incident);
  }

  return (
    <Dialog onClose={onClose}>
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold text-slate-800">New Incident</h2>
        <Button variant="icon" aria-label="Close" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-4 px-6 py-5">
        <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <TypeIconComponent className="h-5 w-5 text-slate-600" />
            <span className="text-sm font-semibold text-slate-800">{initialType}</span>
          </div>
          <button
            type="button"
            onClick={onChangeType}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Change type
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Route">
            <select
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
            >
              <option value="">Select route</option>
              {meta?.routes.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Vehicle">
            <select
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
            >
              <option value="">Select vehicle</option>
              {meta?.vehicles.map((v) => (
                <option key={v.number} value={v.number}>
                  {v.number} — {v.driverName}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Location (optional)">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. 5th & Grand, Glendale, CA"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
        </Field>

        <label className="block">
          <span className="mb-1 flex items-baseline justify-between">
            <span className="text-xs font-semibold text-slate-600">Description</span>
            <span
              className={`text-xs ${
                description.length >= MAX_DESCRIPTION_LENGTH ? "text-red-500" : "text-slate-400"
              }`}
            >
              {description.length.toLocaleString()} / {MAX_DESCRIPTION_LENGTH.toLocaleString()}
            </span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={4}
            placeholder="What happened?"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
        </label>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-xs font-semibold text-slate-600">Severity</span>
            {initialType === "Emergency" && (
              <span className="text-xs text-slate-400">Auto-set to Critical for Emergency incidents.</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {meta?.priorities.map((p) => {
              const style = PRIORITY_PILL_STYLES[p];
              const selected = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  aria-pressed={selected}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                    selected ? style.selected : style.unselected
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={submit} disabled={!vehicleNumber || !route || submitting}>
          {submitting ? "Creating..." : "Create Incident"}
        </Button>
      </div>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}
