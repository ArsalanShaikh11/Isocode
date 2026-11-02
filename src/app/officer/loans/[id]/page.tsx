"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Shield,
  FileText,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { OfficerNavbar } from "@/components/officer/OfficerNavbar";
import { OfficerBottomNav } from "@/components/officer/OfficerBottomNav";
import { Button } from "@/components/ui/Button";
import { PriorityBadge, PromiseStatusBadge, Badge } from "@/components/ui/Badge";
import { ContactWindowAlert } from "@/components/ui/ContactWindowAlert";
import { formatLakhs } from "@/lib/ai/prioritisation";
import { enqueueOfflineOutcome } from "@/lib/offline/db";

interface LoanDetailData {
  id: string;
  borrower: {
    name: string;
    contactPerson?: string;
    businessType: string;
    phone: string;
    address: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
  };
  branch: { name: string };
  assignedOfficer?: { name: string; phone: string; email: string };
  disbursedAmount: number;
  outstandingAmount: number;
  dpd: number;
  dpdBucket: string;
  emiAmount: number;
  totalMissedEmis: number;
  priorityScore: number;
  priorityCategory: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  priorityReasons: string[];
  priorityOverride: boolean;
  overrideScore?: number;
  overrideReason?: string;
  status: string;
  promises: Array<{
    id: string;
    promisedAmount: number;
    promiseDate: string;
    status: string;
    notes?: string;
    officer: { name: string };
    createdAt: string;
  }>;
  collectionOutcomes: Array<{
    id: string;
    outcomeType: string;
    amountCollected?: number;
    paymentMode?: string;
    receiptNumber?: string;
    disputeReason?: string;
    notes?: string;
    clientRecordedAt: string;
    officer: { name: string };
    latitude?: number;
    longitude?: number;
  }>;
}

