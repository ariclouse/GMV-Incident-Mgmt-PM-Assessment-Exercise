"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, RotateCcw, Plus, ChevronDown, Sparkles } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useIncidents, useMeta } from "@/lib/useIncidents";
import {
  applyCustomFilters,
  ChartKind,
  compareLast7DaysToPrior,
  computeGroupedCounts,
  countByAssignee,
  countByTypeSorted,
  CustomDashboardConfig,
  dailyReopenedTrend,
  dailyResolvedTrend,
  dailyTrend,
  DateRangeOption,
  DATE_RANGE_OPTIONS,
  daysInDateRange,
  describeCustomFilters,
  firstResponseStats,
  formatDuration,
  GroupByField,
  incidentsInDateRange,
  isOpen,
  KPI_TARGETS,
  reopenStats,
  resolutionStats,
  StatusScope,
  TrendMetric,
} from "@/lib/insights";
import { IncidentType } from "@/lib/types";
import ChartCard from "./ChartCard";
import BarChart from "./BarChart";
import TrendLineChart from "./TrendLineChart";
import SortablePanel from "./SortablePanel";
import CreateDashboardModal from "./CreateDashboardModal";
import AtRiskTable from "./AtRiskTable";
import FilterBar from "./FilterBar";
import HorizontalBarList from "./HorizontalBarList";
import InsightBanner from "./InsightBanner";
import KpiTrendTile from "./KpiTrendTile";
import { formatTime } from "@/lib/format";

const AUTO_REFRESH_MS = 15_000;

type BuiltInPanelId =
  | "assignee"
  | "recurrence"
  | "trend"
  | "atRisk";

const DEFAULT_ORDER: BuiltInPanelId[] = [
  "trend",
  "assignee",
  "recurrence",
  "atRisk",
];

const PANEL_TITLES: Record<BuiltInPanelId, string> = {
  assignee: "Incidents by Assignee",
  recurrence: "Recurrence by Type",
  trend: "Incident Volume",
  atRisk: "At-Risk & Overdue Incidents",
};

// Panels dense enough to need more than one grid column at desktop width.
const WIDE_PANELS: Partial<Record<string, string>> = {
  atRisk: "md:col-span-2 lg:col-span-3",
};

function isBuiltIn(id: string): id is BuiltInPanelId {
  return Object.prototype.hasOwnProperty.call(PANEL_TITLES, id);
}

const STORAGE_KEY = "insights-layout-v3";

interface StoredLayout {
  order: string[];
  hidden: string[];
  customPanels: CustomDashboardConfig[];
}

const GROUP_BY_VALUES: GroupByField[] = ["type", "priority", "status", "route", "assignee", "driver", "sla"];
const CHART_KIND_VALUES: ChartKind[] = ["bar", "trend"];
const TREND_METRIC_VALUES: TrendMetric[] = ["created", "resolved", "reopened"];
const STATUS_SCOPE_VALUES: StatusScope[] = ["all", "active", "open", "closed"];

// Defends against a stale/malformed panel config left over from an earlier layout schema
// (the storage key is already on its 3rd revision) reaching the chart renderers unguarded.
function isValidCustomPanel(value: unknown): value is CustomDashboardConfig {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<CustomDashboardConfig>;
  return (
    typeof p.id === "string" &&
    typeof p.title === "string" &&
    CHART_KIND_VALUES.includes(p.chartKind as ChartKind) &&
    GROUP_BY_VALUES.includes(p.groupBy as GroupByField) &&
    TREND_METRIC_VALUES.includes(p.trendMetric as TrendMetric) &&
    !!p.filters &&
    typeof p.filters === "object" &&
    STATUS_SCOPE_VALUES.includes(p.filters.status) &&
    Array.isArray(p.filters.types) &&
    Array.isArray(p.filters.routes)
  );
}

// Reconciles a saved layout against the CURRENT set of built-in panels rather than requiring
// an exact match: a panel removed/renamed since the user last saved just drops out of their
// order/hidden lists, a newly-added one gets appended, and — critically — the user's own
// custom dashboards are never discarded just because a built-in panel's id list changed.
function loadStoredLayout(): StoredLayout | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      !Array.isArray(parsed.order) ||
      !Array.isArray(parsed.hidden) ||
      !Array.isArray(parsed.customPanels)
    ) {
      return null;
    }

    const customPanels = (parsed.customPanels as unknown[]).filter(isValidCustomPanel);
    const isKnownId = (id: unknown): id is string =>
      typeof id === "string" && (isBuiltIn(id) || customPanels.some((p) => p.id === id));

    const order = (parsed.order as unknown[]).filter(isKnownId);
    for (const id of DEFAULT_ORDER) {
      if (!order.includes(id)) order.push(id);
    }
    const hidden = (parsed.hidden as unknown[]).filter(isKnownId);

    return { order, hidden, customPanels };
  } catch {
    // ignore malformed storage
  }
  return null;
}

