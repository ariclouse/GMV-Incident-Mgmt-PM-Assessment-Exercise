"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Incident, Priority } from "@/lib/types";
import { slaAgeDays, slaStatus, SlaStatus } from "@/lib/insights";
import SlaBadge from "./SlaBadge";

const SEVERITY_STYLES: Record<Priority, string> = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-orange-50 text-orange-700",
  Critical: "bg-red-50 text-red-700",
};

const SLA_RANK: Record<SlaStatus, number> = { overdue: 0, atRisk: 1, onTrack: 2 };

function ageDays(incident: Incident): number {
  return Math.floor(slaAgeDays(incident));
}

export default function AtRiskTable({ incidents }: { incidents: Incident[] }) {
  const router = useRouter();
  const rows = incidents
    .map((i) => ({ incident: i, sla: slaStatus(i) }))
    .filter((r): r is { incident: Incident; sla: SlaStatus } => r.sla === "atRisk" || r.sla === "overdue")
    .sort((a, b) => SLA_RANK[a.sla] - SLA_RANK[b.sla] || ageDays(b.incident) - ageDays(a.incident))
    .slice(0, 8);

  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Nothing at risk or overdue right now.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
            <th className="pb-2 pr-3">ID</th>
            <th className="pb-2 pr-3">Type</th>
            <th className="pb-2 pr-3">Route</th>
            <th className="pb-2 pr-3">Severity</th>
            <th className="pb-2 pr-3">Age</th>
            <th className="pb-2 pr-3">SLA</th>
            <th className="pb-2">Assignee</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ incident, sla }) => (
            <tr
              key={incident.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/?view=active&incident=${incident.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/?view=active&incident=${incident.id}`);
                }
              }}
              className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
            >
              <td className="py-2 pr-3 font-semibold text-slate-800">{incident.id}</td>
              <td className="py-2 pr-3 text-slate-600">{incident.type}</td>
              <td className="max-w-[140px] truncate py-2 pr-3 text-slate-600">{incident.route}</td>
              <td className="py-2 pr-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLES[incident.priority]}`}>
                  {incident.priority}
                </span>
              </td>
              <td className="py-2 pr-3 text-slate-600">{ageDays(incident)}d</td>
              <td className="py-2 pr-3">
                <SlaBadge status={sla} />
              </td>
              <td className="py-2 text-slate-600">{incident.assignee?.name ?? "Unassigned"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link
        href="/?view=active"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
      >
        View all in Incident Management
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