export default function LoanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const loanId = params.id;

  const [loan, setLoan] = useState<LoanDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOutcomeTab, setSelectedOutcomeTab] = useState<
    "PAID" | "PROMISE_TO_PAY" | "NOT_REACHABLE" | "DISPUTE"
  >("PROMISE_TO_PAY");

  // Form states for outcome logging
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("UPI");
  const [receiptNumber, setReceiptNumber] = useState<string>("");

  const [promisedAmount, setPromisedAmount] = useState<string>("");
  const [promiseDate, setPromiseDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );

  const [followUpDate, setFollowUpDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]
  );
  const [disputeReason, setDisputeReason] = useState<string>(
    "Vendor billing discrepancy"
  );
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Reminder Modal
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderLanguage, setReminderLanguage] = useState<"EN" | "HI">("EN");
  const [reminderPreview, setReminderPreview] = useState<string>("");
  const [reminderTemplateId, setReminderTemplateId] = useState<string>(
    "en-courteous-due"
  );
  const [isGeneratingReminder, setIsGeneratingReminder] = useState(false);
  const [reminderDispatched, setReminderDispatched] = useState(false);
  const [simulationBypass, setSimulationBypass] = useState(false);

  const fetchLoanDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/officer/loans/${loanId}`);
      if (res.ok) {
        const data = await res.json();
        setLoan(data.loan);
        if (data.loan.emiAmount) {
          setPaidAmount(data.loan.emiAmount.toString());
          setPromisedAmount(data.loan.emiAmount.toString());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanDetails();
  }, [loanId]);

  const handleOutcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    setIsSubmitting(true);
    setSubmitSuccess(null);

    // Get synthetic or real GPS
    let lat: number | undefined = loan.borrower.latitude || 22.7196;
    let lng: number | undefined = loan.borrower.longitude || 75.8577;

    if (typeof window !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 2000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // Fallback to synthetic coordinates
      }
    }

    const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const payload = {
      idempotencyKey,
      loanId: loan.id,
      outcomeType: selectedOutcomeTab,
      amountCollected:
        selectedOutcomeTab === "PAID" ? Number(paidAmount) || null : null,
      paymentMode: selectedOutcomeTab === "PAID" ? paymentMode : null,
      receiptNumber: selectedOutcomeTab === "PAID" ? receiptNumber || null : null,
      promisedAmount:
        selectedOutcomeTab === "PROMISE_TO_PAY"
          ? Number(promisedAmount) || null
          : null,
      promiseDate:
        selectedOutcomeTab === "PROMISE_TO_PAY" ? promiseDate : null,
      followUpDate:
        selectedOutcomeTab === "NOT_REACHABLE" ? followUpDate : null,
      disputeReason:
        selectedOutcomeTab === "DISPUTE" ? disputeReason : null,
      notes: notes || undefined,
      latitude: lat,
      longitude: lng,
      clientRecordedAt: new Date().toISOString(),
    };

    try {
      if (navigator.onLine) {
        const res = await fetch("/api/officer/outcomes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setSubmitSuccess("Outcome recorded & audit log updated.");
          await fetchLoanDetails();
        } else {
          // If server error, enqueue offline
          await enqueueOfflineOutcome(payload);
          setSubmitSuccess("Saved to offline sync queue.");
        }
      } else {
        // Enqueue offline in IndexedDB
        await enqueueOfflineOutcome(payload);
        setSubmitSuccess("Saved offline. Will auto-sync when online.");
      }
    } catch {
      await enqueueOfflineOutcome(payload);
      setSubmitSuccess("Network error: Saved offline in device queue.");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitSuccess(null), 5000);
    }
  };

  const loadReminderPreview = async (lang: "EN" | "HI") => {
    if (!loan) return;
    setIsGeneratingReminder(true);
    setReminderDispatched(false);

    const templateId =
      lang === "EN" ? "en-courteous-due" : "hi-courteous-due";
    setReminderTemplateId(templateId);

    try {
      const res = await fetch("/api/officer/reminders/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId: loan.id,
          templateId,
          action: "DRAFT",
          simulationBypass,
        }),
      });

      const data = await res.json();
      if (res.ok && data.preview) {
        setReminderPreview(data.preview.messageContent);
      } else {
        setReminderPreview(data.message || "Failed to generate reminder.");
      }
    } catch {
      setReminderPreview("Error drafting message.");
    } finally {
      setIsGeneratingReminder(false);
    }
  };

  const handleApproveReminderDispatch = async () => {
    if (!loan) return;
    setIsGeneratingReminder(true);
    try {
      const res = await fetch("/api/officer/reminders/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId: loan.id,
          templateId: reminderTemplateId,
          action: "APPROVE_AND_DISPATCH",
          simulationBypass,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReminderDispatched(true);
      } else {
        alert(data.message || data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingReminder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F5] flex items-center justify-center text-xs text-muted">
        Loading loan records...
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen bg-[#F8F8F5] p-6 text-center">
        <p className="text-sm font-semibold text-[#171918]">Loan not found</p>
        <Link href="/officer" className="text-xs text-[#176B4D] underline mt-2 block">
          Back to Priority List
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F5] pb-24">
      <OfficerNavbar officerName="Rahul Chouhan" />

      <main className="max-w-md mx-auto px-4 pt-3 space-y-3">
        {/* Contact Window Alert & Simulation Controller */}
        <ContactWindowAlert
          simulationBypass={simulationBypass}
          onToggleSimulation={setSimulationBypass}
        />

        {/* Back link */}
        <div className="flex items-center justify-between">
          <Link
            href="/officer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-[#171918]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Priority List</span>
          </Link>

          <button
            onClick={() => {
              setShowReminderModal(true);
              loadReminderPreview("EN");
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EAF3EF] text-[#176B4D] border border-[#CDE3D9] text-xs font-semibold hover:bg-[#D5EADF]"
          >
            <Send className="w-3 h-3" />
            <span>AI Reminder</span>
          </button>
        </div>

        {/* Borrower Overview Card */}
        <div className="bg-white rounded-xl border border-[#E2E4DE] shadow-card p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-muted bg-[#F2F3EE] px-2 py-0.5 rounded">
                {loan.id}
              </span>
              <h1 className="text-base font-bold text-[#171918] mt-1">
                {loan.borrower.name}
              </h1>
              <p className="text-xs text-muted">{loan.borrower.businessType}</p>
            </div>
            <div className="text-right">
              <PriorityBadge
                score={loan.overrideScore ?? loan.priorityScore}
                category={loan.priorityCategory}
              />
              <p className="text-[10px] text-muted font-mono mt-0.5">
                Score: {loan.overrideScore ?? loan.priorityScore}/100
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#F2F3EE]">
            <div>
              <span className="text-[10px] text-muted block">Outstanding</span>
              <span className="font-bold text-[#171918]">
                {formatLakhs(loan.outstandingAmount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted block">Days Past Due</span>
              <span
                className={`font-bold ${
                  loan.dpd >= 30 ? "text-[#B91C1C]" : "text-[#B45309]"
                }`}
              >
                {loan.dpd} DPD ({loan.dpdBucket})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted block">Monthly EMI</span>
              <span className="font-medium text-[#171918]">
                ₹{loan.emiAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted block">Missed EMIs</span>
              <span className="font-medium text-[#171918]">
                {loan.totalMissedEmis} missed
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F2F3EE] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted truncate max-w-[240px]">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-muted" />
              <span className="truncate">{loan.borrower.address}</span>
            </div>
            <a
              href={`tel:${loan.borrower.phone}`}
              className="px-2.5 py-1 rounded bg-[#F2F3EE] text-[#171918] font-medium hover:bg-[#E8E9E3]"
            >
              Call
            </a>
          </div>
        </div>

        {/* Explainable AI Scoring Reasons */}
        <div className="bg-[#FAFBF9] rounded-xl border border-[#E2E4DE] p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#176B4D]">
            <Sparkles className="w-4 h-4 text-[#176B4D]" />
            <span>AI Prioritisation Analysis</span>
          </div>
          <ul className="text-xs text-[#2D312E] space-y-1 list-disc list-inside">
            {loan.priorityReasons?.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          {loan.priorityOverride && (
            <div className="p-2 bg-[#FEF3C7] rounded border border-[#FDE68A] text-[11px] text-[#78350F]">
              <span className="font-semibold">Supervisory Override: </span>
              {loan.overrideReason}
            </div>
          )}
        </div>

        {/* Outcome Logging Workflow (3-Tap Experience) */}
        <div className="bg-white rounded-xl border border-[#E2E4DE] shadow-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#171918]">
              Log Collection Outcome
            </h2>
            <span className="text-[10px] text-muted font-medium">3-Tap Workflow</span>
          </div>

          {submitSuccess && (
            <div className="p-2.5 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-xs text-[#14532D] font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* Outcome Type Selector Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#F2F3EE] rounded-lg text-[11px] font-semibold">
            {[
              { id: "PROMISE_TO_PAY", label: "Promise" },
              { id: "PAID", label: "Paid" },
              { id: "NOT_REACHABLE", label: "No Reach" },
              { id: "DISPUTE", label: "Dispute" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setSelectedOutcomeTab(
                    tab.id as "PAID" | "PROMISE_TO_PAY" | "NOT_REACHABLE" | "DISPUTE"
                  )
                }
                className={`py-2 rounded-md transition-colors text-center ${
                  selectedOutcomeTab === tab.id
                    ? "bg-white text-[#176B4D] shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleOutcomeSubmit} className="space-y-3">
            {/* PAID FIELDS */}
            {selectedOutcomeTab === "PAID" && (
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-medium text-muted block mb-1">
                    Amount Collected (₹)
                  </label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#E2E4DE] rounded-lg text-sm font-semibold text-[#171918]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-muted block mb-1">
                      Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E2E4DE] rounded-lg text-xs"
                    >
                      <option value="UPI">UPI / QR</option>
                      <option value="CASH">Cash at Counter</option>
                      <option value="NEFT_RTGS">NEFT / RTGS</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted block mb-1">
                      Receipt / Txn Ref
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR-98214"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E2E4DE] rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PROMISE TO PAY FIELDS */}
            {selectedOutcomeTab === "PROMISE_TO_PAY" && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-muted block mb-1">
                      Promised Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={promisedAmount}
                      onChange={(e) => setPromisedAmount(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-[#E2E4DE] rounded-lg text-sm font-semibold text-[#171918]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted block mb-1">
                      Promise Date
                    </label>
                    <input
                      type="date"
                      value={promiseDate}
                      onChange={(e) => setPromiseDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-[#E2E4DE] rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NOT REACHABLE FIELDS */}
            {selectedOutcomeTab === "NOT_REACHABLE" && (
              <div>
                <label className="text-[11px] font-medium text-muted block mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#E2E4DE] rounded-lg text-xs"
                />
              </div>
            )}

            {/* DISPUTE FIELDS */}
            {selectedOutcomeTab === "DISPUTE" && (
              <div>
                <label className="text-[11px] font-medium text-muted block mb-1">
                  Dispute Reason
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E4DE] rounded-lg text-xs"
                >
                  <option value="Vendor billing discrepancy">Vendor billing discrepancy</option>
                  <option value="Goods rejected by OEM buyer">Goods rejected by OEM buyer</option>
                  <option value="Delayed subsidy / GST refund">Delayed subsidy / GST refund</option>
                  <option value="Interest calculation contested">Interest calculation contested</option>
                  <option value="Medical / factory operational halt">Medical / factory operational halt</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-muted block mb-1">
                Field Visit Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Met Mr. Porwal at unit. Confirmed RTGS post invoice..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E4DE] rounded-lg text-xs resize-none"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              className="w-full font-medium touch-target"
            >
              Confirm & Save Outcome
            </Button>
          </form>
        </div>

        {/* Collection & Promise History */}
        <div className="bg-white rounded-xl border border-[#E2E4DE] p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#171918]">
            Interaction & Promise History
          </h3>

          <div className="space-y-2">
            {loan.promises.length === 0 && loan.collectionOutcomes.length === 0 ? (
              <p className="text-xs text-muted">No prior interactions logged.</p>
            ) : (
              <>
                {loan.promises.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg border border-[#EBECE7] bg-[#FAFBF9] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#171918]">
                        Promise: ₹{p.promisedAmount.toLocaleString("en-IN")}
                      </span>
                      <PromiseStatusBadge status={p.status} />
                    </div>
                    <p className="text-[11px] text-muted">
                      Due: {new Date(p.promiseDate).toLocaleDateString("en-IN")} • Logged by {p.officer.name}
                    </p>
                    {p.notes && <p className="text-[11px] text-[#2D312E] italic">{p.notes}</p>}
                  </div>
                ))}

                {loan.collectionOutcomes.map((o) => (
                  <div
                    key={o.id}
                    className="p-2.5 rounded-lg border border-[#EBECE7] bg-white text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#171918]">
                        Visit Outcome: {o.outcomeType}
                      </span>
                      <span className="text-[10px] text-muted font-mono">
                        {new Date(o.clientRecordedAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    {o.amountCollected && (
                      <p className="text-[11px] text-[#15803D] font-semibold">
                        Collected ₹{o.amountCollected.toLocaleString("en-IN")} via {o.paymentMode}
                      </p>
                    )}
                    {o.notes && <p className="text-[11px] text-muted">{o.notes}</p>}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </main>

      {/* AI Reminder Drafting Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#E2E4DE] shadow-modal p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F2F3EE] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#176B4D]" />
                <h3 className="font-semibold text-sm text-[#171918]">
                  AI Reminder Drafter
                </h3>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-muted hover:text-foreground text-xs"
              >
                Close
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-medium">Language:</span>
              <div className="flex rounded-lg border border-[#E2E4DE] p-0.5 bg-[#F2F3EE] text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setReminderLanguage("EN");
                    loadReminderPreview("EN");
                  }}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    reminderLanguage === "EN"
                      ? "bg-white text-[#176B4D] shadow-xs"
                      : "text-muted"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReminderLanguage("HI");
                    loadReminderPreview("HI");
                  }}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    reminderLanguage === "HI"
                      ? "bg-white text-[#176B4D] shadow-xs"
                      : "text-muted"
                  }`}
                >
                  हिंदी (Hindi)
                </button>
              </div>
            </div>

            {/* Preview Box */}
            <div className="bg-[#FAFBF9] rounded-xl border border-[#E2E4DE] p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>To: {loan.borrower.name} ({loan.borrower.phone})</span>
                <span className="px-1.5 py-0.2 bg-[#DCFCE7] text-[#14532D] rounded text-[10px] font-semibold">
                  Policy Approved
                </span>
              </div>
              <p className="text-xs text-[#171918] whitespace-pre-wrap leading-relaxed font-sans bg-white p-2.5 rounded-lg border border-[#EBECE7]">
                {reminderPreview || "Generating message preview..."}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted">
                <Shield className="w-3 h-3 text-[#176B4D]" />
                <span>Strictly checked against RBI Fair Practices Code (No threats/coercion)</span>
              </div>
            </div>

            {reminderDispatched ? (
              <div className="p-3 bg-[#DCFCE7] text-[#14532D] rounded-xl text-xs font-semibold text-center border border-[#BBF7D0]">
                Simulated reminder approved and logged to audit trail!
              </div>
            ) : (
              <Button
                onClick={handleApproveReminderDispatch}
                isLoading={isGeneratingReminder}
                size="lg"
                className="w-full"
              >
                Approve & Dispatch Simulated Notice
              </Button>
            )}
          </div>
        </div>
      )}

      <OfficerBottomNav />
    </div>
  );
}
