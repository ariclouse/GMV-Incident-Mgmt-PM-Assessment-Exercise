"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckSquare, Archive, SlidersHorizontal, Plus, Download, Star } from "lucide-react";
import { useIncidents, useMeta } from "@/lib/useIncidents";
import { Incident, IncidentType } from "@/lib/types";
import { CURRENT_USER } from "@/lib/currentUser";
import { isStaleOpen } from "@/lib/insights";
import { toLocalDateKey } from "@/lib/format";
import StatCounters, { QuickFilter } from "./StatCounters";
import IncidentRow from "./IncidentRow";
import IncidentDetailPanel from "./detail/IncidentDetailPanel";
import FilterDrawer, { DEFAULT_FILTERS, Filters } from "./FilterDrawer";
import IncidentTypeModal from "./IncidentTypeModal";
import NewIncidentModal from "./NewIncidentModal";
import UpdateStatusModal from "./UpdateStatusModal";
import ExportIncidentsModal from "./ExportIncidentsModal";
import FeedbackModal from "../feedback/FeedbackModal";

const HEADER_COLS = "grid-cols-[60px_170px_80px_150px_1fr_110px_110px_160px_110px]";

export default function IncidentList() {
  const { incidents, loading, error, refresh, setIncidents } = useIncidents();
  const meta = useMeta();
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view");
  const [tab, setTab] = useState<"active" | "closed">(initialView === "closed" ? "closed" : "active");
  const [expandedId, setExpandedId] = useState<string | null>(searchParams.get("incident"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creationStep, setCreationStep] = useState<"closed" | "type" | "details">("closed");
  const [draftType, setDraftType] = useState<IncidentType | null>(null);
  const [statusModalIncident, setStatusModalIncident] = useState<Incident | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  function replaceIncident(updated: Incident) {
    setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  const tabIncidents = useMemo(
    () => incidents.filter((i) => (tab === "active" ? i.status !== "Closed" : i.status === "Closed")),
    [incidents, tab]
  );

  const filtered = useMemo(() => {
    return tabIncidents
      .filter((i) => (filters.types.length ? filters.types.includes(i.type) : true))
      .filter((i) => (filters.routes.length ? filters.routes.includes(i.route) : true))
      .filter((i) => (filters.drivers.length ? filters.drivers.includes(i.driverName) : true))
      .filter((i) => (filters.day ? toLocalDateKey(i.date) === filters.day : true))
      .filter((i) => (filters.staleOpen.enabled ? isStaleOpen(i, filters.staleOpen.days) : true))
      .filter((i) => {
        if (!filters.search.trim()) return true;
        const q = filters.search.toLowerCase();
        return (
          i.id.includes(q) ||
          i.driverName.toLowerCase().includes(q) ||
          i.route.toLowerCase().includes(q) ||
          i.vehicleNumber.toLowerCase().includes(q)
        );
      })
      .filter((i) => {
        if (quickFilter === "unassigned") return !i.assignee;
        if (quickFilter === "open") return i.status === "Open";
        if (quickFilter === "mine") return i.assignee?.id === CURRENT_USER.id;
        return true;
      });
  }, [tabIncidents, filters, quickFilter]);

  // Scoped to the current tab so these counts always match what clicking the pill will actually show.
  const unassignedCount = tabIncidents.filter((i) => !i.assignee).length;
  const openCount = tabIncidents.filter((i) => i.status === "Open").length;
  const mineCount = tabIncidents.filter((i) => i.assignee?.id === CURRENT_USER.id).length;
  const activeFilterCount =
    filters.types.length +
    filters.routes.length +
    filters.drivers.length +
    (filters.day ? 1 : 0) +
    (filters.staleOpen.enabled ? 1 : 0);

  return (
    <div className="mx-auto max-w-[1500px] px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <StatCounters
          unassigned={unassignedCount}
          open={openCount}
          mine={mineCount}
          active={quickFilter}
          onSelect={setQuickFilter}
          disabledFilters={tab === "closed" ? ["open"] : []}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-1.5 rounded px-1.5 py-1 text-xs font-medium text-slate-400 transition hover:text-slate-600"
          >
            <Star className="h-3.5 w-3.5" />
            Leave Feedback
          </button>
          <span className="h-6 w-px bg-slate-200" />
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3a4356] text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setCreationStep("type")}
            className="flex items-center gap-2 rounded-md bg-[#3a4356] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2c3446]"
          >
            <Plus className="h-4 w-4" />
            Report Incident
          </button>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-6 border-b border-slate-200">
        <button
          onClick={() => {
            setTab("active");
            setExpandedId(null);
          }}
          className={`flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-semibold ${
            tab === "active" ? "border-slate-800 text-slate-800" : "border-transparent text-slate-400"
          }`}
        >
          <CheckSquare className="h-4 w-4" /> Active
        </button>
        <button
          onClick={() => {
            setTab("closed");
            setExpandedId(null);
            // "Open" can never match on the Closed tab — clear it so the pill isn't left stuck active-but-disabled.
            if (quickFilter === "open") setQuickFilter(null);
          }}
          className={`flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-semibold ${
            tab === "closed" ? "border-slate-800 text-slate-800" : "border-transparent text-slate-400"
          }`}
        >
          <Archive className="h-4 w-4" /> Closed
        </button>
      </div>

      <div className={`grid ${HEADER_COLS} gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500`}>
        <span>ID</span>
        <span>Type</span>
        <span>Vehicle</span>
        <span>Driver</span>
        <span>Route</span>
        <span>Date</span>
        <span>Updated</span>
        <span>Assignee</span>
        <span>Status</span>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        {loading && <div className="px-4 py-10 text-center text-sm text-slate-400">Loading incidents...</div>}
        {!loading && error && (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-red-500">
            <span>{error}</span>
            <button type="button" onClick={refresh} className="text-xs font-semibold text-blue-600 hover:underline">
              Retry
            </button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-slate-400">No incidents match your filters.</div>
        )}
        {filtered.map((incident) => (
          <div key={incident.id}>
            <IncidentRow
              incident={incident}
              expanded={expandedId === incident.id}
              onClick={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
              onStatusClick={() => setStatusModalIncident(incident)}
              meta={meta}
              onUpdate={replaceIncident}
            />
            {expandedId === incident.id && (
              <IncidentDetailPanel incident={incident} meta={meta} onUpdate={replaceIncident} />
            )}
          </div>
        ))}
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        meta={meta}
        filters={filters}
        onChange={setFilters}
      />

      {creationStep === "type" && (
        <IncidentTypeModal
          onCancel={() => setCreationStep("closed")}
          onContinue={(type) => {
            setDraftType(type);
            setCreationStep("details");
          }}
        />
      )}

      {creationStep === "details" && draftType && (
        <NewIncidentModal
          initialType={draftType}
          meta={meta}
          onChangeType={() => setCreationStep("type")}
          onClose={() => setCreationStep("closed")}
          onCreated={(incident) => {
            setIncidents((prev) => [incident, ...prev]);
            setExpandedId(incident.id);
            setTab("active");
            setCreationStep("closed");
          }}
        />
      )}

      {statusModalIncident && (
        <UpdateStatusModal
          incident={statusModalIncident}
          onClose={() => setStatusModalIncident(null)}
          onUpdate={(updated) => {
            replaceIncident(updated);
            setStatusModalIncident(null);
          }}
        />
      )}

      {exportOpen && <ExportIncidentsModal incidents={incidents} onClose={() => setExportOpen(false)} />}

      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
