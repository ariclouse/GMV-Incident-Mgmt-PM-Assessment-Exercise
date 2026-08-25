"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, RotateCcw, ArrowRight, Plus, ChevronDown, Sparkles } from "lucide-react";
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
  computeGroupedCounts,
  countByAssignee,
  countByDriver,
  countByPriority,
  countByRoute,
  countByType,
  CustomDashboardConfig,
  dailyResolvedTrend,
  dailyTrend,
  describeCustomFilters,
  formatCompact,
  formatDuration,
  GroupByField,
  isOpen,
  resolutionStats,
  StatusScope,
  TrendMetric,
} from "@/lib/insights";
import StatTile from "./StatTile";
import ChartCard from "./ChartCard";
import BarChart from "./BarChart";
import Meter from "./Meter";
import TrendLineChart from "./TrendLineChart";
import SortablePanel from "./SortablePanel";
import CreateDashboardModal from "./CreateDashboardModal";
import { formatTime } from "@/lib/format";

const AUTO_REFRESH_MS = 15_000;
const SEVERITY_COLORS = ["#86b6ef", "#3987e5", "#1c5cab", "#0d366b"];

type BuiltInPanelId =
  | "type"
  | "severity"
  | "resolution"
  | "route"
  | "assignee"
  | "driver"
  | "trend"
  | "resolutionTrend";

const DEFAULT_ORDER: BuiltInPanelId[] = [
  "type",
  "severity",
  "resolution",
  "route",
  "assignee",
  "driver",
  "trend",
  "resolutionTrend",
];

const PANEL_TITLES: Record<BuiltInPanelId, string> = {
  type: "Open Incidents by Type",
  severity: "Open Incidents by Severity",
  resolution: "Incident Resolution Rate",
  route: "Incidents by Route",
  assignee: "Incidents by Assignee",
  driver: "Incidents by Driver",
  trend: "Incident Volume — Last 14 Days",
  resolutionTrend: "Incident Resolution — Last 14 Days",
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

const GROUP_BY_VALUES: GroupByField[] = ["type", "priority", "status", "route", "assignee", "driver"];
const CHART_KIND_VALUES: ChartKind[] = ["bar", "trend"];
const TREND_METRIC_VALUES: TrendMetric[] = ["created", "resolved"];
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

function loadStoredLayout(): StoredLayout | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.order) &&
      Array.isArray(parsed.hidden) &&
      Array.isArray(parsed.customPanels) &&
      DEFAULT_ORDER.every((id) => parsed.order.includes(id))
    ) {
      return {
        ...parsed,
        customPanels: parsed.customPanels.filter(isValidCustomPanel),
      } as StoredLayout;
    }
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

  const openIncidents = useMemo(() => incidents.filter(isOpen), [incidents]);
  const unassignedOpenCount = useMemo(
    () => openIncidents.filter((i) => !i.assignee).length,
    [openIncidents]
  );
  const typeCounts = useMemo(() => countByType(openIncidents), [openIncidents]);
  const priorityCounts = useMemo(() => countByPriority(openIncidents), [openIncidents]);
  const routeCounts = useMemo(() => countByRoute(incidents), [incidents]);
  const assigneeCounts = useMemo(() => countByAssignee(openIncidents), [openIncidents]);
  const driverCounts = useMemo(() => countByDriver(incidents), [incidents]);
  const stats = useMemo(() => resolutionStats(incidents), [incidents]);
  const trend = useMemo(() => dailyTrend(incidents, 14), [incidents]);
  const resolutionTrend = useMemo(() => dailyResolvedTrend(incidents, 14), [incidents]);

  function renderBuiltInPanel(id: BuiltInPanelId, dragHandle: React.ReactNode) {
    const onRemove = () => removePanel(id);
    switch (id) {
      case "type":
        return (
          <ChartCard
            title={PANEL_TITLES.type}
            subtitle="Open + In Review"
            tableData={typeCounts}
            dragHandle={dragHandle}
            onRemove={onRemove}
          >
            <BarChart data={typeCounts} />
          </ChartCard>
        );
      case "severity":
        return (
          <ChartCard
            title={PANEL_TITLES.severity}
            subtitle="Low → Critical"
            tableData={priorityCounts}
            dragHandle={dragHandle}
            onRemove={onRemove}
          >
            <BarChart data={priorityCounts} colors={SEVERITY_COLORS} />
          </ChartCard>
        );
      case "resolution":
        return (
          <ChartCard
            title={PANEL_TITLES.resolution}
            subtitle="All-time, closed vs. total"
            dragHandle={dragHandle}
            onRemove={onRemove}
          >
            <Meter rate={stats.rate} closedCount={stats.closedCount} total={stats.total} />
            <Link
              href="/?view=active"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              View the {stats.openCount} Open + In Review incidents
              <ArrowRight className="h-3 w-3" />
            </Link>
          </ChartCard>
        );
      case "route":
        return (
          <ChartCard
            title={PANEL_TITLES.route}
            subtitle="All-time volume, top routes"
            tableData={routeCounts}
            valueHeader="Incidents"
            dragHandle={dragHandle}
            onRemove={onRemove}
          >
            <BarChart data={routeCounts} />
          </ChartCard>
        );
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
            <BarChart data={assigneeCounts} />
          </ChartCard>
        );
      case "driver":
        return (
          <ChartCard
            title={PANEL_TITLES.driver}
            subtitle="All-time volume, top drivers"
            tableData={driverCounts}
            valueHeader="Incidents"
            dragHandle={dragHandle}
            onRemove={onRemove}
          >
            <BarChart data={driverCounts} />
          </ChartCard>
        );
      case "trend":
        return (
          <ChartCard
            title={PANEL_TITLES.trend}
            subtitle="New incidents created per day"
            tableData={trend}
            valueHeader="Incidents"
            dragHandle={dragHandle}
            onRemove={onRemove}
          >
            <TrendLineChart data={trend} />
          </ChartCard>
        );
      case "resolutionTrend":
        return (
          <ChartCard
            title={PANEL_TITLES.resolutionTrend}
            subtitle="Incidents resolved per day"
            tableData={resolutionTrend}
            valueHeader="Resolved"
            dragHandle={dragHandle}
            onRemove={onRemove}
          >
            <TrendLineChart data={resolutionTrend} />
          </ChartCard>
        );
    }
  }

  function renderCustomPanel(config: CustomDashboardConfig, dragHandle: React.ReactNode) {
    const scoped = applyCustomFilters(incidents, config.filters);
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
      config.trendMetric === "resolved" ? dailyResolvedTrend(scoped, 14) : dailyTrend(scoped, 14);
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
            Live view across all incidents. Drag a panel&apos;s grip handle to reorder.
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

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
          Loading insights...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Total Incidents" value={formatCompact(stats.total)} />
            <StatTile label="Open Incidents" value={formatCompact(stats.openCount)} />
            <StatTile
              label="Unassigned (Open)"
              value={formatCompact(unassignedOpenCount)}
              caption={unassignedOpenCount > 0 ? "Needs an owner" : undefined}
            />
            <StatTile
              label="Avg. Time to Resolve"
              value={formatDuration(stats.avgResolutionHours)}
              caption={stats.closedCount > 0 ? `Across ${stats.closedCount} closed` : "No closed incidents yet"}
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
                    <SortablePanel key={id} id={id}>
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
