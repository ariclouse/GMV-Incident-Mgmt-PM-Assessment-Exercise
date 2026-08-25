"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, MessageSquare, MessageCircle, UserCircle2 } from "lucide-react";

const PRIMARY_NAV = ["DISPATCH", "OPS", "PLAN", "RIDE", "MAINTENANCE", "ADMIN"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInsights = pathname === "/insights";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between bg-[#1b2436] px-6 text-white">
        <div className="flex items-center gap-10">
          <div className="flex items-baseline gap-1 font-bold tracking-wide">
            <span className="text-lg italic text-red-500">gmv</span>
            <span className="text-lg">SYNC</span>
          </div>
          <nav className="flex items-center gap-7 text-xs font-semibold tracking-wider text-slate-300">
            {PRIMARY_NAV.map((item) => (
              <span
                key={item}
                className={
                  item === "OPS"
                    ? "cursor-pointer border-b-2 border-blue-400 pb-4 pt-4 text-white"
                    : "cursor-pointer pb-4 pt-4 hover:text-white"
                }
              >
                {item}
              </span>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-slate-200">
          <HelpCircle className="h-5 w-5 cursor-pointer hover:text-white" />
          <MessageSquare className="h-5 w-5 cursor-pointer hover:text-white" />
          <MessageCircle className="h-5 w-5 cursor-pointer hover:text-white" />
          <UserCircle2 className="h-5 w-5" />
          <span className="text-xs font-semibold tracking-wide">FIRST NAME</span>
        </div>
      </header>
      <div className="flex h-10 items-center gap-6 bg-gradient-to-r from-[#16243f] to-[#2f6fce] px-6 text-sm text-slate-200">
        <Link
          href="/insights"
          className={
            isInsights
              ? "border-b-2 border-white pb-2.5 pt-2.5 font-medium text-white"
              : "cursor-pointer pb-2.5 pt-2.5 hover:text-white"
          }
        >
          Insights
        </Link>
        <Link
          href="/"
          className={
            !isInsights
              ? "border-b-2 border-white pb-2.5 pt-2.5 font-medium text-white"
              : "cursor-pointer pb-2.5 pt-2.5 hover:text-white"
          }
        >
          Incident Management
        </Link>
      </div>
      <main className="flex-1 bg-[#f4f5f7]">{children}</main>
    </div>
  );
}
