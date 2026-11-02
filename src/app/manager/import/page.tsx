"use client";

import React, { useState } from "react";
import Papa from "papaparse";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Users,
  ShieldCheck,
  FileCheck,
  Download,
} from "lucide-react";
import { ManagerSidebar } from "@/components/manager/ManagerSidebar";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, PriorityBadge } from "@/components/ui/Badge";
import { formatLakhs } from "@/lib/ai/prioritisation";

interface PreviewRow {
  loanId: string;
  borrowerName: string;
  businessType?: string;
  phone?: string;
  outstandingAmount: number;
  dpd: number;
  pincode: string;
  branch: string;
  assignedOfficerName: string;
  predictedPriorityScore: number;
  predictedCategory: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  priorityReasons: string[];
}

interface ImportSummary {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  hasRequiredColumns: boolean;
  missingColumns: string[];
}

export default function CsvImportPage() {
  const [importState, setImportState] = useState<
    "READY" | "PROCESSING" | "PREVIEW" | "COMMITTING" | "IMPORTED" | "PARTIAL" | "FAILED"
  >("READY");
  const [fileName, setFileName] = useState<string>("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<
    Array<{ rowNumber: number; data: Record<string, unknown>; errors: string[] }>
  >([]);
  const [rawParsedRows, setRawParsedRows] = useState<Record<string, unknown>[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [committedCount, setCommittedCount] = useState<number>(0);

  // Realistic sample CSV template for Indore SME loans
  const sampleCsvContent = `Loan ID,Borrower Name,Business Type,Outstanding Amount,DPD,Pincode,Branch,Contact Phone
LN-12101,Kothari Pipe Fittings,Pipes & Sanitaryware,380000,24,452001,Indore Palasia,9826011111
LN-12102,Malwa Soya Processing,Edible Oil Milling,720000,16,454774,Pithampur Industrial,9826022222
LN-12103,Bhanwar Kuan Auto Electrics,Starter Motors,195000,28,452010,Indore Vijay Nagar,9826033333
LN-12104,Rajwada Readymade Garments,Cotton Textiles,440000,9,452002,Indore Palasia,9826044444
LN-12105,Dewas Naka Tyre House,Commercial Retreading,290000,34,452010,Indore Vijay Nagar,9826055555
LN-10293,Duplicate Packaging Unit,Box Making,640000,12,452001,Indore Palasia,9826045612`;

  const processCsvFile = (file: File) => {
    setFileName(file.name);
    setImportState("PROCESSING");
    setErrorMessage("");

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = (results.data || []) as Record<string, unknown>[];
        setRawParsedRows(rows);
        await analyzeRows(rows);
      },
      error: (err) => {
        setImportState("FAILED");
        setErrorMessage(`CSV parsing error: ${err.message}`);
      },
    });
  };

  const handleLoadSample = () => {
    setFileName("indore_nbfc_overdue_portfolio_sample.csv");
    setImportState("PROCESSING");
    Papa.parse<Record<string, unknown>>(sampleCsvContent, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = (results.data || []) as Record<string, unknown>[];
        setRawParsedRows(rows);
        await analyzeRows(rows);
      },
    });
  };

  const analyzeRows = async (rows: Record<string, unknown>[]) => {
    try {
      const res = await fetch("/api/manager/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawRows: rows,
          commit: false,
          autoAssign: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setImportState("FAILED");
        setErrorMessage(data.error || "Analysis failed");
        return;
      }

      setSummary(data.summary);
      setPreviewRows(data.previewRows || []);
      setInvalidRows(data.invalidRows || []);
      setImportState("PREVIEW");
    } catch {
      setImportState("FAILED");
      setErrorMessage("Network error during validation analysis");
    }
  };

  const handleConfirmImport = async () => {
    setImportState("COMMITTING");
    try {
      const res = await fetch("/api/manager/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawRows: rawParsedRows,
          commit: true,
          autoAssign: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCommittedCount(data.committedCount);
        if (summary && summary.invalidCount > 0) {
          setImportState("PARTIAL");
        } else {
          setImportState("IMPORTED");
        }
      } else {
        setImportState("FAILED");
        setErrorMessage(data.error || "Commit failed");
      }
    } catch {
      setImportState("FAILED");
      setErrorMessage("Network failure during commitment");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F5] flex">
      <ManagerSidebar managerName="Anand Verma" branchName="Indore Main - Palasia" />

      <main className="flex-1 p-8 space-y-6 overflow-y-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#171918] tracking-tight">
              CSV Import & Intelligent Officer Assignment
            </h1>
            <p className="text-xs text-muted mt-1">
              Upload CBS overdue loan extracts, validate columns, and auto-route to field officers by pincode and workload.
            </p>
          </div>

          <button
            onClick={handleLoadSample}
            className="px-3.5 py-2 rounded-lg border border-[#D5D7CF] bg-white hover:bg-[#F2F3EE] text-xs font-semibold text-[#171918] shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-[#176B4D]" />
            <span>Load Indore Sample CSV</span>
          </button>
        </div>

        {/* State Banner */}
        {importState === "IMPORTED" && (
          <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
            <span>
              Successfully imported and assigned {committedCount} overdue loans to field officer rosters!
            </span>
          </div>
        )}

        {importState === "PARTIAL" && (
          <div className="p-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#78350F] text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#B45309]" />
            <span>
              Partially imported {committedCount} valid loans. Skipped {summary?.invalidCount} invalid rows / duplicates.
            </span>
          </div>
        )}

        {importState === "FAILED" && (
          <div className="p-4 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#7F1D1D] text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#B91C1C]" />
            <span>Import failed: {errorMessage}</span>
          </div>
        )}

        {/* Drag and Drop Upload Card */}
        {importState !== "IMPORTED" && (
          <Card className="p-6 border-dashed border-2 border-[#D5D7CF] bg-[#FAFBF9] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white border border-[#E2E4DE] flex items-center justify-center mx-auto text-[#176B4D]">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#171918]">
                Select or drop CBS Overdue CSV export
              </p>
              <p className="text-xs text-muted max-w-sm mx-auto mt-0.5">
                Expected columns: Loan ID, Borrower Name, Outstanding Amount, DPD, Pincode, Branch
              </p>
            </div>

            <label className="inline-block cursor-pointer">
              <span className="px-4 py-2 bg-[#176B4D] hover:bg-[#12533B] text-white text-xs font-semibold rounded-lg shadow-xs inline-flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Browse Local CSV File</span>
              </span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processCsvFile(file);
                }}
              />
            </label>
          </Card>
        )}

        {/* Validation & Preview Section */}
        {summary && importState !== "IMPORTED" && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-[#E2E4DE]">
                <span className="text-[11px] text-muted block">Total Rows Analyzed</span>
                <span className="text-lg font-bold text-[#171918]">
                  {summary.totalRows}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#BBF7D0] bg-[#F2FBF6]">
                <span className="text-[11px] text-[#14532D] block">Valid & Ready</span>
                <span className="text-lg font-bold text-[#15803D]">
                  {summary.validCount}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#FDE68A] bg-[#FFFDF5]">
                <span className="text-[11px] text-[#78350F] block">Duplicates Detected</span>
                <span className="text-lg font-bold text-[#B45309]">
                  {summary.duplicateCount}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#FECACA] bg-[#FFF8F8]">
                <span className="text-[11px] text-[#7F1D1D] block">Invalid / Missing</span>
                <span className="text-lg font-bold text-[#B91C1C]">
                  {summary.invalidCount}
                </span>
              </div>
            </div>

            {/* Pincode & Workload Assignment Preview */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#171918]">
                    Intelligent Assignment & Priority Scoring Preview
                  </h3>
                  <p className="text-[11px] text-muted">
                    Loans auto-assigned to least-loaded officer matching pincode with calculated AI priority score
                  </p>
                </div>

                <Button
                  onClick={handleConfirmImport}
                  isLoading={importState === "COMMITTING"}
                  disabled={summary.validCount === 0}
                  size="md"
                >
                  <FileCheck className="w-4 h-4 mr-1.5" />
                  <span>Confirm & Commit {summary.validCount} Loans</span>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E4DE] text-muted">
                      <th className="py-2 font-medium">Loan ID</th>
                      <th className="py-2 font-medium">Borrower</th>
                      <th className="py-2 font-medium">Outstanding</th>
                      <th className="py-2 font-medium">DPD</th>
                      <th className="py-2 font-medium">Pincode</th>
                      <th className="py-2 font-medium">Assigned Officer</th>
                      <th className="py-2 font-medium">Predicted Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2F3EE]">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#FAFBF9]">
                        <td className="py-2.5 font-mono font-semibold text-muted">
                          {row.loanId}
                        </td>
                        <td className="py-2.5 font-medium text-[#171918]">
                          {row.borrowerName}
                        </td>
                        <td className="py-2.5 font-semibold">
                          {formatLakhs(row.outstandingAmount)}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={
                              row.dpd >= 30 ? "text-[#B91C1C] font-bold" : "text-[#B45309]"
                            }
                          >
                            {row.dpd} DPD
                          </span>
                        </td>
                        <td className="py-2.5 font-mono">{row.pincode}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-full bg-[#EAF3EF] text-[#176B4D] font-semibold text-[11px]">
                            {row.assignedOfficerName}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <PriorityBadge
                            score={row.predictedPriorityScore}
                            category={row.predictedCategory}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Invalid Rows Table if any */}
            {invalidRows.length > 0 && (
              <Card className="p-4 border-[#FECACA] bg-[#FFF8F8] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7F1D1D]">
                  <AlertTriangle className="w-4 h-4 text-[#B91C1C]" />
                  <span>Invalid Rows Excluded From Import ({invalidRows.length})</span>
                </div>
                <div className="space-y-1.5 text-xs text-[#7F1D1D]">
                  {invalidRows.map((inv, i) => (
                    <div key={i} className="p-2 rounded bg-white border border-[#FECACA] flex items-center justify-between">
                      <span className="font-mono">Row #{inv.rowNumber} (Loan: {(inv.data.loanId as string) || "N/A"})</span>
                      <span className="font-medium text-[11px]">{inv.errors.join("; ")}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
