"use client";

import { useRef, useState } from "react";
import { TrendPoint } from "@/lib/insights";

const COLOR = "#2a78d6";
const WIDTH = 640;
const HEIGHT = 160;
const PAD_LEFT = 8;
const PAD_BOTTOM = 22;
const PAD_TOP = 12;
const PAD_RIGHT = 8;

export default function TrendLineChart({ data }: { data: TrendPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const max = Math.max(1, ...data.map((d) => d.value));
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const points = data.map((d, i) => ({
    x: PAD_LEFT + (data.length === 1 ? 0 : (i / (data.length - 1)) * plotWidth),
    y: PAD_TOP + plotHeight - (d.value / max) * plotHeight,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${PAD_TOP + plotHeight} L${points[0].x},${PAD_TOP + plotHeight} Z`;

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const labelStep = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {[0, 0.5, 1].map((step) => {
          const y = PAD_TOP + plotHeight - step * plotHeight;
          return (
            <line key={step} x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} stroke="#eceae5" strokeWidth={1} />
          );
        })}

        <path d={areaPath} fill={COLOR} opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {hovered && (
          <line
            x1={hovered.x}
            x2={hovered.x}
            y1={PAD_TOP}
            y2={PAD_TOP + plotHeight}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        )}

        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          const isHovered = hoverIndex === i;
          if (!isLast && !isHovered) return null;
          return <circle key={p.dateKey} cx={p.x} cy={p.y} r={4} fill={COLOR} stroke="#ffffff" strokeWidth={2} />;
        })}

        {points
          .filter((_, i) => i % labelStep === 0 || i === points.length - 1)
          .map((p) => (
            <text key={p.dateKey} x={p.x} y={HEIGHT - 4} textAnchor="middle" fontSize={9} fill="#94a3b8">
              {p.label}
            </text>
          ))}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg"
          style={{ left: `${(hovered.x / WIDTH) * 100}%`, top: `${(hovered.y / HEIGHT) * 100}%` }}
        >
          {hovered.label}: <span className="font-semibold">{hovered.value}</span>
        </div>
      )}
    </div>
  );
}
