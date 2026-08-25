"use client";

import { useEffect, useRef, useState } from "react";
import { Incident, MetaOptions, UserRef } from "@/lib/types";
import { apiFetch } from "@/lib/apiClient";
import Avatar from "./Avatar";

export default function AssigneeQuickPicker({
  incident,
  meta,
  onUpdate,
}: {
  incident: Incident;
  meta: MetaOptions | null;
  onUpdate: (incident: Incident) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function openMenu(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
    setOpen((v) => !v);
  }

  async function assign(user: UserRef) {
    setError(null);
    try {
      const data = await apiFetch<{ incident: Incident }>(`/api/incidents/${incident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee: user }),
      });
      onUpdate(data.incident);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update assignee.");
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        title="Assign a user"
        onClick={openMenu}
        className="w-fit rounded text-left text-sm text-slate-400 underline decoration-dotted decoration-slate-300 underline-offset-2 transition hover:text-slate-600 hover:decoration-slate-500"
      >
        Unassigned
      </button>

      {open && position && meta && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: position.top, left: position.left }}
          onClick={(e) => e.stopPropagation()}
          className="z-50 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          {meta.users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => assign(u)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-50"
            >
              <Avatar initials={u.initials} size="sm" />
              {u.name}
            </button>
          ))}
          {error && <p className="px-3 py-1.5 text-xs text-red-500">{error}</p>}
        </div>
      )}
    </>
  );
}
