import { NextResponse } from "next/server";
import { META } from "@/lib/store";

export async function GET() {
  return NextResponse.json(META);
}
