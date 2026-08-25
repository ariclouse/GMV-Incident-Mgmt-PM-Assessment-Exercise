import { UserRef } from "./types";

export interface FeedbackEntry {
  id: string;
  rating: number;
  comment: string;
  submittedBy: UserRef;
  submittedAt: string;
}

class FeedbackStore {
  private entries: FeedbackEntry[] = [];

  add(input: { rating: number; comment: string; submittedBy: UserRef }): FeedbackEntry {
    const entry: FeedbackEntry = {
      id: `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      rating: input.rating,
      comment: input.comment,
      submittedBy: input.submittedBy,
      submittedAt: new Date().toISOString(),
    };
    this.entries.unshift(entry);
    return entry;
  }

  list(): FeedbackEntry[] {
    return [...this.entries];
  }
}

const globalForFeedback = globalThis as unknown as { __feedbackStore?: FeedbackStore };

export const feedbackStore = globalForFeedback.__feedbackStore ?? new FeedbackStore();
globalForFeedback.__feedbackStore = feedbackStore;
