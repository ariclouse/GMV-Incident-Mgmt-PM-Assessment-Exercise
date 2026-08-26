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

export type SlaStatus = "onTrack" | "atRisk" | "overdue";

const SLA_STATUS_ORDER: SlaStatus[] = ["onTrack", "atRisk", "overdue"];

export const SLA_STATUS_LABELS: Record<SlaStatus, string> = {
  onTrack: "On Track",
  atRisk: "At Risk",
  overdue: "Overdue",
};

// Age-based SLA cutoffs by severity — Critical incidents are flagged sooner than Low ones,
// matching how a real ops team would triage rather than applying one blanket cutoff.
export const SLA_THRESHOLDS: Record<Priority, { atRiskDays: number; overdueDays: number }> = {
  Critical: { atRiskDays: 1, overdueDays: 2 },
  High: { atRiskDays: 2, overdueDays: 4 },
  Medium: { atRiskDays: 4, overdueDays: 7 },
  Low: { atRiskDays: 7, overdueDays: 14 },
};

// Age is measured from the most recent reopen when there is one — otherwise a reopened
// incident would be flagged Overdue the instant it comes back, based on its original
// creation date rather than how long the team has actually had it since reopening.
export function slaAgeDays(incident: Incident): number {
  const baseline = incident.lastReopenedAt ?? incident.date;
  return (Date.now() - new Date(baseline).getTime()) / (24 * 60 * 60 * 1000);
}

export function slaStatus(incident: Incident): SlaStatus | null {
  if (incident.status === "Closed") return null;
  const ageDays = slaAgeDays(incident);
  const { atRiskDays, overdueDays } = SLA_THRESHOLDS[incident.priority];
  if (ageDays >= overdueDays) return "overdue";
  if (ageDays >= atRiskDays) return "atRisk";
  return "onTrack";
}

export function countBySla(incidents: Incident[]): CountItem[] {
  const open = incidents.filter((i) => i.status !== "Closed");
  return SLA_STATUS_ORDER.map((s) => ({
    label: SLA_STATUS_LABELS[s],
    value: open.filter((i) => slaStatus(i) === s).length,
  }));
}

export function countByType(incidents: Incident[]): CountItem[] {
  return TYPE_ORDER.map((type) => ({
    label: type,
    value: incidents.filter((i) => i.type === type).length,
  }));
}

// Same counts as countByType, ranked by volume — every label is still one of the app's
// actual IncidentType values (TYPE_ORDER), never a category invented for display purposes.
export function countByTypeSorted(incidents: Incident[]): CountItem[] {
  return countByType(incidents).sort((a, b) => b.value - a.value);
}

export function incidentsInLastDays(incidents: Incident[], days: number): Incident[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return incidents.filter((i) => new Date(i.date).getTime() >= cutoff);
}

export type DateRangeOption = "7" | "30" | "90" | "quarter";

export const DATE_RANGE_OPTIONS: { value: DateRangeOption; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "quarter", label: "This quarter" },
];

export function incidentsInDateRange(incidents: Incident[], range: DateRangeOption): Incident[] {
  if (range === "quarter") {
    const now = new Date();
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    return incidents.filter((i) => new Date(i.date) >= quarterStart);
  }
  return incidentsInLastDays(incidents, Number(range));
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

export type GroupByField = "type" | "priority" | "status" | "route" | "assignee" | "driver" | "sla";
export type ChartKind = "bar" | "trend";
export type TrendMetric = "created" | "resolved" | "reopened";
export type StatusScope = "all" | "active" | "open" | "closed";

export interface CustomDashboardFilters {
  status: StatusScope;
  types: IncidentType[];
  routes: string[];
  slaStatuses?: SlaStatus[];
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
  { value: "sla", label: "SLA Status" },
];

export const TREND_METRIC_OPTIONS: { value: TrendMetric; label: string }[] = [
  { value: "created", label: "Incidents created per day" },
  { value: "resolved", label: "Incidents resolved per day" },
  { value: "reopened", label: "Incidents reopened per day" },
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
    .filter((i) => (filters.routes.length ? filters.routes.includes(i.route) : true))
    .filter((i) => {
      if (!filters.slaStatuses?.length) return true;
      const s = slaStatus(i);
      return s !== null && filters.slaStatuses.includes(s);
    });
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
    case "sla":
      return countBySla(incidents);
  }
}

