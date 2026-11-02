"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Filter,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  PhoneCall,
  Search,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatLakhs } from "@/lib/ai/prioritisation";

interface ActivityItem {
  id: string;
  officerId: string;
  officerName: string;
  borrowerName: string;
  loanId: string;
  branchName: string;
  outcomeType: string;
  amountCollected?: number;
  paymentMode?: string;
  receiptNumber?: string;
  disputeReason?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  isOfflineSync: boolean;
  recordedAt: string;
  serverReceivedAt: string;
}

export function ActivityLogView({
  isManagerView = true,
}: {
  isManagerView?: boolean;
}) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [officers, setOfficers] = useState<Array<{ id: string; name: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<string>("ALL");
  const [selectedOutcome, setSelectedOutcome] = useState<string>("ALL");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (selectedOfficer !== "ALL") query.set("officerId", selectedOfficer);
      if (selectedOutcome !== "ALL") query.set("outcome", selectedOutcome);
      if (selectedBranch !== "ALL") query.set("branchId", selectedBranch);

      const res = await fetch(`/api/manager/activity?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
        if (data.filterOptions) {
          setOfficers(data.filterOptions.officers || []);
          setBranches(data.filterOptions.branches || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [selectedOfficer, selectedOutcome, selectedBranch]);

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-[#E2E4DE] text-xs">
        <div className="flex items-center gap-1.5 text-muted">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-semibold">Filters:</span>
        </div>

        {isManagerView && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted">Officer:</span>
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="border border-[#E2E4DE] rounded-md px-2 py-1 bg-white font-medium text-[#171918]"
            >
              <option value="ALL">All Officers</option>
              {officers.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-muted">Outcome:</span>
          <select
            value={selectedOutcome}
            onChange={(e) => setSelectedOutcome(e.target.value)}
            className="border border-[#E2E4DE] rounded-md px-2 py-1 bg-white font-medium text-[#171918]"
          >
            <option value="ALL">All Outcomes</option>
            <option value="PAID">Paid / Recovery</option>
            <option value="PROMISE_TO_PAY">Promise to Pay</option>
            <option value="NOT_REACHABLE">Not Reachable</option>
            <option value="DISPUTE">Dispute Logged</option>
          </select>
        </div>

        {isManagerView && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted">Branch:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="border border-[#E2E4DE] rounded-md px-2 py-1 bg-white font-medium text-[#171918]"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted">
            Loading activity log...
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-[#E2E4DE] text-xs text-muted">
            No collection events found for the selected filter combination.
          </div>
        ) : (
          activities.map((act) => {
            let badgeVariant: "success" | "warning" | "critical" | "neutral" =
              "neutral";
            if (act.outcomeType === "PAID") badgeVariant = "success";
            else if (act.outcomeType === "PROMISE_TO_PAY") badgeVariant = "warning";
            else if (act.outcomeType === "DISPUTE") badgeVariant = "critical";

            return (
              <div
                key={act.id}
                className="bg-white rounded-xl border border-[#E2E4DE] p-4 shadow-card hover:border-[#C5C8BD] transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-[#171918]">
                      {act.officerName}
                    </span>
                    <span className="text-muted text-[11px]">•</span>
                    <span className="font-mono text-[11px] text-muted bg-[#F2F3EE] px-1.5 py-0.2 rounded">
                      {act.loanId}
                    </span>
                    <span className="text-muted text-[11px]">•</span>
                    <Link
                      href={`/officer/loans/${act.loanId}`}
                      className="font-semibold text-xs text-[#171918] hover:text-[#176B4D]"
                    >
                      {act.borrowerName}
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {act.isOfflineSync && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EAF3EF] text-[#176B4D] font-medium">
                        Synced Offline
                      </span>
                    )}
                    <Badge variant={badgeVariant} size="sm">
                      {act.outcomeType}
                    </Badge>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-[#F2F3EE]">
                  <div>
                    {act.amountCollected ? (
                      <p className="font-semibold text-[#15803D]">
                        Collected {formatLakhs(act.amountCollected)} via{" "}
                        {act.paymentMode || "Cash"}
                        {act.receiptNumber && ` (Ref: ${act.receiptNumber})`}
                      </p>
                    ) : act.disputeReason ? (
                      <p className="text-[#B91C1C] font-medium">
                        Reason: {act.disputeReason}
                      </p>
                    ) : (
                      <p className="text-muted">
                        Recorded visit outcome ({act.outcomeType})
                      </p>
                    )}
                    {act.notes && (
                      <p className="text-[11px] text-[#2D312E] italic mt-0.5">
                        &ldquo;{act.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="sm:text-right space-y-0.5 text-[11px] text-muted">
                    <div className="flex items-center sm:justify-end gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted" />
                      <span>
                        {new Date(act.recordedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    {act.latitude && act.longitude ? (
                      <div className="flex items-center sm:justify-end gap-1 text-[#176B4D]">
                        <MapPin className="w-3.5 h-3.5" />
                        <a
                          href={`https://maps.google.com/?q=${act.latitude},${act.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline flex items-center gap-1 font-mono text-[10px]"
                        >
                          <span>
                            {act.latitude.toFixed(4)}, {act.longitude.toFixed(4)}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-[10px]">Location: Indore Region</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

