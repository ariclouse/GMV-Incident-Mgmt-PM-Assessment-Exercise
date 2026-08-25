"use client";

import { useState } from "react";
import { CountItem } from "@/lib/insights";

const DEFAULT_COLOR = "#2a78d6";
const PLOT_HEIGHT = 160;

export default function BarChart({
  data,
  colors,
  height = PLOT_HEIGHT,
}: {
  data: CountItem[];
  colors?: string[];
  height?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const gridSteps = [0.25, 0.5, 0.75, 1];

  return (
    <div>
      <div className="relative" style={{ height }}>
        {gridSteps.map((step) => (
          <div
            key={step}
            className="absolute inset-x-0 border-t border-slate-100"
            style={{ bottom: `${step * height}px` }}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 flex h-full items-end justify-around gap-2 px-1">
          {data.map((item, i) => {
            const barHeight = Math.round((item.value / max) * (height - 20));
            const color = colors?.[i] ?? DEFAULT_COLOR;
            const isHovered = hovered === i;
            return (
              <div
                key={item.label}
                className="relative flex h-full max-w-[42px] flex-1 flex-col items-center justify-end"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {isHovered && (
                  <div className="absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg">
                    {item.label}: <span className="font-semibold">{item.value}</span>
                  </div>
                )}
                <span className="mb-1 text-xs font-semibold tabular-nums text-slate-700">
                  {item.value}
                </span>
                <div
                  className="w-full max-w-[24px] rounded-t transition-opacity"
                  style={{
                    height: Math.max(barHeight, 2),
                    backgroundColor: color,
                    opacity: hovered === null || isHovered ? 1 : 0.55,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex items-start justify-around gap-2 px-1">
        {data.map((item) => (
          <span
            key={item.label}
            className="max-w-[64px] flex-1 text-center text-[11px] leading-tight text-slate-500"
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
