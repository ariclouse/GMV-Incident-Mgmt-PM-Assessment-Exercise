"use client";

import { Incident, MetaOptions, Priority } from "@/lib/types";
import { formatDate, formatTime, initialsFromName } from "@/lib/format";
import Avatar from "./Avatar";
import AssigneeQuickPicker from "./AssigneeQuickPicker";
import StatusBadge from "./StatusBadge";
import TypeIcon from "./TypeIcon";

const PRIORITY_BORDER: Record<Priority, string> = {
  Critical: "border-l-red-500",
  High: "border-l-orange-400",
  Medium: "border-l-blue-400",
  Low: "border-l-slate-300",
};

export default function IncidentRow({
  incident,
  expanded,
  onClick,
  onStatusClick,
  meta,
  onUpdate,
}: {
  incident: Incident;
  expanded: boolean;
  onClick: () => void;
  onStatusClick: () => void;
  meta: MetaOptions | null;
  onUpdate: (incident: Incident) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`grid w-full cursor-pointer grid-cols-[60px_170px_80px_150px_1fr_110px_110px_160px_110px] items-center gap-2 border-l-4 border-b border-slate-100 bg-white px-4 py-3 text-left transition hover:bg-slate-50 ${
        PRIORITY_BORDER[incident.priority]
      } ${expanded ? "bg-slate-50 ring-1 ring-inset ring-slate-200" : ""}`}
    >
      <span className="text-sm text-slate-700">{incident.id}</span>
      <span className="flex items-center gap-2">
        <TypeIcon type={incident.type} />
        <span className="text-sm font-semibold text-slate-800">{incident.type}</span>
      </span>
      <span className="text-sm font-semibold text-slate-700">{incident.vehicleNumber}</span>
      <Avatar initials={initialsFromName(incident.driverName)} name={incident.driverName} size="sm" />
      <span>
        <span className="inline-block rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white">
          {incident.route}
        </span>
      </span>
      <span className="text-xs leading-tight text-slate-600">
        <div className="font-semibold">{formatDate(incident.date)}</div>
        <div>{formatTime(incident.date)}</div>
      </span>
      <span className="text-xs leading-tight text-slate-600">
        <div className="font-semibold">{formatDate(incident.updatedAt)}</div>
        <div>{formatTime(incident.updatedAt)}</div>
      </span>
      {incident.assignee ? (
        <Avatar initials={incident.assignee.initials} name={incident.assignee.name} size="sm" />
      ) : (
        <AssigneeQuickPicker incident={incident} meta={meta} onUpdate={onUpdate} />
      )}
      <span>
        <button
          type="button"
          title="Update Status"
          onClick={(e) => {
            e.stopPropagation();
            onStatusClick();
          }}
          className="rounded-md transition hover:opacity-80 hover:ring-2 hover:ring-slate-300 hover:ring-offset-1"
        >
          <StatusBadge status={incident.status} />
        </button>
      </span>
    </div>
  );
}
