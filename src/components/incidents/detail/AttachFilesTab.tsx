"use client";

import { useRef, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Incident } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { CURRENT_USER } from "@/lib/currentUser";
import { apiFetch } from "@/lib/apiClient";

export default function AttachFilesTab({
  incident,
  onUpdate,
}: {
  incident: Incident;
  onUpdate: (incident: Incident) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    try {
      const data = await apiFetch<{ incident: Incident }>(`/api/incidents/${incident.id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          dataUrl,
          kind: file.type.startsWith("image/") ? "image" : "document",
          uploadedBy: CURRENT_USER.name,
        }),
      });
      onUpdate(data.incident);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Couldn't upload ${file.name}.`);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  }

  return (
    <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
      <div>
        {incident.attachments.length === 0 ? (
          <p className="text-sm text-slate-400">No files attached yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {incident.attachments.map((att) => (
              <div key={att.id} className="group">
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                  {att.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={att.dataUrl} alt={att.name} className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">{att.name}</p>
                <p className="truncate text-[10px] text-slate-400">
                  {att.uploadedBy} · {formatDate(att.uploadedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-[280px] flex-col items-center justify-center rounded-md border-2 border-dashed transition ${
          dragging ? "border-blue-400 bg-blue-50" : "border-slate-300"
        }`}
      >
        <Plus className="mb-3 h-8 w-8 text-slate-300" />
        <p className="mb-4 text-sm text-slate-400">Drag files here, or</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Select File
        </button>
        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
