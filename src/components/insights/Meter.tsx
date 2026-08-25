const BANDS = [
  { min: 66, fill: "#0ca30c", track: "#e2f5e2", label: "On track" },
  { min: 33, fill: "#fab219", track: "#fdf1d9", label: "Needs attention" },
  { min: 0, fill: "#d03b3b", track: "#fae2e2", label: "Falling behind" },
];

function bandFor(rate: number) {
  return BANDS.find((b) => rate >= b.min) ?? BANDS[BANDS.length - 1];
}

export default function Meter({
  rate,
  closedCount,
  total,
}: {
  rate: number;
  closedCount: number;
  total: number;
}) {
  const band = bandFor(rate);

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="text-[36px] font-semibold leading-none text-slate-900">
          {rate.toFixed(0)}%
        </span>
        <span className="text-xs font-semibold" style={{ color: band.fill }}>
          {band.label}
        </span>
      </div>
      <div
        className="mt-4 h-3 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: band.track }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, rate)}%`, backgroundColor: band.fill }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {closedCount.toLocaleString()} of {total.toLocaleString()} incidents closed
      </p>
    </div>
  );
}
