import { NextRequest, NextResponse } from "next/server";
import { feedbackStore } from "@/lib/feedbackStore";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rating = Number(body.rating);

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
  }

  const entry = feedbackStore.add({
    rating,
    comment: typeof body.comment === "string" ? body.comment.trim() : "",
    submittedBy: body.submittedBy,
  });

  return NextResponse.json({ feedback: entry }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ feedback: feedbackStore.list() });
}
