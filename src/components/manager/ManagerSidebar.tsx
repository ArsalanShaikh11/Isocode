"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  CalendarCheck2,
  Activity,
  GitCompare,
  LogOut,
  Building2,
} from "lucide-react";
import { clsx } from "clsx";

export function ManagerSidebar({
  managerName,
  branchName,
}: {
  managerName: string;
  branchName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/sign-in");
    router.refresh();
  };

  const menu = [
    {
      label: "Portfolio Analytics",
      href: "/manager",
      icon: LayoutDashboard,
      active: pathname === "/manager",
    },
    {
      label: "CSV Import & Assign",
      href: "/manager/import",
      icon: UploadCloud,
      active: pathname === "/manager/import",
    },
    {
      label: "Promise Tracker",
      href: "/manager/promises",
      icon: CalendarCheck2,
      active: pathname === "/manager/promises",
    },
    {
      label: "Officer Activity Log",
      href: "/manager/activity",
      icon: Activity,
      active: pathname === "/manager/activity",
    },
    {
      label: "AI Model Backtesting",
      href: "/manager/backtest",
      icon: GitCompare,
      active: pathname === "/manager/backtest",
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E2E4DE] flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand */}
        <div className="p-5 border-b border-[#E2E4DE]">
          <Link href="/manager" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#176B4D] flex items-center justify-center text-white font-bold text-sm shadow-xs">
              CQ
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-[#171918]">
                CollectIQ
              </span>
              <span className="block text-[11px] text-muted font-medium">
                Branch Operations
              </span>
            </div>
          </Link>

          <div className="mt-4 pt-3 border-t border-[#F2F3EE] flex items-center gap-2 text-xs text-muted">
            <Building2 className="w-3.5 h-3.5 text-[#176B4D]" />
            <span className="truncate">{branchName || "Indore Main"}</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  item.active
                    ? "bg-[#EAF3EF] text-[#176B4D]"
                    : "text-[#171918] hover:bg-[#F2F3EE] hover:text-[#171918]"
                )}
              >
                <Icon
                  className={clsx(
                    "w-4 h-4",
                    item.active ? "text-[#176B4D]" : "text-muted"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer user profile */}
      <div className="p-4 border-t border-[#E2E4DE] bg-[#FAFBF9]">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-semibold text-[#171918] truncate">
              {managerName}
            </p>
            <p className="text-[11px] text-muted">Branch Manager</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-md hover:bg-[#E8E9E3] text-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

