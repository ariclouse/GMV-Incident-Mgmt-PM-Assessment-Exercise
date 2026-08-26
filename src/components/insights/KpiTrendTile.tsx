export default function KpiTrendTile({
  label,
  value,
  delta,
  caption,
  sparkline,
  flag,
}: {
  label: string;
  value: string;
  delta?: { text: string; good: boolean } | null;
  caption: string;
  sparkline: number[];
  flag?: string;
}) {
  const max = Math.max(1, ...sparkline);
  const coords = sparkline.map((v, i) => ({
    x: sparkline.length > 1 ? (i / (sparkline.length - 1)) * 100 : 100,
    y: 26 - (v / max) * 20,
  }));
  const points = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1] ?? { x: 100, y: 26 };
  const dotColor = delta ? (delta.good ? "#16a34a" : "#dc2626") : "#2a78d6";

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-[28px] font-bold text-slate-900">{value}</span>
        {delta && (
          <span className={`text-xs font-semibold ${delta.good ? "text-green-600" : "text-red-600"}`}>
            {delta.text}
          </span>
        )}
      </div>
      <div className="mb-1.5 text-xs text-slate-400">{caption}</div>
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="block h-[26px] w-full">
        <polyline
          points={points}
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={last.x} cy={last.y} r="3" fill={dotColor} />
      </svg>
      {flag && <div className="mt-1.5 text-xs font-semibold text-red-600">↑ {flag}</div>}
    </div>
  );
}
