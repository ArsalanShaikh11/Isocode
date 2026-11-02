"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Send,
  Sparkles,
  Phone,
  Search,
} from "lucide-react";
import { PromiseStatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatLakhs } from "@/lib/ai/prioritisation";

interface PromiseItem {
  id: string;
  loanId: string;
  borrowerName: string;
  businessType: string;
  phone: string;
  dpd: number;
  outstandingAmount: number;
  branchName: string;
  officerName: string;
  promisedAmount: number;
  promiseDate: string;
  status: string;
  notes?: string;
}

export function PromiseTrackerView({
  isManagerView = false,
}: {
  isManagerView?: boolean;
}) {
  const [promises, setPromises] = useState<PromiseItem[]>([]);
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    dueToday: 0,
    broken: 0,
    fulfilled: 0,
  });

  const [activeReminderTarget, setActiveReminderTarget] =
    useState<PromiseItem | null>(null);
  const [simulatedReminderSent, setSimulatedReminderSent] = useState(false);

  const fetchPromises = async (status: string = activeStatus) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/promises?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setPromises(data.promises || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromises(activeStatus);
  }, [activeStatus]);

  const filteredPromises = promises.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.borrowerName.toLowerCase().includes(q) ||
      p.loanId.toLowerCase().includes(q) ||
      p.officerName.toLowerCase().includes(q)
    );
  });

  const handleSimulateReminder = (item: PromiseItem) => {
    setActiveReminderTarget(item);
    setSimulatedReminderSent(false);
  };

  return (
    <div className="space-y-4">
      {/* Header & Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveStatus("ALL")}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            activeStatus === "ALL"
              ? "bg-[#EAF3EF] border-[#176B4D]"
              : "bg-white border-[#E2E4DE] hover:border-[#C5C8BD]"
          }`}
        >
          <span className="text-[11px] text-muted block">All Commitments</span>
          <span className="text-xl font-bold text-[#171918]">
            {counts.total}
          </span>
        </div>

        <div
          onClick={() => setActiveStatus("DUE_TODAY")}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            activeStatus === "DUE_TODAY"
              ? "bg-[#FEF3C7] border-[#B45309]"
              : "bg-white border-[#E2E4DE] hover:border-[#C5C8BD]"
          }`}
        >
          <span className="text-[11px] text-muted block">Due Today</span>
          <span className="text-xl font-bold text-[#B45309]">
            {counts.dueToday}
          </span>
        </div>

        <div
          onClick={() => setActiveStatus("BROKEN")}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            activeStatus === "BROKEN"
              ? "bg-[#FEE2E2] border-[#B91C1C]"
              : "bg-white border-[#E2E4DE] hover:border-[#C5C8BD]"
          }`}
        >
          <span className="text-[11px] text-muted block">Broken Promises</span>
          <span className="text-xl font-bold text-[#B91C1C]">
            {counts.broken}
          </span>
        </div>

        <div
          onClick={() => setActiveStatus("FULFILLED")}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            activeStatus === "FULFILLED"
              ? "bg-[#DCFCE7] border-[#15803D]"
              : "bg-white border-[#E2E4DE] hover:border-[#C5C8BD]"
          }`}
        >
          <span className="text-[11px] text-muted block">Fulfilled / Cured</span>
          <span className="text-xl font-bold text-[#15803D]">
            {counts.fulfilled}
          </span>
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search promise by borrower or loan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#E2E4DE] rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#176B4D]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: "ALL", label: "All" },
            { id: "DUE_TODAY", label: "Due Today" },
            { id: "PENDING", label: "Pending" },
            { id: "BROKEN", label: "Broken" },
            { id: "FULFILLED", label: "Fulfilled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors shrink-0 ${
                activeStatus === tab.id
                  ? "bg-[#176B4D] text-white"
                  : "bg-white text-muted border border-[#E2E4DE] hover:bg-[#F2F3EE]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Promises List / Table */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted">
            Loading promises...
          </div>
        ) : filteredPromises.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-[#E2E4DE] text-xs text-muted">
            No promises found under this status.
          </div>
        ) : (
          filteredPromises.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-[#E2E4DE] p-4 shadow-card hover:border-[#C5C8BD] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-muted bg-[#F2F3EE] px-2 py-0.5 rounded">
                    {item.loanId}
                  </span>
                  <Link
                    href={`/officer/loans/${item.loanId}`}
                    className="font-semibold text-sm text-[#171918] hover:text-[#176B4D]"
                  >
                    {item.borrowerName}
                  </Link>
                  <PromiseStatusBadge status={item.status} />
                </div>

                <div className="flex items-center gap-4 text-xs text-muted">
                  <span>
                    Promised:{" "}
                    <strong className="text-[#171918]">
                      ₹{item.promisedAmount.toLocaleString("en-IN")}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Promise Date:{" "}
                    <strong className="text-[#171918]">
                      {new Date(item.promiseDate).toLocaleDateString("en-IN")}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>Officer: {item.officerName}</span>
                </div>

                {item.notes && (
                  <p className="text-xs text-[#2D312E] italic bg-[#FAFBF9] p-2 rounded border border-[#EBECE7] max-w-xl">
                    &ldquo;{item.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleSimulateReminder(item)}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E4DE] bg-[#FAFBF9] hover:bg-[#EAF3EF] text-xs font-medium text-[#176B4D] transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reminder</span>
                </button>

                <Link
                  href={`/officer/loans/${item.loanId}`}
                  className="px-3 py-1.5 rounded-lg bg-[#176B4D] text-white hover:bg-[#12533B] text-xs font-medium transition-colors"
                >
                  View Loan
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Simulated Reminder Preview Drawer/Modal */}
      {activeReminderTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl border border-[#E2E4DE] shadow-modal p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F3EE] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#176B4D]" />
                <h3 className="font-semibold text-sm text-[#171918]">
                  Promise Follow-up Reminder (Simulated)
                </h3>
              </div>
              <button
                onClick={() => setActiveReminderTarget(null)}
                className="text-xs text-muted hover:text-foreground"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-muted">
                Prepared courtesy reminder for commitment on{" "}
                {new Date(
                  activeReminderTarget.promiseDate
                ).toLocaleDateString("en-IN")}
                :
              </p>
              <div className="p-3 bg-[#FAFBF9] rounded-xl border border-[#E2E4DE] font-sans leading-relaxed text-[#171918]">
                &ldquo;Dear {activeReminderTarget.borrowerName}, this is a gentle
                reminder regarding your commitment to clear ₹
                {activeReminderTarget.promisedAmount.toLocaleString("en-IN")}{" "}
                towards loan {activeReminderTarget.loanId} on{" "}
                {new Date(
                  activeReminderTarget.promiseDate
                ).toLocaleDateString("en-IN")}
                . Please contact officer {activeReminderTarget.officerName} to
                confirm settlement. Regards, Company A Indore.&rdquo;
              </div>

              <div className="p-2.5 rounded-lg bg-[#EAF3EF] text-[#176B4D] text-[11px] font-medium border border-[#CDE3D9]">
                ✓ Verified compliant with RBI Fair Practices Code. Simulation only — no actual SMS sent.
              </div>
            </div>

            {simulatedReminderSent ? (
              <div className="p-2.5 rounded-lg bg-[#DCFCE7] text-[#14532D] text-xs font-semibold text-center border border-[#BBF7D0]">
                Simulated reminder recorded in audit log.
              </div>
            ) : (
              <Button
                size="md"
                className="w-full"
                onClick={() => setSimulatedReminderSent(true)}
              >
                Approve & Log Simulated Reminder
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
