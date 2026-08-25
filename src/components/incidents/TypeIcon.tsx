import { AlertTriangle, Wrench, MessageSquareWarning, CarFront, Siren, HelpCircle } from "lucide-react";
import { IncidentType } from "@/lib/types";

export const TYPE_ICONS: Record<IncidentType, React.ComponentType<{ className?: string }>> = {
  Emergency: Siren,
  Mechanical: Wrench,
  "Rider Complaint": MessageSquareWarning,
  "Service Disruption": AlertTriangle,
  Accident: CarFront,
  Other: HelpCircle,
};

export default function TypeIcon({ type }: { type: IncidentType }) {
  const Icon = TYPE_ICONS[type] ?? AlertTriangle;
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1b2436] text-white">
      <Icon className="h-4 w-4" />
    </div>
  );
}
