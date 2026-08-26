"use client";

import { useState } from "react";
import { X, BarChart3, TrendingUp } from "lucide-react";
import { MetaOptions, IncidentType } from "@/lib/types";
import {
  ChartKind,
  CustomDashboardConfig,
  GroupByField,
  GROUP_BY_OPTIONS,
  SlaStatus,
  SLA_STATUS_LABELS,
  StatusScope,
  STATUS_SCOPE_OPTIONS,
  TrendMetric,
  TREND_METRIC_OPTIONS,
} from "@/lib/insights";

const SLA_STATUS_VALUES: SlaStatus[] = ["onTrack", "atRisk", "overdue"];
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";

function uid() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function CreateDashboardModal({
  meta,
  initialConfig,
  onClose,
  onSave,
}: {
  meta: MetaOptions | null;
  initialConfig?: CustomDashboardConfig;
  onClose: () => void;
  onSave: (config: CustomDashboardConfig) => void;
}) {
  const isEditing = !!initialConfig;
  const [title, setTitle] = useState(initialConfig?.title ?? "");
  const [chartKind, setChartKind] = useState<ChartKind>(initialConfig?.chartKind ?? "bar");
  const [groupBy, setGroupBy] = useState<GroupByField>(initialConfig?.groupBy ?? "type");
  const [trendMetric, setTrendMetric] = useState<TrendMetric>(initialConfig?.trendMetric ?? "created");
  const [statusScope, setStatusScope] = useState<StatusScope>(initialConfig?.filters.status ?? "all");
  const [types, setTypes] = useState<IncidentType[]>(initialConfig?.filters.types ?? []);
  const [routes, setRoutes] = useState<string[]>(initialConfig?.filters.routes ?? []);
  const [slaStatuses, setSlaStatuses] = useState<SlaStatus[]>(initialConfig?.filters.slaStatuses ?? []);

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      id: initialConfig?.id ?? uid(),
      title: title.trim(),
      chartKind,
      groupBy,
      trendMetric,
      filters: { status: statusScope, types, routes, slaStatuses },
    });
  }

  return (
    <Dialog onClose={onClose} maxWidthClassName="max-w-lg">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-bold text-slate-800">
          {isEditing ? "Edit Dashboard" : "Create a Dashboard"}
        </h2>
        <Button variant="icon" aria-label="Close" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
        <Field label="Dashboard name">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Incidents by Vehicle"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
        </Field>

        <Field label="Chart type">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setChartKind("bar")}
              className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                chartKind === "bar"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Bar Chart
            </button>
            <button
              type="button"
              onClick={() => setChartKind("trend")}
              className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                chartKind === "trend"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Trend Line
            </button>
          </div>
        </Field>

        {chartKind === "bar" ? (
          <Field label="Group incidents by">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupByField)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
            >
              {GROUP_BY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Show">
            <select
              value={trendMetric}
              onChange={(e) => setTrendMetric(e.target.value as TrendMetric)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
            >
              {TREND_METRIC_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="border-t border-slate-200 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filters (optional)
          </p>

          <Field label="Status">
            <select
              value={statusScope}
              onChange={(e) => setStatusScope(e.target.value as StatusScope)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
            >
              {STATUS_SCOPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          {meta && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-600">Incident Type</p>
                <div className="space-y-1 rounded-md border border-slate-200 p-2">
                  {meta.incidentTypes.map((t) => (
                    <label key={t} className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={types.includes(t)}
                        onChange={() => setTypes((prev) => toggle(prev, t))}
                        className="h-3.5 w-3.5 rounded border-slate-300"
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-600">Route</p>
                <div className="space-y-1 rounded-md border border-slate-200 p-2">
                  {meta.routes.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={routes.includes(r)}
                        onChange={() => setRoutes((prev) => toggle(prev, r))}
                        className="h-3.5 w-3.5 rounded border-slate-300"
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-600">SLA Status</p>
                <div className="space-y-1 rounded-md border border-slate-200 p-2">
                  {SLA_STATUS_VALUES.map((s) => (
                    <label key={s} className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={slaStatuses.includes(s)}
                        onChange={() => setSlaStatuses((prev) => toggle(prev, s))}
                        className="h-3.5 w-3.5 rounded border-slate-300"
                      />
                      {SLA_STATUS_LABELS[s]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={!title.trim()}>
          {isEditing ? "Save Changes" : "Create Dashboard"}
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
