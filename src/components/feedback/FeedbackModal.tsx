"use client";

import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { CURRENT_USER } from "@/lib/currentUser";
import { apiFetch } from "@/lib/apiClient";
import Dialog from "../ui/Dialog";
import Button from "../ui/Button";
import StarRating from "./StarRating";

type Step = "rate" | "comment" | "done";

export default function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("rate");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPositive = rating === 5;
  const prompt = isPositive ? "Thank you! What do you like best?" : "What can we do better?";

  function handleRate(n: number) {
    setRating(n);
    // Brief pause so the selected star is visible before advancing.
    window.setTimeout(() => setStep("comment"), 200);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, submittedBy: CURRENT_USER }),
      });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog onClose={onClose} maxWidthClassName="max-w-md">
      {step === "rate" && (
        <>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-800">Leave Feedback</h2>
            <Button variant="icon" aria-label="Close" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col items-center gap-4 px-6 py-10">
            <p className="text-sm text-slate-600">
              How would you rate your experience with Incident Management?
            </p>
            <StarRating value={rating} onChange={handleRate} />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </>
      )}

      {step === "comment" && (
        <>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-800">{prompt}</h2>
            <Button variant="icon" aria-label="Close" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <StarRating value={rating} readOnly size="h-5 w-5" />
              <button
                type="button"
                onClick={() => setStep("rate")}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Change rating
              </button>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                {isPositive ? "What do you like best? (optional)" : "What can we do better? (optional)"}
              </span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Type your feedback..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </label>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Sending..." : "Send Feedback"}
            </Button>
          </div>
        </>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
          <p className="text-base font-semibold text-slate-800">Thanks for your feedback!</p>
          <p className="text-sm text-slate-500">We appreciate you helping us improve Incident Management.</p>
          <Button variant="primary" onClick={onClose} className="mt-2">
            Done
          </Button>
        </div>
      )}
    </Dialog>
  );
}
