"use client";

import { Navigation } from "lucide-react";
import { Incident } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/format";

export default function VehicleHistoryTab({ incident }: { incident: Incident }) {
  const point = incident.vehicleHistory[0];

  if (!point) {
    return (
      <div className="flex min-h-[260px] items-center justify-center px-6 py-10 text-sm text-slate-400">
        No vehicle location history available for this incident.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.3fr_1fr]">
      <div className="relative min-h-[320px] overflow-hidden border-b border-slate-200 bg-[#e8eaed] lg:border-b-0 lg:border-r">
        <svg viewBox="0 0 400 320" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="320" fill="#e9ebee" />
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 70} y1="0" x2={i * 70} y2="320" stroke="#d7dade" strokeWidth="1" />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 60} x2="400" y2={i * 60} stroke="#d7dade" strokeWidth="1" />
          ))}
          <polyline
            points="60,260 150,180 150,60"
            fill="none"
            stroke="#f5a623"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g transform="translate(150,170)">
            <rect x="-22" y="-10" rx="4" width="44" height="20" fill="#1b2436" />
            <text x="0" y="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">
              {incident.vehicleNumber}
            </text>
          </g>
        </svg>
        <div className="absolute right-4 top-4 flex flex-col overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
          <button className="px-3 py-1.5 text-lg leading-none text-slate-500 hover:bg-slate-50">+</button>
          <div className="h-px bg-slate-200" />
          <button className="px-3 py-1.5 text-lg leading-none text-slate-500 hover:bg-slate-50">−</button>
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-md bg-white/90 px-3 py-2 text-xs shadow-sm">
          <div>
            <div className="text-lg font-bold text-slate-800">{point.speedMph}</div>
            <div className="text-[10px] text-slate-400">mph</div>
          </div>
          <div className="flex flex-col items-center text-slate-500">
            <Navigation className="h-4 w-4" />
            <span className="text-[10px]">{point.heading}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between px-6 py-6">
        <dl className="space-y-3 text-sm">
          <Row label="Date/Time" value={`${formatDate(point.timestamp)} - ${formatTime(point.timestamp)}`} />
          <Row label="Vehicle" value={incident.vehicleNumber} />
          <Row label="Driver Name" value={point.driverName} />
          <Row
            label="Route"
            value={
              <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">{point.route}</span>
            }
          />
          <Row label="Trip" value={point.trip} />
          <Row label="Run" value={point.run} />
          <Row label="Block" value={point.block} />
        </dl>
        <button className="mt-6 self-end rounded-md bg-[#3a4356] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2c3446]">
          View Vehicle History
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="w-24 shrink-0 font-semibold text-slate-700">{label}:</dt>
      <dd className="text-slate-600">{value}</dd>
    </div>
  );
}
