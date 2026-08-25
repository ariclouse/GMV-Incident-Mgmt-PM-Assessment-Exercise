"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, Link2, List, ListOrdered, Quote, Table, Minus, UserPlus2, X } from "lucide-react";
import { Incident, MetaOptions, UserRef } from "@/lib/types";
import { formatTime, formatDate } from "@/lib/format";
import { MAX_DESCRIPTION_LENGTH } from "@/lib/constants";
import { CURRENT_USER } from "@/lib/currentUser";
import { apiFetch } from "@/lib/apiClient";
import Avatar from "../Avatar";

export default function DetailCommentTab({
  incident,
  meta,
  onUpdate,
}: {
  incident: Incident;
  meta: MetaOptions | null;
  onUpdate: (incident: Incident) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== incident.description) {
      editorRef.current.innerHTML = incident.description;
    }
    setCharCount(editorRef.current?.textContent?.length ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incident.id]);

  useEffect(() => {
    // Cancel a pending autosave when the panel unmounts (e.g. row collapsed, another
    // incident expanded) — otherwise it fires against a detached editor and saves "".
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function handleDescriptionBeforeInput(e: React.FormEvent<HTMLDivElement>) {
    const nativeEvent = e.nativeEvent as InputEvent;
    const insertedLength = nativeEvent.data?.length ?? 0;
    const currentLength = editorRef.current?.textContent?.length ?? 0;
    if (insertedLength > 0 && currentLength + insertedLength > MAX_DESCRIPTION_LENGTH) {
      e.preventDefault();
    }
  }

  function handleDescriptionInput() {
    setCharCount(editorRef.current?.textContent?.length ?? 0);
    setSaving(true);
    setSaveError(null);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const html = editorRef.current?.innerHTML ?? "";
      try {
        const data = await apiFetch<{ incident: Incident }>(`/api/incidents/${incident.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: html }),
        });
        onUpdate(data.incident);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Save failed.");
      } finally {
        setSaving(false);
      }
    }, 700);
  }

  async function submitComment() {
    if (!comment.trim()) return;
    setCommentError(null);
    try {
      const data = await apiFetch<{ incident: Incident }>(`/api/incidents/${incident.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: comment, author: CURRENT_USER }),
      });
      onUpdate(data.incident);
      setComment("");
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Couldn't post comment.");
    }
  }

  async function setAssignee(user: UserRef | undefined) {
    setAssignError(null);
    try {
      const data = await apiFetch<{ incident: Incident }>(`/api/incidents/${incident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee: user ?? null }),
      });
      onUpdate(data.incident);
      setAssigning(false);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Couldn't update assignee.");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
      <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-2 text-slate-500">
          <span className="text-xs font-semibold">h1</span>
          <span className="text-xs font-semibold">h2</span>
          <span className="text-xs font-semibold">h3</span>
          <span className="mx-1 h-4 w-px bg-slate-200" />
          <Bold className="h-3.5 w-3.5" />
          <Italic className="h-3.5 w-3.5" />
          <Underline className="h-3.5 w-3.5" />
          <Link2 className="h-3.5 w-3.5" />
          <span className="mx-1 h-4 w-px bg-slate-200" />
          <List className="h-3.5 w-3.5" />
          <ListOrdered className="h-3.5 w-3.5" />
          <Quote className="h-3.5 w-3.5" />
          <Table className="h-3.5 w-3.5" />
          <Minus className="h-3.5 w-3.5" />
          <span className="ml-auto flex items-center gap-3 text-xs">
            <span
              className={charCount >= MAX_DESCRIPTION_LENGTH ? "text-red-500" : "text-slate-400"}
            >
              {charCount.toLocaleString()} / {MAX_DESCRIPTION_LENGTH.toLocaleString()}
            </span>
            <span className={saveError ? "italic text-red-500" : "italic text-slate-400"}>
              {saveError ?? (saving ? "Saving..." : "Saved")}
            </span>
          </span>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onBeforeInput={handleDescriptionBeforeInput}
          onInput={handleDescriptionInput}
          onPaste={(e) => {
            const currentLength = editorRef.current?.textContent?.length ?? 0;
            const pasted = e.clipboardData.getData("text/plain");
            if (currentLength + pasted.length > MAX_DESCRIPTION_LENGTH) {
              e.preventDefault();
              const remaining = Math.max(0, MAX_DESCRIPTION_LENGTH - currentLength);
              document.execCommand("insertText", false, pasted.slice(0, remaining));
            }
          }}
          className="rich-text min-h-[280px] px-6 py-5 text-sm leading-relaxed text-slate-700 outline-none"
        />
      </div>

      <div className="px-6 py-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">Assignee:</span>
          {incident.assignee ? (
            <div className="flex items-center gap-2">
              <Avatar initials={incident.assignee.initials} name={incident.assignee.name} size="sm" />
            </div>
          ) : (
            <span className="text-sm text-slate-400">Unassigned</span>
          )}
          <button
            onClick={() => setAssigning((v) => !v)}
            className="ml-1 text-slate-400 hover:text-slate-600"
          >
            <UserPlus2 className="h-4 w-4" />
          </button>
          {assigning && meta && (
            <div className="relative">
              <div className="absolute left-0 top-6 z-10 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                {meta.users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setAssignee(u)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-50"
                  >
                    <Avatar initials={u.initials} size="sm" />
                    {u.name}
                  </button>
                ))}
                <button
                  onClick={() => setAssignee(undefined)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-400 hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" /> Unassign
                </button>
              </div>
            </div>
          )}
        </div>
        {assignError && <p className="mb-2 text-xs text-red-500">{assignError}</p>}

        <hr className="mb-4 border-slate-200" />
        <h3 className="mb-3 text-sm font-bold text-slate-800">Comments / History</h3>

        <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {incident.activity.map((entry) =>
            entry.kind === "system" ? (
              <div key={entry.id} className="flex items-start justify-between gap-2 text-xs italic text-slate-400">
                <span>{entry.text}</span>
                <span className="shrink-0 whitespace-nowrap">
                  {formatTime(entry.timestamp)} - {formatDate(entry.timestamp)}
                </span>
              </div>
            ) : (
              <div key={entry.id} className="flex items-start gap-2">
                {entry.author && <Avatar initials={entry.author.initials} size="sm" />}
                <div className="flex-1 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  {entry.text}
                </div>
                <span className="shrink-0 whitespace-nowrap pt-2 text-xs italic text-slate-400">
                  {formatTime(entry.timestamp)} - {formatDate(entry.timestamp)}
                </span>
              </div>
            )
          )}
        </div>

        <div className="mt-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Add a comment..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
          {commentError && <p className="mt-1 text-xs text-red-500">{commentError}</p>}
          <div className="mt-2 flex justify-end">
            <button
              onClick={submitComment}
              className="rounded-md bg-[#3a4356] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2c3446]"
            >
              Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
