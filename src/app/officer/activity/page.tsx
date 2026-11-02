import React from "react";
import { OfficerNavbar } from "@/components/officer/OfficerNavbar";
import { OfficerBottomNav } from "@/components/officer/OfficerBottomNav";
import { ActivityLogView } from "@/components/common/ActivityLogView";

export default function OfficerActivityPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F5] pb-24">
      <OfficerNavbar officerName="Rahul Chouhan" />
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div>
          <h1 className="text-base font-bold text-[#171918]">
            My Daily Activity & Synced Outcomes
          </h1>
          <p className="text-xs text-muted">
            Chronological audit of your field visits, payments collected, and offline events
          </p>
        </div>
        <ActivityLogView isManagerView={false} />
      </main>
      <OfficerBottomNav />
    </div>
  );
}

