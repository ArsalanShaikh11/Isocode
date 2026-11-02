"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  Filter,
  RefreshCw,
  Search,
  MessageSquare,
} from "lucide-react";
import { OfficerNavbar } from "@/components/officer/OfficerNavbar";
import { OfficerBottomNav } from "@/components/officer/OfficerBottomNav";
import { PriorityBadge, PromiseStatusBadge } from "@/components/ui/Badge";
import { ContactWindowAlert } from "@/components/ui/ContactWindowAlert";
import { formatLakhs } from "@/lib/ai/prioritisation";
import { cacheAssignedLoans, getCachedLoans, CachedLoanItem } from "@/lib/offline/db";

interface OfficerLoanItem {
  id: string;
  borrowerName: string;
  contactPerson?: string;
  businessType: string;
  phone: string;
  address: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  outstandingAmount: number;
  dpd: number;
  dpdBucket: string;
  priorityScore: number;
  priorityCategory: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  priorityReasons: string[];
  isOverridden?: boolean;
  activePromise?: {
    id: string;
    promisedAmount: number;
    promiseDate: string;
    status: string;
    notes?: string;
  } | null;
  lastOutcome?: {
    outcomeType: string;
    clientRecordedAt: string;
    notes?: string;
  } | null;
}

interface SummaryData {
  totalAssigned: number;
  promisesDueToday: number;
  brokenPromisesCount: number;
  pendingVisitsCount: number;
}

