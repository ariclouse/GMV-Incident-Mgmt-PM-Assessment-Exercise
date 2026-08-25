import { NextRequest, NextResponse } from "next/server";
import { store, activity } from "@/lib/store";
import { UserRef } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { text, author } = (await req.json()) as {
    text: string;
    author: UserRef;
  };

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Comment text required" }, { status: 400 });
  }

  const incident = store.addActivity(
    id,
    activity("comment", text.trim(), author)
  );

  if (!incident) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ incident });
}
