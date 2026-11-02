import React from "react";
import { ManagerSidebar } from "@/components/manager/ManagerSidebar";
import { PromiseTrackerView } from "@/components/common/PromiseTrackerView";

export default function ManagerPromisesPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F5] flex">
      <ManagerSidebar managerName="Anand Verma" branchName="Indore Main - Palasia" />
      <main className="flex-1 p-8 space-y-6 overflow-y-auto max-w-6xl">
        <div>
          <h1 className="text-xl font-bold text-[#171918] tracking-tight">
            Branch Promise-to-Pay Portfolio
          </h1>
          <p className="text-xs text-muted mt-1">
            Monitor fulfillment rates, broken commitments, and supervisory reminders across officers
          </p>
        </div>
        <PromiseTrackerView isManagerView={true} />
      </main>
    </div>
  );
}
