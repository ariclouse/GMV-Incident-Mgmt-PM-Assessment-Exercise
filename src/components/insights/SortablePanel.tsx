"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

export default function SortablePanel({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  const dragHandle = (
    <button
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      aria-label="Drag to reorder panel"
      className="mt-0.5 cursor-grab touch-none rounded text-slate-300 hover:text-slate-500 active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children(dragHandle)}
    </div>
  );
}