export default function OfficerPriorityListPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<OfficerLoanItem[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalAssigned: 0,
    promisesDueToday: 0,
    brokenPromisesCount: 0,
    pendingVisitsCount: 0,
  });
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<{ name: string; branchName?: string } | null>(null);
  const [simulationBypass, setSimulationBypass] = useState<boolean>(false);
  const [contactBlockedNotice, setContactBlockedNotice] = useState<string | null>(null);

  const fetchLoans = async (filter: string = activeFilter) => {
    setIsLoading(true);
    try {
      // 1. Fetch user profile
      const userRes = await fetch("/api/auth/me");
      if (userRes.ok) {
        const uData = await userRes.json();
        setUser(uData.user);
      }

      // 2. Fetch assigned loans
      const res = await fetch(`/api/officer/loans?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setLoans(data.loans || []);
        if (data.summary) {
          setSummary(data.summary);
        }

        // Cache for offline usage in IndexedDB
        const cacheItems: CachedLoanItem[] = (data.loans || []).map((l: OfficerLoanItem) => ({
          id: l.id,
          borrowerName: l.borrowerName,
          businessType: l.businessType,
          phone: l.phone,
          address: l.address,
          pincode: l.pincode,
          outstandingAmount: l.outstandingAmount,
          dpd: l.dpd,
          priorityScore: l.priorityScore,
          priorityCategory: l.priorityCategory,
          priorityReasons: l.priorityReasons,
          promiseStatus: l.activePromise?.status,
          promiseDate: l.activePromise?.promiseDate,
          lastCachedAt: new Date().toISOString(),
        }));
        await cacheAssignedLoans(cacheItems);
      } else {
        // Fallback to IndexedDB offline cache
        const cached = await getCachedLoans();
        if (cached.length > 0) {
          const fallbackLoans: OfficerLoanItem[] = cached.map((c) => ({
            id: c.id,
            borrowerName: c.borrowerName,
            businessType: c.businessType,
            phone: c.phone,
            address: c.address,
            pincode: c.pincode,
            outstandingAmount: c.outstandingAmount,
            dpd: c.dpd,
            dpdBucket: c.dpd <= 30 ? "1-30" : "31-60",
            priorityScore: c.priorityScore,
            priorityCategory: c.priorityCategory,
            priorityReasons: c.priorityReasons,
            activePromise: c.promiseStatus
              ? {
                  id: "cached",
                  promisedAmount: 0,
                  promiseDate: c.promiseDate || "",
                  status: c.promiseStatus,
                }
              : null,
          }));
          setLoans(fallbackLoans);
        }
      }
    } catch {
      // Offline fallback
      const cached = await getCachedLoans();
      if (cached.length > 0) {
        setLoans(
          cached.map((c) => ({
            id: c.id,
            borrowerName: c.borrowerName,
            businessType: c.businessType,
            phone: c.phone,
            address: c.address,
            pincode: c.pincode,
            outstandingAmount: c.outstandingAmount,
            dpd: c.dpd,
            dpdBucket: c.dpd <= 30 ? "1-30" : "31-60",
            priorityScore: c.priorityScore,
            priorityCategory: c.priorityCategory,
            priorityReasons: c.priorityReasons,
          }))
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans(activeFilter);
  }, [activeFilter]);

  const handleCallAttempt = (phone: string, borrowerName: string) => {
    // Check contact window
    const now = new Date();
    // In IST
    const istHour = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
    const isWithinWindow = simulationBypass || (istHour >= 8 && istHour < 19);

    if (!isWithinWindow) {
      setContactBlockedNotice(
        `Borrower contact to ${borrowerName} is restricted outside 8:00 AM – 7:00 PM IST under RBI Fair Practices guidelines. Toggle "Demo Simulation" at the top to test calling.`
      );
      setTimeout(() => setContactBlockedNotice(null), 6000);
      return;
    }

    // Direct phone dialer on mobile
    window.location.href = `tel:${phone}`;
  };

  const handleOpenMap = (address: string, lat?: number, lng?: number) => {
    if (lat && lng) {
      window.open(`https://maps.google.com/?q=${lat},${lng}`, "_blank");
    } else {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(address + ", Indore")}`, "_blank");
    }
  };

  // Filtered loans by search
  const displayedLoans = loans.filter((l) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      l.borrowerName.toLowerCase().includes(query) ||
      l.id.toLowerCase().includes(query) ||
      l.address.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#F8F8F5] pb-24">
      <OfficerNavbar
        officerName={user?.name || "Rahul Chouhan"}
        branchName={user?.branchName}
      />

      <main className="max-w-md mx-auto px-4 pt-3 space-y-3">
        {/* Contact Window Alert & Simulation Controller */}
        <ContactWindowAlert
          simulationBypass={simulationBypass}
          onToggleSimulation={setSimulationBypass}
        />

        {contactBlockedNotice && (
          <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#7F1D1D] font-medium flex items-start gap-2 shadow-sm animate-pulse">
            <AlertTriangle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
            <div>{contactBlockedNotice}</div>
          </div>
        )}

        {/* Date & Greeting Card */}
        <div className="bg-white rounded-xl p-4 border border-[#E2E4DE] shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <h1 className="text-base font-semibold text-[#171918] tracking-tight">
                Namaste, {user?.name?.split(" ")[0] || "Rahul"}
              </h1>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#EAF3EF] text-[#176B4D] font-semibold">
                Daily Roster
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#F2F3EE]">
            <div className="text-center">
              <p className="text-[10px] text-muted">Assigned</p>
              <p className="text-base font-bold text-[#171918]">
                {summary.totalAssigned}
              </p>
            </div>
            <div className="text-center border-x border-[#F2F3EE]">
              <p className="text-[10px] text-muted">Promises Due</p>
              <p className="text-base font-bold text-[#B45309]">
                {summary.promisesDueToday}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted">Pending Visits</p>
              <p className="text-base font-bold text-[#176B4D]">
                {summary.pendingVisitsCount}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Tabs */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search borrower or loan ID..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2E4DE] text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#176B4D]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: "all", label: "All Loans" },
              { id: "high", label: "High Priority" },
              { id: "promise_due", label: "Promise Due" },
              { id: "broken_promise", label: "Broken Promise" },
              { id: "not_contacted", label: "Not Visited" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium text-xs transition-colors shrink-0 ${
                  activeFilter === tab.id
                    ? "bg-[#176B4D] text-white"
                    : "bg-white text-muted border border-[#E2E4DE] hover:bg-[#F2F3EE]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Borrower List */}
        <div className="space-y-2.5">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#176B4D]" />
              <p>Optimising field priority route...</p>
            </div>
          ) : displayedLoans.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-[#E2E4DE] space-y-2">
              <CheckCircle className="w-8 h-8 text-[#15803D] mx-auto opacity-80" />
              <p className="text-sm font-semibold text-[#171918]">
                All Caught Up
              </p>
              <p className="text-xs text-muted">
                No overdue borrowers match this filter. Great work!
              </p>
            </div>
          ) : (
            displayedLoans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white rounded-xl border border-[#E2E4DE] shadow-card hover:border-[#C5C8BD] transition-all p-3.5 space-y-2.5"
              >
                {/* Header: Score & Borrower Name */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[11px] font-semibold text-muted bg-[#F2F3EE] px-1.5 py-0.2 rounded">
                        {loan.id}
                      </span>
                      {loan.isOverridden && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#78350F] font-medium">
                          Manager Override
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/officer/loans/${loan.id}`}
                      className="font-semibold text-sm text-[#171918] hover:text-[#176B4D] truncate block mt-0.5"
                    >
                      {loan.borrowerName}
                    </Link>
                    <p className="text-[11px] text-muted truncate">
                      {loan.businessType}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <PriorityBadge
                      score={loan.priorityScore}
                      category={loan.priorityCategory}
                    />
                    <p className="text-[10px] text-muted font-mono mt-0.5">
                      Score: {loan.priorityScore}/100
                    </p>
                  </div>
                </div>

                {/* Key Financial Badges: Outstanding, DPD, Promise */}
                <div className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-[#FAFBF9] rounded-lg border border-[#EBECE7]">
                  <div>
                    <span className="text-[10px] text-muted block">
                      Outstanding
                    </span>
                    <span className="font-bold text-[#171918]">
                      {formatLakhs(loan.outstandingAmount)}
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] text-muted block">DPD</span>
                    <span
                      className={`font-bold ${
                        loan.dpd >= 30 ? "text-[#B91C1C]" : "text-[#B45309]"
                      }`}
                    >
                      {loan.dpd} Days
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-muted block">Promise</span>
                    {loan.activePromise ? (
                      <PromiseStatusBadge status={loan.activePromise.status} />
                    ) : (
                      <span className="text-[11px] text-muted font-medium">
                        None
                      </span>
                    )}
                  </div>
                </div>

                {/* Top 3 AI Scoring Reasons */}
                {loan.priorityReasons && loan.priorityReasons.length > 0 && (
                  <div className="bg-[#F8F9F7] rounded-lg p-2 border border-[#EBECE7] space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-[#176B4D] uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-[#176B4D]" />
                      <span>Why This Loan Matters Today</span>
                    </div>
                    <ul className="text-[11px] text-[#2D312E] space-y-0.5 list-disc list-inside">
                      {loan.priorityReasons.slice(0, 3).map((reason, idx) => (
                        <li key={idx} className="truncate">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons: Call, Map, Log Outcome (Large mobile tap targets) */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#F2F3EE]">
                  <button
                    onClick={() =>
                      handleCallAttempt(loan.phone, loan.borrowerName)
                    }
                    className="touch-target flex items-center justify-center gap-1.5 rounded-lg border border-[#E2E4DE] bg-white hover:bg-[#F2F3EE] text-xs font-medium text-[#171918] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#176B4D]" />
                    <span>Call</span>
                  </button>

                  <button
                    onClick={() =>
                      handleOpenMap(loan.address, loan.latitude, loan.longitude)
                    }
                    className="touch-target flex items-center justify-center gap-1.5 rounded-lg border border-[#E2E4DE] bg-white hover:bg-[#F2F3EE] text-xs font-medium text-[#171918] transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-muted" />
                    <span>Map</span>
                  </button>

                  <Link
                    href={`/officer/loans/${loan.id}`}
                    className="touch-target flex items-center justify-center gap-1.5 rounded-lg bg-[#176B4D] hover:bg-[#12533B] text-xs font-medium text-white transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <OfficerBottomNav />
    </div>
  );
}
