"use client";

import { useState } from "react";
import { Star } from "lucide-react";

const RATINGS = [1, 2, 3, 4, 5];

export default function StarRating({
  value,
  onChange,
  size = "h-8 w-8",
  readOnly = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: string;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (readOnly) {
    return (
      <div className="flex items-center gap-1">
        {RATINGS.map((n) => (
          <Star
            key={n}
            className={`${size} ${n <= value ? "fill-amber-400 text-amber-400" : "fill-none text-slate-300"}`}
          />
        ))}
      </div>
    );
  }

  const display = hover ?? value;

  return (
    <div className="flex items-center gap-1">
      {RATINGS.map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="transition hover:scale-110"
        >
          <Star
            className={`${size} transition ${
              n <= display ? "fill-amber-400 text-amber-400" : "fill-none text-slate-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
