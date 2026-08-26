import { DateRangeOption, DATE_RANGE_OPTIONS } from "@/lib/insights";
import { IncidentType } from "@/lib/types";

export default function FilterBar({
  dateRange,
  onDateRangeChange,
  routes,
  routeFilter,
  onRouteFilterChange,
  categories,
  categoryFilter,
  onCategoryFilterChange,
}: {
  dateRange: DateRangeOption;
  onDateRangeChange: (value: DateRangeOption) => void;
  routes: string[];
  routeFilter: string;
  onRouteFilterChange: (value: string) => void;
  categories: IncidentType[];
  categoryFilter: IncidentType | "";
  onCategoryFilterChange: (value: IncidentType | "") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {DATE_RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onDateRangeChange(opt.value)}
            aria-pressed={dateRange === opt.value}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              dateRange === opt.value
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <select
        value={routeFilter}
        onChange={(e) => onRouteFilterChange(e.target.value)}
        aria-label="Filter by route"
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
      >
        <option value="">All routes</option>
        {routes.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <select
        value={categoryFilter}
        onChange={(e) => onCategoryFilterChange(e.target.value as IncidentType | "")}
        aria-label="Filter by incident type"
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
      >
        <option value="">All Types</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
