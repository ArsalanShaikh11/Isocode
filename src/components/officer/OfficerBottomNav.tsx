"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListOrdered, CalendarClock, History, Shield } from "lucide-react";
import { clsx } from "clsx";

export function OfficerBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Priority List",
      href: "/officer",
      icon: ListOrdered,
      active: pathname === "/officer" || pathname.startsWith("/officer/loans/"),
    },
    {
      label: "Promises",
      href: "/officer/promises",
      icon: CalendarClock,
      active: pathname === "/officer/promises",
    },
    {
      label: "My Activity",
      href: "/officer/activity",
      icon: History,
      active: pathname === "/officer/activity",
    },
    {
      label: "Switch Role",
      href: "/auth/sign-in",
      icon: Shield,
      active: false,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E4DE] shadow-elevated pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full py-1 rounded-lg transition-colors touch-target",
                item.active
                  ? "text-[#176B4D] font-medium"
                  : "text-muted hover:text-foreground"
              )}
            >
              <Icon
                className={clsx("w-5 h-5 mb-1", item.active && "stroke-[2.25px]")}
              />
              <span className="text-[11px] leading-none tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

