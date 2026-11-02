"use client";

import React, { useEffect, useState } from "react";
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BarChart3,
  ShieldAlert,
  Info,
} from "lucide-react";
import { ManagerSidebar } from "@/components/manager/ManagerSidebar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface CohortResult {
  band: string;
  sampleSize: number;
  curedCount: number;
  brokenCount: number;
  uncontactedCount: number;
  cureRatePercent: number;
  brokenRatePercent: number;
  evidenceSufficiency: "SUFFICIENT" | "LIMITED_EVIDENCE";
}

interface BacktestData {
  cohorts: CohortResult[];
  modelHealth: {
    totalEvaluatedLoans: number;
    overallCureRate: number;
    hasLimitedDataWarning: boolean;
    interpretation: string;
  };
}

export default function BacktestReportPage() {
  const [data, setData] = useState<BacktestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch("/api/manager/backtest");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F8F5] flex">
      <ManagerSidebar managerName="Anand Verma" branchName="Indore Main - Palasia" />

      <main className="flex-1 p-8 space-y-6 overflow-y-auto max-w-5xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#171918] tracking-tight">
              AI Prioritisation Model Backtesting & Validation
            </h1>
            <span className="px-2 py-0.5 rounded bg-[#EAF3EF] text-[#176B4D] font-mono text-[10px] font-semibold">
              Advisory Audit
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Empirical validation comparing assigned AI priority bands against historical cure, broken promise, and roll outcomes.
          </p>
        </div>

        {/* Advisory Compliance Note */}
        <div className="p-4 rounded-xl bg-white border border-[#E2E4DE] shadow-card flex items-start gap-3">
          <Info className="w-5 h-5 text-[#176B4D] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-semibold text-[#171918]">
              Regulatory & Model Risk Management Statement
            </span>
            <p className="text-muted leading-relaxed">
              The AI priority score functions strictly as an operational scheduling recommendation for field officers. In compliance with RBI guidelines, this algorithmic metric is not permitted to automate adverse legal action, denial of lending facilities, or unilateral loan acceleration without independent officer verification.
            </p>
          </div>
        </div>

        {/* Limited Evidence Warning if applicable */}
        {data?.modelHealth.hasLimitedDataWarning && (
          <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-xs text-[#78350F] flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
            <div>
              <span className="font-bold">Limited Historical Evidence Notice: </span>
              The pilot dataset currently contains {data.modelHealth.totalEvaluatedLoans} accounts. The model exhibits limited historical sample evidence and will calibrate confidence intervals as quarterly interaction volumes accumulate.
            </div>
          </div>
        )}

        {/* Cohort Performance Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.cohorts.map((cohort, idx) => (
              <Card key={idx} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#171918]">
                    {cohort.band}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F2F3EE] text-muted">
                    N = {cohort.sampleSize}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#F2F3EE] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Cure / Paid Rate:</span>
                    <span className="font-bold text-[#15803D]">
                      {cohort.cureRatePercent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Broken Promise Rate:</span>
                    <span className="font-bold text-[#B91C1C]">
                      {cohort.brokenRatePercent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Uncontacted Accounts:</span>
                    <span className="font-medium text-[#171918]">
                      {cohort.uncontactedCount}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F2F3EE]">
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold ${
                      cohort.evidenceSufficiency === "SUFFICIENT"
                        ? "bg-[#DCFCE7] text-[#14532D]"
                        : "bg-[#FEF3C7] text-[#78350F]"
                    }`}
                  >
                    {cohort.evidenceSufficiency === "SUFFICIENT"
                      ? "Statistically Sufficient"
                      : "Limited Evidence Sample"}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Model Interpretation */}
        {data && (
          <Card className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#176B4D]">
              <Sparkles className="w-4 h-4" />
              <span>Model Efficacy Interpretation</span>
            </div>
            <p className="text-xs text-[#2D312E] leading-relaxed">
              {data.modelHealth.interpretation}
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}

