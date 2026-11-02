import React from "react";
import { ManagerSidebar } from "@/components/manager/ManagerSidebar";
import { ActivityLogView } from "@/components/common/ActivityLogView";

export default function ManagerActivityPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F5] flex">
      <ManagerSidebar managerName="Anand Verma" branchName="Indore Main - Palasia" />
      <main className="flex-1 p-8 space-y-6 overflow-y-auto max-w-6xl">
        <div>
          <h1 className="text-xl font-bold text-[#171918] tracking-tight">
            Field Officer Activity & Audit Timeline
          </h1>
          <p className="text-xs text-muted mt-1">
            Real-time feed of all collection visits, payments received, disputes, and offline sync logs with geotags.
          </p>
        </div>
        <ActivityLogView isManagerView={true} />
      </main>
    </div>
  );
}
