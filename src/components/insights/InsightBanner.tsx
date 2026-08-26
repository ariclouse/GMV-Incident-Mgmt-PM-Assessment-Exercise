import { AlertTriangle } from "lucide-react";
import { Incident } from "@/lib/types";
import { computeInsightBanner } from "@/lib/insights";

export default function InsightBanner({ incidents }: { incidents: Incident[] }) {
  const insight = computeInsightBanner(incidents);
  if (!insight) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 border-l-4 border-l-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <span>{insight.message}</span>
    </div>
  );
}
