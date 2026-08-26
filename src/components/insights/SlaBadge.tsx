import { SlaStatus, SLA_STATUS_LABELS } from "@/lib/insights";

const STYLES: Record<SlaStatus, { pill: string; dot: string }> = {
  onTrack: { pill: "bg-green-50 text-green-700", dot: "bg-green-500" },
  atRisk: { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  overdue: { pill: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

export default function SlaBadge({ status }: { status: SlaStatus }) {
  const style = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {SLA_STATUS_LABELS[status]}
    </span>
  );
}
