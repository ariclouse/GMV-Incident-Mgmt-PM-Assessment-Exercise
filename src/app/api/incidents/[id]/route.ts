import { NextRequest, NextResponse } from "next/server";
import { store, activity } from "@/lib/store";
import { Status, UserRef } from "@/lib/types";

const VALID_STATUSES: Status[] = ["Open", "In Review", "Closed"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const incident = store.get(id);
  if (!incident) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ incident });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patch = await req.json();
  const before = store.get(id);
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (patch.status && patch.status !== before.status) {
    if (!VALID_STATUSES.includes(patch.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    if (patch.status === "Closed" && before.status === "Open") {
      return NextResponse.json(
        { error: "An incident must move to In Review before it can be Closed." },
        { status: 400 }
      );
    }
    store.addActivity(
      id,
      activity(
        "system",
        `Status changed from ${before.status} to ${patch.status}.`
      )
    );
    // Closing stamps closedAt; moving off Closed (e.g. reopening) must clear it, or
    // resolution-trend charts and exports keep attributing a still-open incident to its old close date.
    patch.closedAt = patch.status === "Closed" ? new Date().toISOString() : undefined;
    if (before.status === "Closed") {
      patch.reopenCount = (before.reopenCount ?? 0) + 1;
      patch.lastReopenedAt = new Date().toISOString();
    }
  }

  if (patch.assignee !== undefined) {
    const newAssignee = patch.assignee as UserRef | undefined;
    const beforeAssigneeId = before.assignee?.id ?? null;
    const newAssigneeId = newAssignee?.id ?? null;
    if (newAssigneeId !== beforeAssigneeId) {
      const label = newAssignee ? newAssignee.name : "Unassigned";
      store.addActivity(id, activity("system", `Assignee changed to ${label}.`));
    }
  }

  const incident = store.update(id, patch);
  return NextResponse.json({ incident });
}