export default function InsightsDashboard() {
  const { incidents, loading, refresh } = useIncidents();
  const meta = useMeta();
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [hidden, setHidden] = useState<string[]>([]);
  const [customPanels, setCustomPanels] = useState<CustomDashboardConfig[]>([]);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [builderConfig, setBuilderConfig] = useState<CustomDashboardConfig | "new" | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>("30");
  const [routeFilter, setRouteFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<IncidentType | "">("");
  const rangeLabel = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)?.label ?? "Selected range";

  // Route/category scoped but NOT date-range scoped. The At-Risk table's whole purpose is
  // surfacing overdue open work regardless of when it was created, so a "Last 7 days" pick
  // in the filter bar shouldn't be able to hide a month-old still-open incident from triage.
  const routeCategoryScopedIncidents = useMemo(() => {
    let result = incidents;
    if (routeFilter) result = result.filter((i) => i.route === routeFilter);
    if (categoryFilter) result = result.filter((i) => i.type === categoryFilter);
    return result;
  }, [incidents, routeFilter, categoryFilter]);

  // Every other panel below reads from this (date range + route + category), so the filter
  // bar scopes the whole page — except InsightBanner, which deliberately runs its own fixed
  // 7-vs-prior-7-day analysis on the full dataset regardless of what the user is browsing,
  // and AtRiskTable, which uses routeCategoryScopedIncidents above instead (see comment there).
  const scopedIncidents = useMemo(
    () => incidentsInDateRange(routeCategoryScopedIncidents, dateRange),
    [routeCategoryScopedIncidents, dateRange]
  );

  useEffect(() => {
    const stored = loadStoredLayout();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage on mount
      setOrder(stored.order);
      setHidden(stored.hidden);
      setCustomPanels(stored.customPanels);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      await refresh();
      setLastUpdated(new Date().toISOString());
    }, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleManualRefresh() {
    setRefreshing(true);
    await refresh();
    setLastUpdated(new Date().toISOString());
    setRefreshing(false);
  }

  function persist(nextOrder: string[], nextHidden: string[], nextCustom: CustomDashboardConfig[]) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ order: nextOrder, hidden: nextHidden, customPanels: nextCustom })
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      const next = arrayMove(prev, oldIndex, newIndex);
      persist(next, hidden, customPanels);
      return next;
    });
  }

  function removePanel(id: string) {
    setHidden((prev) => {
      const next = [...prev, id];
      persist(order, next, customPanels);
      return next;
    });
  }

  function restorePanel(id: string) {
    setHidden((prev) => {
      const next = prev.filter((h) => h !== id);
      persist(order, next, customPanels);
      return next;
    });
    setAddMenuOpen(false);
  }

  function deleteCustomPanel(id: string) {
    const nextCustom = customPanels.filter((p) => p.id !== id);
    const nextOrder = order.filter((o) => o !== id);
    const nextHidden = hidden.filter((h) => h !== id);
    setCustomPanels(nextCustom);
    setOrder(nextOrder);
    setHidden(nextHidden);
    persist(nextOrder, nextHidden, nextCustom);
  }

  function saveCustomPanel(config: CustomDashboardConfig) {
    const exists = customPanels.some((p) => p.id === config.id);
    const nextCustom = exists
      ? customPanels.map((p) => (p.id === config.id ? config : p))
      : [...customPanels, config];
    const nextOrder = exists ? order : [...order, config.id];
    setCustomPanels(nextCustom);
    if (!exists) setOrder(nextOrder);
    persist(nextOrder, hidden, nextCustom);
    setBuilderConfig(null);
    setAddMenuOpen(false);
  }

  function resetLayout() {
    setOrder(DEFAULT_ORDER);
    setHidden([]);
    setCustomPanels([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  const visibleOrder = order.filter((id) => !hidden.includes(id) && (isBuiltIn(id) || customPanels.some((p) => p.id === id)));

  const openIncidents = useMemo(() => scopedIncidents.filter(isOpen), [scopedIncidents]);
  const atRiskIncidents = useMemo(
    () => routeCategoryScopedIncidents.filter(isOpen),
    [routeCategoryScopedIncidents]
  );
  const assigneeCounts = useMemo(() => countByAssignee(openIncidents), [openIncidents]);
  // The filter bar's date range now controls this window instead of a hardcoded 90 days.
  const recurrenceCounts = useMemo(() => countByTypeSorted(scopedIncidents), [scopedIncidents]);
  const stats = useMemo(() => resolutionStats(scopedIncidents), [scopedIncidents]);
  // Follows the filter bar's date range instead of a fixed window, so switching to "Last 90
  // days" or "This quarter" actually widens the chart rather than always showing 14 days.
  const trend = useMemo(
    () => dailyTrend(scopedIncidents, daysInDateRange(dateRange)),
    [scopedIncidents, dateRange]
  );
  const resolutionTrend = useMemo(() => dailyResolvedTrend(scopedIncidents, 14), [scopedIncidents]);
  const reopenedTrend = useMemo(() => dailyReopenedTrend(scopedIncidents, 14), [scopedIncidents]);
  const firstResponse = useMemo(() => firstResponseStats(scopedIncidents), [scopedIncidents]);
  const reopens = useMemo(() => reopenStats(scopedIncidents), [scopedIncidents]);

  // Real 7-day-vs-prior-7-day comparison (the same window the insight banner uses) so KPI
  // deltas reflect actual data instead of a fabricated "vs last month."
  const { recent: recentPeriod, prior: priorPeriod, hasPriorData } = useMemo(
    () => compareLast7DaysToPrior(scopedIncidents),
    [scopedIncidents]
  );
  const recentStats = useMemo(() => resolutionStats(recentPeriod), [recentPeriod]);
  const priorStats = useMemo(() => resolutionStats(priorPeriod), [priorPeriod]);
  const recentFirstResponse = useMemo(() => firstResponseStats(recentPeriod), [recentPeriod]);
  const priorFirstResponse = useMemo(() => firstResponseStats(priorPeriod), [priorPeriod]);
  const recentReopens = useMemo(() => reopenStats(recentPeriod), [recentPeriod]);
  const priorReopens = useMemo(() => reopenStats(priorPeriod), [priorPeriod]);

  function buildDelta(
    recentVal: number | null,
    priorVal: number | null,
    goodDirection: "up" | "down",
    formatMagnitude: (n: number) => string
  ): { text: string; good: boolean } | null {
    if (!hasPriorData || recentVal === null || priorVal === null) return null;
    const diff = recentVal - priorVal;
    if (diff === 0) return null;
    const good = goodDirection === "up" ? diff >= 0 : diff <= 0;
    const arrow = diff >= 0 ? "▲" : "▼";
    return { text: `${arrow} ${formatMagnitude(Math.abs(diff))}`, good };
  }

  function formatPts(n: number): string {
    const rounded = Math.round(n * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} pts`;
  }

  const closeDelta = buildDelta(recentStats.rate, priorStats.rate, "up", formatPts);
  const timeToCloseDelta = buildDelta(recentStats.avgResolutionHours, priorStats.avgResolutionHours, "down", formatDuration);
  const firstResponseDelta = buildDelta(recentFirstResponse.avgHours, priorFirstResponse.avgHours, "down", formatDuration);
  const reopenDelta = buildDelta(recentReopens.reopenRate, priorReopens.reopenRate, "down", formatPts);
  const last7 = (points: { value: number }[]) => points.slice(-7).map((p) => p.value);
  const trendNote = hasPriorData ? "vs prior 7 days" : "not enough history yet for a trend";

  function renderBuiltInPanel(id: BuiltInPanelId, dragHandle: React.ReactNode) {
    const onRemove = () => removePanel(id);
    switch (id) {
      case "assignee":
        return (
          <ChartCard
            title={PANEL_TITLES.assignee}
            subtitle="Current open workload"
            tableData={assigneeCounts}
            valueHeader="Open incidents"
            dragHandle={dragHandle}
            onRemove={onRemove}
          >
            <HorizontalBarList data={assigneeCounts} />
          </ChartCard>
        );
      case "recurrence":
        return (
          <ChartCard
            title={PANEL_TITLES.recurrence}
            subtitle={`Incident count, ${rangeLabel.toLowerCase()} — where systemic fixes matter most`}
            tableData={recurrenceCounts}
            valueHeader="Incidents"
            dragHandle={dragHandle}
            onRemove={onRemove}
          >
            <HorizontalBarList data={recurrenceCounts} />
          </ChartCard>
        );
      case "trend":
        return (
          <ChartCard
            title={`${PANEL_TITLES.trend} — ${rangeLabel}`}
            subtitle="New incidents created per day"
            tableData={trend}
            valueHeader="Incidents"
            dragHandle={dragHandle}
            onRemove={onRemove}
          >
            <TrendLineChart data={trend} />
          </ChartCard>
        );
      case "atRisk":
        return (
          <ChartCard title={PANEL_TITLES.atRisk} subtitle="Open, ranked by SLA urgency" dragHandle={dragHandle} onRemove={onRemove}>
            <AtRiskTable incidents={atRiskIncidents} />
          </ChartCard>
        );
    }
  }

  function renderCustomPanel(config: CustomDashboardConfig, dragHandle: React.ReactNode) {
    const scoped = applyCustomFilters(scopedIncidents, config.filters);
    const subtitle = describeCustomFilters(config.filters);
    const onRemove = () => deleteCustomPanel(config.id);
    const onEdit = () => setBuilderConfig(config);

    if (config.chartKind === "bar") {
      const data = computeGroupedCounts(scoped, config.groupBy);
      return (
        <ChartCard
          title={config.title}
          subtitle={subtitle}
          tableData={data}
          dragHandle={dragHandle}
          onEdit={onEdit}
          onRemove={onRemove}
        >
          <BarChart data={data} />
        </ChartCard>
      );
    }

    const trendData =
      config.trendMetric === "resolved"
        ? dailyResolvedTrend(scoped, 14)
        : config.trendMetric === "reopened"
          ? dailyReopenedTrend(scoped, 14)
          : dailyTrend(scoped, 14);
    return (
      <ChartCard
        title={config.title}
        subtitle={subtitle}
        tableData={trendData}
        valueHeader="Incidents"
        dragHandle={dragHandle}
        onEdit={onEdit}
        onRemove={onRemove}
      >
        <TrendLineChart data={trendData} />
      </ChartCard>
    );
  }

  function renderPanel(id: string, dragHandle: React.ReactNode) {
    if (isBuiltIn(id)) return renderBuiltInPanel(id, dragHandle);
    const config = customPanels.find((p) => p.id === id);
    if (!config) return null;
    return renderCustomPanel(config, dragHandle);
  }

  return (
    <div className="mx-auto max-w-[1500px] px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Incident Insights</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Live view, scoped by the filters below. Drag a panel&apos;s grip handle to reorder.
            {lastUpdated && <> Updated {formatTime(lastUpdated)}.</>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setAddMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Add dashboard
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {addMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAddMenuOpen(false)} />
                <div className="absolute right-0 top-11 z-50 w-64 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setBuilderConfig("new");
                      setAddMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2.5 text-left text-sm font-semibold text-blue-600 hover:bg-slate-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    Create new dashboard...
                  </button>
                  {hidden.length > 0 && (
                    <>
                      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Hidden dashboards
                      </p>
                      {hidden.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => restorePanel(id)}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {isBuiltIn(id) ? PANEL_TITLES[id] : customPanels.find((p) => p.id === id)?.title ?? id}
                          <Plus className="h-3.5 w-3.5 text-slate-400" />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={resetLayout}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset layout
          </button>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <FilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        routes={meta?.routes ?? []}
        routeFilter={routeFilter}
        onRouteFilterChange={setRouteFilter}
        categories={meta?.incidentTypes ?? []}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />

      {loading ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
          Loading insights...
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <InsightBanner incidents={incidents} />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiTrendTile
              label="Close Rate"
              value={`${stats.rate.toFixed(0)}%`}
              delta={closeDelta}
              caption={`${trendNote} · target ${KPI_TARGETS.closeRatePct}%`}
              sparkline={last7(resolutionTrend)}
            />
            <KpiTrendTile
              label="Avg. Time to Close"
              value={formatDuration(stats.avgResolutionHours)}
              delta={timeToCloseDelta}
              caption={`${trendNote} · SLA target ${formatDuration(KPI_TARGETS.avgTimeToCloseHours)}`}
              sparkline={last7(resolutionTrend)}
            />
            <KpiTrendTile
              label="Avg. First Response"
              value={formatDuration(firstResponse.avgHours)}
              delta={firstResponseDelta}
              caption={`${trendNote} · target < ${formatDuration(KPI_TARGETS.avgFirstResponseHours)}`}
              sparkline={last7(trend)}
            />
            <KpiTrendTile
              label="Reopen Rate"
              value={`${reopens.reopenRate.toFixed(0)}%`}
              delta={reopenDelta}
              caption={`${trendNote} · watch threshold ${KPI_TARGETS.reopenWatchThresholdPct}%`}
              sparkline={last7(reopenedTrend)}
              flag={reopens.reopenRate > KPI_TARGETS.reopenWatchThresholdPct ? "trending the wrong way — review" : undefined}
            />
          </div>

          {visibleOrder.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-400">
              All dashboards are hidden. Use &quot;Add dashboard&quot; or &quot;Reset layout&quot; to bring them
              back.
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visibleOrder} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {visibleOrder.map((id) => (
                    <SortablePanel key={id} id={id} className={WIDE_PANELS[id]}>
                      {(dragHandle) => renderPanel(id, dragHandle)}
                    </SortablePanel>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {builderConfig && (
        <CreateDashboardModal
          meta={meta}
          initialConfig={builderConfig === "new" ? undefined : builderConfig}
          onClose={() => setBuilderConfig(null)}
          onSave={saveCustomPanel}
        />
      )}
    </div>
  );
}