export function describeCustomFilters(filters: CustomDashboardFilters): string {
  const statusLabel = STATUS_SCOPE_OPTIONS.find((o) => o.value === filters.status)?.label ?? "All incidents";
  const parts = [statusLabel];
  if (filters.types.length) parts.push(filters.types.join(", "));
  if (filters.routes.length) parts.push(filters.routes.join(", "));
  if (filters.slaStatuses?.length) parts.push(filters.slaStatuses.map((s) => SLA_STATUS_LABELS[s]).join(", "));
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

export function dailyReopenedTrend(incidents: Incident[], days = 14): TrendPoint[] {
  const buckets = emptyDailyBuckets(days);
  incidents.forEach((inc) => {
    if (!inc.lastReopenedAt) return;
    const key = new Date(inc.lastReopenedAt).toISOString().slice(0, 10);
    const bucket = buckets.find((b) => b.dateKey === key);
    if (bucket) bucket.value += 1;
  });
  return buckets;
}

// "First response" is the first activity entry that isn't the auto-generated creation-log
// entry itself. Skipping by matching that entry's fixed text (rather than assuming it's
// always activity[0]) works for both API-created incidents — which always log one via
// store.create() — and the hand-authored seed incidents, whose activity logs don't include
// one at all, so nothing gets skipped for them.
const CREATION_LOG_SUFFIX = "created this incident.";

export function firstResponseHours(incident: Incident): number | null {
  const first = incident.activity.find((a) => !a.text.endsWith(CREATION_LOG_SUFFIX));
  if (!first) return null;
  return (new Date(first.timestamp).getTime() - new Date(incident.date).getTime()) / 3_600_000;
}

export interface FirstResponseStats {
  avgHours: number | null;
}

export function firstResponseStats(incidents: Incident[]): FirstResponseStats {
  const hours = incidents.map(firstResponseHours).filter((h): h is number => h !== null);
  return { avgHours: hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null };
}

export interface ReopenStats {
  reopenRate: number;
  totalReopens: number;
}

// Rate is scoped to incidents that have ever been closed at least once (currently Closed,
// or currently reopened but carrying a reopenCount) — incidents never closed can't be "reopened."
export function reopenStats(incidents: Incident[]): ReopenStats {
  const everClosed = incidents.filter((i) => i.status === "Closed" || (i.reopenCount ?? 0) > 0);
  const totalReopens = incidents.reduce((sum, i) => sum + (i.reopenCount ?? 0), 0);
  const reopenRate = everClosed.length > 0 ? (totalReopens / everClosed.length) * 100 : 0;
  return { reopenRate, totalReopens };
}

function incidentsCreatedInWindow(incidents: Incident[], startDaysAgo: number, endDaysAgo: number): Incident[] {
  const now = Date.now();
  const start = now - startDaysAgo * 24 * 60 * 60 * 1000;
  const end = now - endDaysAgo * 24 * 60 * 60 * 1000;
  return incidents.filter((i) => {
    const t = new Date(i.date).getTime();
    return t >= start && t < end;
  });
}

export interface PeriodComparison {
  recent: Incident[];
  prior: Incident[];
  hasPriorData: boolean;
}

// The mock dataset only spans about a week, so a real "vs last month" comparison isn't
// available — this is the same honest 7-day-vs-prior-7-day window computeInsightBanner
// uses, exposed for KPI tiles that want a real delta rather than a fabricated one.
export function compareLast7DaysToPrior(incidents: Incident[]): PeriodComparison {
  const recent = incidentsCreatedInWindow(incidents, 7, 0);
  const prior = incidentsCreatedInWindow(incidents, 14, 7);
  return { recent, prior, hasPriorData: recent.length > 0 && prior.length > 0 };
}

// Illustrative targets (not derived from data) matching the reference mockup's own example
// thresholds — the kind of number a real ops team would set and tune over time.
export const KPI_TARGETS = {
  closeRatePct: 85,
  avgTimeToCloseHours: 72,
  avgFirstResponseHours: 0.75,
  reopenWatchThresholdPct: 4,
};

export interface InsightBannerResult {
  message: string;
}

// Compares the last 7 days against the 7 days before that. Returns null (not a fabricated
// message) whenever either window is empty or no metric moved past a noticeable threshold —
// with a handful of seed incidents this will often be null, which is the honest result.
export function computeInsightBanner(incidents: Incident[]): InsightBannerResult | null {
  const recent = incidentsCreatedInWindow(incidents, 7, 0);
  const prior = incidentsCreatedInWindow(incidents, 14, 7);
  if (recent.length === 0 || prior.length === 0) return null;

  const closeDelta = resolutionStats(recent).rate - resolutionStats(prior).rate;
  const reopenDelta = reopenStats(recent).reopenRate - reopenStats(prior).reopenRate;
  const THRESHOLD = 10;

  if (reopenDelta >= THRESHOLD) {
    return {
      message: `Reopen rate is up ${reopenDelta.toFixed(0)} pts over the last 7 days — worth checking whether incidents are being closed before they're fully resolved.`,
    };
  }
  if (Math.abs(closeDelta) >= THRESHOLD) {
    return {
      message:
        closeDelta > 0
          ? `Close rate is up ${closeDelta.toFixed(0)} pts over the last 7 days — the team is keeping pace with new incidents.`
          : `Close rate is down ${Math.abs(closeDelta).toFixed(0)} pts over the last 7 days — incidents may be piling up faster than they're being resolved.`,
    };
  }
  return null;
}

export function formatDuration(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}
