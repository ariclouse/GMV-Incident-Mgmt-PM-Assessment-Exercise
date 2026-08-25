import { Incident, IncidentType, Priority, Status } from "./types";

export interface CountItem {
  label: string;
  value: number;
}

const TYPE_ORDER: IncidentType[] = [
  "Emergency",
  "Service Disruption",
  "Rider Complaint",
  "Mechanical",
  "Accident",
  "Other",
];

const PRIORITY_ORDER: Priority[] = ["Low", "Medium", "High", "Critical"];
const STATUS_ORDER: Status[] = ["Open", "In Review", "Closed"];

export function isOpen(incident: Incident): boolean {
  return incident.status !== "Closed";
}

export function isStaleOpen(incident: Incident, days: number): boolean {
  if (incident.status === "Closed") return false;
  const ageMs = Date.now() - new Date(incident.updatedAt).getTime();
  return ageMs > days * 24 * 60 * 60 * 1000;
}

export function countByType(incidents: Incident[]): CountItem[] {
  return TYPE_ORDER.map((type) => ({
    label: type,
    value: incidents.filter((i) => i.type === type).length,
  }));
}

export function countByPriority(incidents: Incident[]): CountItem[] {
  return PRIORITY_ORDER.map((p) => ({
    label: p,
    value: incidents.filter((i) => i.priority === p).length,
  }));
}

function topN(counts: Map<string, number>, limit: number): CountItem[] {
  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
  if (sorted.length <= limit) return sorted;
  const top = sorted.slice(0, limit - 1);
  const otherTotal = sorted.slice(limit - 1).reduce((sum, item) => sum + item.value, 0);
  return [...top, { label: "Other", value: otherTotal }];
}

export function countByRoute(incidents: Incident[], limit = 5): CountItem[] {
  const counts = new Map<string, number>();
  incidents.forEach((i) => counts.set(i.route, (counts.get(i.route) ?? 0) + 1));
  return topN(counts, limit);
}

export function countByAssignee(incidents: Incident[], limit = 6): CountItem[] {
  const counts = new Map<string, number>();
  incidents.forEach((i) => {
    const label = i.assignee?.name ?? "Unassigned";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return topN(counts, limit);
}

export function countByDriver(incidents: Incident[], limit = 6): CountItem[] {
  const counts = new Map<string, number>();
  incidents.forEach((i) => counts.set(i.driverName, (counts.get(i.driverName) ?? 0) + 1));
  return topN(counts, limit);
}

export function countByStatus(incidents: Incident[]): CountItem[] {
  return STATUS_ORDER.map((status) => ({
    label: status,
    value: incidents.filter((i) => i.status === status).length,
  }));
}

export type GroupByField = "type" | "priority" | "status" | "route" | "assignee" | "driver";
export type ChartKind = "bar" | "trend";
export type TrendMetric = "created" | "resolved";
export type StatusScope = "all" | "active" | "open" | "closed";

export interface CustomDashboardFilters {
  status: StatusScope;
  types: IncidentType[];
  routes: string[];
}

export interface CustomDashboardConfig {
  id: string;
  title: string;
  chartKind: ChartKind;
  groupBy: GroupByField;
  trendMetric: TrendMetric;
  filters: CustomDashboardFilters;
}

export const GROUP_BY_OPTIONS: { value: GroupByField; label: string }[] = [
  { value: "type", label: "Incident Type" },
  { value: "priority", label: "Severity" },
  { value: "status", label: "Status" },
  { value: "route", label: "Route" },
  { value: "assignee", label: "Assignee" },
  { value: "driver", label: "Driver" },
];

export const TREND_METRIC_OPTIONS: { value: TrendMetric; label: string }[] = [
  { value: "created", label: "Incidents created per day" },
  { value: "resolved", label: "Incidents resolved per day" },
];

export const STATUS_SCOPE_OPTIONS: { value: StatusScope; label: string }[] = [
  { value: "all", label: "All incidents" },
  { value: "active", label: "Open + In Review" },
  { value: "open", label: "Open only" },
  { value: "closed", label: "Closed only" },
];

export function applyCustomFilters(incidents: Incident[], filters: CustomDashboardFilters): Incident[] {
  return incidents
    .filter((i) => {
      if (filters.status === "active") return i.status !== "Closed";
      if (filters.status === "open") return i.status === "Open";
      if (filters.status === "closed") return i.status === "Closed";
      return true;
    })
    .filter((i) => (filters.types.length ? filters.types.includes(i.type) : true))
    .filter((i) => (filters.routes.length ? filters.routes.includes(i.route) : true));
}

export function computeGroupedCounts(incidents: Incident[], groupBy: GroupByField): CountItem[] {
  switch (groupBy) {
    case "type":
      return countByType(incidents);
    case "priority":
      return countByPriority(incidents);
    case "status":
      return countByStatus(incidents);
    case "route":
      return countByRoute(incidents);
    case "assignee":
      return countByAssignee(incidents);
    case "driver":
      return countByDriver(incidents);
  }
}

export function describeCustomFilters(filters: CustomDashboardFilters): string {
  const statusLabel = STATUS_SCOPE_OPTIONS.find((o) => o.value === filters.status)?.label ?? "All incidents";
  const parts = [statusLabel];
  if (filters.types.length) parts.push(filters.types.join(", "));
  if (filters.routes.length) parts.push(filters.routes.join(", "));
  return parts.join(" · ");
}

export interface ResolutionStats {
  total: number;
  closedCount: number;
  openCount: number;
  rate: number;
  avgResolutionHours: number | null;
}

export function resolutionStats(incidents: Incident[]): ResolutionStats {
  const total = incidents.length;
  const closed = incidents.filter((i) => i.status === "Closed");
  const rate = total > 0 ? (closed.length / total) * 100 : 0;
  const resolutionHours = closed
    .filter((i) => i.closedAt)
    .map((i) => (new Date(i.closedAt!).getTime() - new Date(i.date).getTime()) / 3_600_000);
  const avgResolutionHours = resolutionHours.length
    ? resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length
    : null;
  return {
    total,
    closedCount: closed.length,
    openCount: total - closed.length,
    rate,
    avgResolutionHours,
  };
}

export interface TrendPoint {
  label: string;
  value: number;
  dateKey: string;
}

function emptyDailyBuckets(days: number): TrendPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.push({
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: 0,
      dateKey: d.toISOString().slice(0, 10),
    });
  }
  return buckets;
}

export function dailyTrend(incidents: Incident[], days = 14): TrendPoint[] {
  const buckets = emptyDailyBuckets(days);
  incidents.forEach((inc) => {
    const key = new Date(inc.date).toISOString().slice(0, 10);
    const bucket = buckets.find((b) => b.dateKey === key);
    if (bucket) bucket.value += 1;
  });
  return buckets;
}

export function dailyResolvedTrend(incidents: Incident[], days = 14): TrendPoint[] {
  const buckets = emptyDailyBuckets(days);
  incidents.forEach((inc) => {
    if (!inc.closedAt) return;
    const key = new Date(inc.closedAt).toISOString().slice(0, 10);
    const bucket = buckets.find((b) => b.dateKey === key);
    if (bucket) bucket.value += 1;
  });
  return buckets;
}

export function formatDuration(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}
