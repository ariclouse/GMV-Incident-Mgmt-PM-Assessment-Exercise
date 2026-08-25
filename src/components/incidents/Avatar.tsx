export default function Avatar({
  initials,
  name,
  size = "md",
  dark = true,
}: {
  initials: string;
  name?: string;
  size?: "sm" | "md";
  dark?: boolean;
}) {
  const dims = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex ${dims} shrink-0 items-center justify-center rounded-full font-semibold text-white ${
          dark ? "bg-[#3a4356]" : "bg-slate-400"
        }`}
      >
        {initials}
      </div>
      {name && <span className="text-sm text-slate-700">{name}</span>}
    </div>
  );
}
