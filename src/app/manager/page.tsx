"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  AlertOctagon,
  Users,
  CheckCircle2,
  CalendarCheck,
  Building2,
  RefreshCw,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { ManagerSidebar } from "@/components/manager/ManagerSidebar";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { formatLakhs } from "@/lib/ai/prioritisation";

interface DashboardData {
  analytics: {
    totalLoans: number;
    totalOutstanding: number;
    bucket1to30Count: number;
    bucket1to30Volume: number;
    bucket31to60Count: number;
    bucket31to60Volume: number;
    bucket61to90Count: number;
    bucket61to90Volume: number;
    bucket90PlusCount: number;
    bucket90PlusVolume: number;
    rollRate1to30To31to60Percent: number;
    totalBrokenPromises: number;
    totalPendingPromises: number;
    totalFulfilledPromises: number;
    promiseBrokenRatePercent: number;
  };
  outcomeBreakdown: {
    PAID: number;
    PROMISE_TO_PAY: number;
    NOT_REACHABLE: number;
    DISPUTE: number;
    totalAmountCollected: number;
  };
  branchComparison: Array<{
    id: string;
    code: string;
    name: string;
    totalLoans: number;
    totalOutstanding: number;
    rollRatePercent: number;
  }>;
  officerPerformance: Array<{
    id: string;
    name: string;
    assignedLoansCount: number;
    visitsLogged: number;
    promisesTracked: number;
    collectedAmount: number;
  }>;
  historicalSnapshots: Array<{
    periodLabel: string;
    rollRatePercent: number;
    cureRatePercent: number;
    total1to30Count: number;
  }>;
  branches: Array<{ id: string; name: string; code: string }>;
}

const COLORS = ["#176B4D", "#B45309", "#B91C1C", "#5B615E"];

