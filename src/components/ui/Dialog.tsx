"use client";

import { useEffect } from "react";

export default function Dialog({
  onClose,
  children,
  maxWidthClassName = "max-w-lg",
}: {
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClassName?: string;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidthClassName} overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(40,36,30,0.14)]`}
      >
        {children}
      </div>
    </div>
  );
}
