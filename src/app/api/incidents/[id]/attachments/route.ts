import { NextRequest, NextResponse } from "next/server";
import { store, uid, activity } from "@/lib/store";
import { CURRENT_USER } from "@/lib/currentUser";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, dataUrl, kind, uploadedBy } = await req.json();

  if (!name || !dataUrl) {
    return NextResponse.json({ error: "File data required" }, { status: 400 });
  }

  const attachment = {
    id: uid("att"),
    name,
    dataUrl,
    kind: kind === "image" ? ("image" as const) : ("document" as const),
    uploadedBy: uploadedBy ?? CURRENT_USER.name,
    uploadedAt: new Date().toISOString(),
  };

  const incident = store.addAttachment(id, attachment);
  if (!incident) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  store.addActivity(
    id,
    activity("system", `${attachment.uploadedBy} added a new attachment: ${name}.`)
  );

  return NextResponse.json({ incident });
}
