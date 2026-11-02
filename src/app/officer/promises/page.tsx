import React from "react";
import { OfficerNavbar } from "@/components/officer/OfficerNavbar";
import { OfficerBottomNav } from "@/components/officer/OfficerBottomNav";
import { PromiseTrackerView } from "@/components/common/PromiseTrackerView";

export default function OfficerPromisesPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F5] pb-24">
      <OfficerNavbar officerName="Rahul Chouhan" />
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        <div>
          <h1 className="text-base font-bold text-[#171918]">
            Promise to Pay Tracker
          </h1>
          <p className="text-xs text-muted">
            Track and follow up on borrower payment commitments
          </p>
        </div>
        <PromiseTrackerView isManagerView={false} />
      </main>
      <OfficerBottomNav />
    </div>
  );
}
