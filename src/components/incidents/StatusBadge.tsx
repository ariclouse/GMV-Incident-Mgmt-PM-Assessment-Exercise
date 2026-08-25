import { Status } from "@/lib/types";

const STYLES: Record<Status, string> = {
  Open: "bg-slate-200 text-slate-800",
  "In Review": "border border-blue-300 bg-blue-50 text-blue-700",
  Closed: "border border-green-300 bg-green-50 text-green-700",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-4 py-1.5 text-sm font-semibold ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
