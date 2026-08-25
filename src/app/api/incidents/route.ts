import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ incidents: store.list() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const incident = store.create(body);
  return NextResponse.json({ incident }, { status: 201 });
}
