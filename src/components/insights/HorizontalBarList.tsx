import { CountItem } from "@/lib/insights";

const BAR_COLOR = "#2a78d6";

export default function HorizontalBarList({ data }: { data: CountItem[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No matching incidents.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((item) => (
        <div
          key={item.label}
          title={`${item.label}: ${item.value} incident${item.value === 1 ? "" : "s"}`}
          className="grid grid-cols-[168px_1fr_36px] items-center gap-2.5"
        >
          <span className="truncate text-xs text-slate-600">{item.label}</span>
          <div className="relative h-5">
            <div
              className="absolute left-0 top-0.5 h-4 rounded-r"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: BAR_COLOR }}
            />
          </div>
          <span className="text-right text-xs font-semibold text-slate-800">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
