import { z } from "zod";

export const CsvLoanRowSchema = z.object({
  loanId: z.string().min(3, "Loan ID must be at least 3 characters"),
  borrowerName: z.string().min(2, "Borrower name is required"),
  businessType: z.string().optional().default("General Trading"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian phone number").optional().default("9826012345"),
  outstandingAmount: z.coerce.number().positive("Outstanding amount must be greater than 0"),
  dpd: z.coerce.number().int().min(0, "DPD cannot be negative"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  branch: z.string().min(2, "Branch name or code is required"),
  officerEmail: z.string().email().optional().or(z.literal("")),
});

export type CsvLoanRow = z.infer<typeof CsvLoanRowSchema>;

export interface CsvValidationRowResult {
  rowNumber: number;
  data: Partial<CsvLoanRow>;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
}

export interface CsvImportAnalysis {
  totalRows: number;
  validRows: CsvValidationRowResult[];
  invalidRows: CsvValidationRowResult[];
  duplicateCount: number;
  hasRequiredColumns: boolean;
  missingColumns: string[];
}

export const REQUIRED_CSV_COLUMNS = [
  "loanId",
  "borrowerName",
  "outstandingAmount",
  "dpd",
  "pincode",
  "branch",
];

// Normalize headers so "Loan ID", "loan_id", "LoanId" all map cleanly
export function normalizeHeader(header: string): string {
  const clean = header.trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (clean === "loanid" || clean === "loan" || clean === "id") return "loanId";
  if (clean === "borrower" || clean === "borrowername" || clean === "customername" || clean === "name") return "borrowerName";
  if (clean === "outstanding" || clean === "outstandingamount" || clean === "balance" || clean === "pos") return "outstandingAmount";
  if (clean === "dpd" || clean === "dayspastdue" || clean === "overduedays") return "dpd";
  if (clean === "pincode" || clean === "pin" || clean === "postalcode" || clean === "zip") return "pincode";
  if (clean === "branch" || clean === "branchname" || clean === "branchcode") return "branch";
  if (clean === "officer" || clean === "officeremail" || clean === "agent" || clean === "assignedto") return "officerEmail";
  if (clean === "business" || clean === "businesstype" || clean === "sector") return "businessType";
  if (clean === "phone" || clean === "mobile" || clean === "contact") return "phone";
  return clean;
}

export function validateCsvRows(
  rawRows: Record<string, unknown>[],
  existingLoanIds: Set<string>
): CsvImportAnalysis {
  const validRows: CsvValidationRowResult[] = [];
  const invalidRows: CsvValidationRowResult[] = [];
  const seenInBatch = new Set<string>();
  let duplicateCount = 0;

  // Check headers from first row
  const firstRow = rawRows[0] || {};
  const normalizedKeys = Object.keys(firstRow).map((k) => normalizeHeader(k));
  const missing = REQUIRED_CSV_COLUMNS.filter((col) => !normalizedKeys.includes(col));
  const hasRequired = missing.length === 0;

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1
    const mapped: Record<string, unknown> = {};

    Object.entries(row).forEach(([key, val]) => {
      const norm = normalizeHeader(key);
      mapped[norm] = typeof val === "string" ? val.trim() : val;
    });

    const parsed = CsvLoanRowSchema.safeParse(mapped);
    const loanId = (mapped.loanId as string) || "";

    const isDuplicate =
      existingLoanIds.has(loanId) || seenInBatch.has(loanId);

    if (isDuplicate) {
      duplicateCount++;
    }
    if (loanId) {
      seenInBatch.add(loanId);
    }

    if (!parsed.success) {
      const errMsgs = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      if (isDuplicate) errMsgs.push("Duplicate loan ID detected in system or batch");
      invalidRows.push({
        rowNumber: rowNum,
        data: mapped,
        isValid: false,
        errors: errMsgs,
        isDuplicate,
      });
    } else {
      if (isDuplicate) {
        invalidRows.push({
          rowNumber: rowNum,
          data: parsed.data,
          isValid: false,
          errors: ["Duplicate loan ID detected in system or batch"],
          isDuplicate: true,
        });
      } else {
        validRows.push({
          rowNumber: rowNum,
          data: parsed.data,
          isValid: true,
          errors: [],
          isDuplicate: false,
        });
      }
    }
  });

  return {
    totalRows: rawRows.length,
    validRows,
    invalidRows,
    duplicateCount,
    hasRequiredColumns: hasRequired,
    missingColumns: missing,
  };
}

/**
 * Intelligent Pincode & Workload Assignment
 * Assigns loans to field officers based on:
 * 1. Pincode match with officer's assigned branch pincodes
 * 2. Least loaded officer (balancing current active loans)
 */
export interface OfficerCandidate {
  id: string;
  name: string;
  email: string;
  pincodes: string[];
  currentAssignedCount: number;
}

export function autoAssignByPincodeAndWorkload(
  pincode: string,
  officers: OfficerCandidate[]
): OfficerCandidate | null {
  if (officers.length === 0) return null;

  // 1. Find officers whose branch covers this pincode
  const matchingOfficers = officers.filter((off) =>
    off.pincodes.includes(pincode)
  );

  const pool = matchingOfficers.length > 0 ? matchingOfficers : officers;

  // 2. Select officer with the lowest current workload
  const sorted = [...pool].sort(
    (a, b) => a.currentAssignedCount - b.currentAssignedCount
  );
  return sorted[0] || null;
}

