export default function StatTile({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1.5 text-[28px] font-semibold leading-none text-slate-900">{value}</div>
      {caption && <div className="mt-1.5 text-xs text-slate-400">{caption}</div>}
    </div>
  );
}
