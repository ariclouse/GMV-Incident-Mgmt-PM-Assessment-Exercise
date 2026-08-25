"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Incident, Status } from "@/lib/types";
import { CURRENT_USER } from "@/lib/currentUser";
import { apiFetch } from "@/lib/apiClient";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";

const STEPS: Status[] = ["Open", "In Review", "Closed"];

const ACTIVE_STYLES: Record<Status, string> = {
  Open: "bg-slate-200 text-slate-800 border-slate-200",
  "In Review": "border-blue-400 text-blue-700 bg-blue-50",
  Closed: "border-green-400 text-green-700 bg-green-50",
};

function isStepDisabled(step: Status, currentStatus: Status): boolean {
  // Can't skip straight from Open to Closed — must pass through In Review first.
  return step === "Closed" && currentStatus === "Open";
}

export default function UpdateStatusModal({
  incident,
  onClose,
  onUpdate,
}: {
  incident: Incident;
  onClose: () => void;
  onUpdate: (incident: Incident) => void;
}) {
  const [pendingStatus, setPendingStatus] = useState<Status>(incident.status);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusChanged = pendingStatus !== incident.status;
  const hasComment = comment.trim().length > 0;
  const canSave = statusChanged || hasComment;

  async function handleSave() {
    setSaving(true);
    setError(null);
    let latest = incident;

    try {
      if (statusChanged) {
        const data = await apiFetch<{ incident: Incident }>(`/api/incidents/${incident.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: pendingStatus }),
        });
        latest = data.incident;
      }

      if (hasComment) {
        const data = await apiFetch<{ incident: Incident }>(`/api/incidents/${incident.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: comment.trim(), author: CURRENT_USER }),
        });
        latest = data.incident;
      }

      onUpdate(latest);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog onClose={onClose} maxWidthClassName="max-w-md">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold text-slate-800">
          Update Status — Incident {incident.id}
        </h2>
        <Button variant="icon" aria-label="Close" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-8">
        <div className="flex items-center gap-3">
          {STEPS.map((step, i) => {
            const disabled = isStepDisabled(step, pendingStatus);
            return (
              <div key={step} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => !disabled && setPendingStatus(step)}
                  disabled={disabled}
                  title={disabled ? "Move to In Review before closing an incident." : undefined}
                  className={`w-28 rounded-md border px-4 py-3 text-center text-sm font-semibold transition ${
                    disabled
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                      : step === pendingStatus
                        ? ACTIVE_STYLES[step]
                        : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {step}
                </button>
                {i < STEPS.length - 1 && (
                  <span className="flex gap-1 text-slate-300">
                    {Array.from({ length: 4 }).map((_, dotIdx) => (
                      <span key={dotIdx} className="h-1 w-1 rounded-full bg-slate-300" />
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {pendingStatus === "Open" && (
          <p className="text-xs text-slate-400">
            Move to In Review before closing an incident.
          </p>
        )}
      </div>

      <div className="border-t border-slate-200 px-6 py-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Add a comment (optional)
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Record any context for this status change..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
        </label>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={!canSave || saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </Dialog>
  );
}
