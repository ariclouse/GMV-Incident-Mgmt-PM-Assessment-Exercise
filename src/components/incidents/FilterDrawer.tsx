"use client";

import { Search, X, Calendar } from "lucide-react";
import { MetaOptions } from "@/lib/types";

export interface StaleOpenFilter {
  enabled: boolean;
  days: number;
}

export interface Filters {
  search: string;
  types: string[];
  routes: string[];
  drivers: string[];
  day: string | null;
  staleOpen: StaleOpenFilter;
}

export const DEFAULT_STALE_OPEN_DAYS = 7;

export const DEFAULT_FILTERS: Filters = {
  search: "",
  types: [],
  routes: [],
  drivers: [],
  day: null,
  staleOpen: { enabled: false, days: DEFAULT_STALE_OPEN_DAYS },
};

export default function FilterDrawer({
  open,
  onClose,
  meta,
  filters,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  meta: MetaOptions | null;
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  if (!open) return null;

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  const drivers = meta ? [...new Set(meta.vehicles.map((v) => v.driverName))].sort() : [];

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="flex w-80 flex-col bg-[#1b2436] px-5 py-6 text-white">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Incidents</h2>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Filter"
            className="w-full rounded-md border border-slate-600 bg-[#242e44] py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-blue-400"
          />
        </div>

        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Day</p>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={filters.day ?? ""}
              onChange={(e) => onChange({ ...filters, day: e.target.value || null })}
              className="w-full rounded-md border border-slate-600 bg-[#242e44] py-2 pl-9 pr-3 text-sm text-white outline-none [color-scheme:dark] focus:border-blue-400"
            />
            {filters.day && (
              <button
                onClick={() => onChange({ ...filters, day: null })}
                className="absolute right-2 top-2 text-slate-400 hover:text-white"
                aria-label="Clear day filter"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {[...filters.types, ...filters.routes, ...filters.drivers].map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-md bg-[#2f3a52] px-2 py-1 text-xs"
            >
              {tag}
              <button
                onClick={() =>
                  onChange({
                    ...filters,
                    types: filters.types.filter((t) => t !== tag),
                    routes: filters.routes.filter((r) => r !== tag),
                    drivers: filters.drivers.filter((d) => d !== tag),
                  })
                }
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="mb-3 flex items-center gap-4 text-xs text-slate-300">
          <button
            className="hover:text-white"
            onClick={() =>
              meta &&
              onChange({
                ...filters,
                types: [...meta.incidentTypes],
                routes: [...meta.routes],
                drivers: [...drivers],
              })
            }
          >
            Select All
          </button>
          <button className="hover:text-white" onClick={() => onChange(DEFAULT_FILTERS)}>
            Clear Selection
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Incident Type</p>
            <div className="space-y-1.5">
              {meta?.incidentTypes.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.types.includes(type)}
                    onChange={() => onChange({ ...filters, types: toggle(filters.types, type) })}
                    className="h-4 w-4 rounded border-slate-500 bg-transparent"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Route</p>
            <div className="space-y-1.5">
              {meta?.routes.map((route) => (
                <label key={route} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.routes.includes(route)}
                    onChange={() => onChange({ ...filters, routes: toggle(filters.routes, route) })}
                    className="h-4 w-4 rounded border-slate-500 bg-transparent"
                  />
                  {route}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Driver</p>
            <div className="space-y-1.5">
              {drivers.map((driver) => (
                <label key={driver} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.drivers.includes(driver)}
                    onChange={() => onChange({ ...filters, drivers: toggle(filters.drivers, driver) })}
                    className="h-4 w-4 rounded border-slate-500 bg-transparent"
                  />
                  {driver}
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Stale Open Incidents
            </p>
            <label className="flex flex-wrap items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.staleOpen.enabled}
                onChange={(e) =>
                  onChange({ ...filters, staleOpen: { ...filters.staleOpen, enabled: e.target.checked } })
                }
                className="h-4 w-4 rounded border-slate-500 bg-transparent"
              />
              <span>Open more than</span>
              <input
                type="number"
                min={1}
                value={filters.staleOpen.days}
                disabled={!filters.staleOpen.enabled}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    staleOpen: {
                      ...filters.staleOpen,
                      days: Math.max(1, Number(e.target.value) || DEFAULT_STALE_OPEN_DAYS),
                    },
                  })
                }
                className="w-14 rounded-md border border-slate-600 bg-[#242e44] px-2 py-1 text-sm text-white outline-none focus:border-blue-400 disabled:opacity-50"
              />
              <span>days without an update</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
