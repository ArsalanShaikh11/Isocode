"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";
import { OfflineStatusIndicator } from "../ui/OfflineStatusIndicator";

export function OfficerNavbar({
  officerName,
  branchName,
}: {
  officerName: string;
  branchName?: string;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/sign-in");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E2E4DE] px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/officer" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#176B4D] flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-sm">
              CQ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-[#171918]">
                  CollectIQ
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#E8E9E3] text-muted font-medium">
                  Field
                </span>
              </div>
              <p className="text-[11px] text-muted truncate max-w-[140px]">
                {officerName}
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <OfflineStatusIndicator />
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-2 text-muted hover:text-foreground rounded-lg hover:bg-[#F2F3EE] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