export default function BranchManagerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async (branchId: string = selectedBranch) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/manager/dashboard?branchId=${branchId}`);
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

  useEffect(() => {
    fetchDashboard(selectedBranch);
  }, [selectedBranch]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#F8F8F5] flex">
        <ManagerSidebar managerName="Anand Verma" branchName="Indore Main" />
        <div className="flex-1 flex items-center justify-center text-xs text-muted">
          <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#176B4D]" />
          Computing live portfolio metrics from database...
        </div>
      </div>
    );
  }

  const {
    analytics,
    outcomeBreakdown,
    branchComparison,
    officerPerformance,
    historicalSnapshots,
    branches,
  } = data;

  const dpdDistributionData = [
    { bucket: "1-30 DPD (SMA-0)", count: analytics.bucket1to30Count, volume: analytics.bucket1to30Volume },
    { bucket: "31-60 DPD (SMA-1)", count: analytics.bucket31to60Count, volume: analytics.bucket31to60Volume },
    { bucket: "61-90 DPD (SMA-2)", count: analytics.bucket61to90Count, volume: analytics.bucket61to90Volume },
    { bucket: "90+ DPD (NPA Risk)", count: analytics.bucket90PlusCount, volume: analytics.bucket90PlusVolume },
  ];

  const outcomesPieData = [
    { name: "Paid / Cured", value: outcomeBreakdown.PAID },
    { name: "Promise to Pay", value: outcomeBreakdown.PROMISE_TO_PAY },
    { name: "Dispute Logged", value: outcomeBreakdown.DISPUTE },
    { name: "Not Reachable", value: outcomeBreakdown.NOT_REACHABLE },
  ];

  return (
    <div className="min-h-screen bg-[#F8F8F5] flex">
      <ManagerSidebar managerName="Anand Verma" branchName="Indore Main - Palasia" />

      <main className="flex-1 p-8 space-y-6 overflow-y-auto max-w-7xl">
        {/* Top Header & Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#171918] tracking-tight">
              Company A — Portfolio Operations Terminal
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Live delinquency management, roll rates & field collection oversight (Indore Region)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E2E4DE] text-xs">
              <Filter className="w-3.5 h-3.5 text-muted" />
              <span className="text-muted font-medium">Branch:</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent font-semibold text-[#171918] focus:outline-none"
              >
                <option value="ALL">All Regional Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <Link
              href="/manager/import"
              className="px-3.5 py-2 bg-[#176B4D] hover:bg-[#12533B] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>+ Import Overdue CSV</span>
            </Link>
          </div>
        </div>

        {/* 4 Core KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Total Overdue Portfolio</span>
              <Building2 className="w-4 h-4 text-[#176B4D]" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#171918] tracking-tight">
                {formatLakhs(analytics.totalOutstanding)}
              </p>
              <p className="text-[11px] text-muted mt-0.5 font-medium">
                {analytics.totalLoans} active delinquent accounts
              </p>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>1–30 to 31–60 Roll Rate</span>
              <TrendingUp className="w-4 h-4 text-[#B45309]" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#B45309] tracking-tight">
                {analytics.rollRate1to30To31to60Percent}%
              </p>
              <p className="text-[11px] text-muted mt-0.5 font-medium">
                {analytics.bucket31to60Count} loans migrated into SMA-1
              </p>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Broken Promise Volume</span>
              <AlertOctagon className="w-4 h-4 text-[#B91C1C]" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#B91C1C] tracking-tight">
                {analytics.totalBrokenPromises}
              </p>
              <p className="text-[11px] text-muted mt-0.5 font-medium">
                {analytics.promiseBrokenRatePercent}% default on commitments
              </p>
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Total Cured Collections</span>
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#15803D] tracking-tight">
                {formatLakhs(outcomeBreakdown.totalAmountCollected)}
              </p>
              <p className="text-[11px] text-muted mt-0.5 font-medium">
                {outcomeBreakdown.PAID} payments verified this period
              </p>
            </div>
          </Card>
        </div>

        {/* Charts Row: Roll-Rate Trend & DPD Bucket Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Roll Rate History Line Chart */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#171918]">
                  Monthly Roll Rate Velocity (1–30 to 31–60 DPD)
                </h3>
                <p className="text-[11px] text-muted">
                  Regulatory SMA-1 transition percentage over rolling periods
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#78350F]">
                Target &lt; 15%
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalSnapshots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EBECE7" />
                  <XAxis dataKey="periodLabel" stroke="#9DA09B" fontSize={11} />
                  <YAxis stroke="#9DA09B" fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E4DE",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rollRatePercent"
                    name="Roll Rate %"
                    stroke="#B45309"
                    strokeWidth={2.5}
                    dot={{ fill: "#B45309", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cureRatePercent"
                    name="Cure Rate %"
                    stroke="#176B4D"
                    strokeWidth={2.5}
                    dot={{ fill: "#176B4D", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* DPD Bucket Distribution Bar Chart */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#171918]">
                  Delinquency Bucket Distribution (DPD)
                </h3>
                <p className="text-[11px] text-muted">
                  Loan volume and count across regulatory buckets
                </p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dpdDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EBECE7" />
                  <XAxis dataKey="bucket" stroke="#9DA09B" fontSize={11} />
                  <YAxis stroke="#9DA09B" fontSize={11} />
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      name === "volume" ? formatLakhs(val) : val,
                      name === "volume" ? "Outstanding Volume" : "Loan Count",
                    ]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E4DE",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" name="Accounts" fill="#176B4D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Lower Row: Outcome Breakdown & Branch Performance Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Outcome Breakdown Pie */}
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#171918]">
              Collection Outcome Composition
            </h3>
            <p className="text-[11px] text-muted">
              Resolution breakdown from field officer visits
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomesPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {outcomesPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E4DE",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#F2F3EE] text-xs">
              {outcomesPieData.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between text-muted">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-semibold text-[#171918]">{entry.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Regional Branch Comparison Table */}
          <Card className="p-5 space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#171918]">
                  Regional Branch Comparison (Indore Cluster)
                </h3>
                <p className="text-[11px] text-muted">
                  Delinquency exposure and roll rates by branch unit
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E4DE] text-muted">
                    <th className="py-2 font-medium">Branch Unit</th>
                    <th className="py-2 font-medium">Active Overdues</th>
                    <th className="py-2 font-medium">Outstanding</th>
                    <th className="py-2 font-medium">1–30 Roll Rate</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F3EE]">
                  {branchComparison.map((br) => (
                    <tr key={br.id} className="hover:bg-[#FAFBF9]">
                      <td className="py-3 font-semibold text-[#171918]">
                        {br.name}
                        <span className="text-[10px] text-muted font-mono block">
                          {br.code}
                        </span>
                      </td>
                      <td className="py-3">{br.totalLoans}</td>
                      <td className="py-3 font-medium">{formatLakhs(br.totalOutstanding)}</td>
                      <td className="py-3">
                        <span
                          className={`font-semibold ${
                            br.rollRatePercent >= 18
                              ? "text-[#B91C1C]"
                              : br.rollRatePercent >= 12
                              ? "text-[#B45309]"
                              : "text-[#15803D]"
                          }`}
                        >
                          {br.rollRatePercent}%
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            br.rollRatePercent < 15
                              ? "bg-[#DCFCE7] text-[#14532D]"
                              : "bg-[#FEF3C7] text-[#78350F]"
                          }`}
                        >
                          {br.rollRatePercent < 15 ? "Healthy" : "Elevated Risk"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Officer Workload & Productivity Matrix */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#171918]">
                Field Officer Workload & Recovery Productivity
              </h3>
              <p className="text-[11px] text-muted">
                Track assigned case volume, visits logged, and cash recoveries
              </p>
            </div>
            <Link
              href="/manager/activity"
              className="text-xs text-[#176B4D] font-semibold hover:underline flex items-center gap-1"
            >
              <span>View Full Activity Feed</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {officerPerformance.map((off) => (
              <div
                key={off.id}
                className="p-3.5 rounded-xl border border-[#E2E4DE] bg-[#FAFBF9] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#171918]">
                    {off.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-[#E2E4DE] rounded text-muted">
                    {off.assignedLoansCount} loans
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#EBECE7]">
                  <div>
                    <span className="text-[10px] text-muted block">Visits Logged</span>
                    <span className="font-semibold text-[#171918]">{off.visitsLogged}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Recoveries</span>
                    <span className="font-bold text-[#15803D]">
                      {formatLakhs(off.collectedAmount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
