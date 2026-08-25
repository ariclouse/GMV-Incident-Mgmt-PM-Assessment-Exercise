export type QuickFilter = "unassigned" | "open" | "mine" | null;

export default function StatCounters({
  unassigned,
  open,
  mine,
  active,
  onSelect,
  disabledFilters = [],
}: {
  unassigned: number;
  open: number;
  mine: number;
  active: QuickFilter;
  onSelect: (filter: QuickFilter) => void;
  disabledFilters?: Exclude<QuickFilter, null>[];
}) {
  const items: { key: Exclude<QuickFilter, null>; count: number; label: string }[] = [
    { key: "unassigned", count: unassigned, label: "Unassigned" },
    { key: "open", count: open, label: "Open" },
    { key: "mine", count: mine, label: "My Incidents" },
  ];

  return (
    <div className="flex items-center gap-3">
      {items.map((item) => {
        const isActive = active === item.key;
        const isDisabled = disabledFilters.includes(item.key);
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => !isDisabled && onSelect(isActive ? null : item.key)}
            disabled={isDisabled}
            aria-pressed={isActive}
            title={isDisabled ? `No ${item.label.toLowerCase()} incidents on this tab` : undefined}
            className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm transition ${
              isDisabled
                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                : isActive
                  ? "bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1"
                  : "bg-[#3a4356] text-white hover:bg-[#2c3446]"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                isDisabled ? "bg-slate-300/60" : isActive ? "bg-white/30" : "bg-white/20"
              }`}
            >
              {item.count}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
