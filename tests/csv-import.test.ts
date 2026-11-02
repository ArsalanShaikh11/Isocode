import { describe, it, expect } from "vitest";
import {
  validateCsvRows,
  autoAssignByPincodeAndWorkload,
  OfficerCandidate,
} from "../src/lib/validation/csv-import";

describe("CSV Validation and Intelligent Officer Assignment", () => {
  it("should validate valid rows and identify missing required fields", () => {
    const rawRows = [
      {
        "Loan ID": "LN-2001",
        "Borrower Name": "Shree Industries",
        "Outstanding Amount": "450000",
        DPD: "18",
        Pincode: "452001",
        Branch: "Indore Palasia",
      },
      {
        "Loan ID": "LN-2002",
        "Borrower Name": "Defective Row",
        "Outstanding Amount": "-500", // invalid negative
        DPD: "10",
        Pincode: "123", // invalid pincode
        Branch: "Indore Palasia",
      },
    ];

    const analysis = validateCsvRows(rawRows, new Set(["LN-EXISTING"]));

    expect(analysis.hasRequiredColumns).toBe(true);
    expect(analysis.validRows.length).toBe(1);
    expect(analysis.invalidRows.length).toBe(1);
    expect(analysis.invalidRows[0].errors.length).toBeGreaterThan(0);
  });

  it("should detect duplicate loan IDs against system and within batch", () => {
    const existing = new Set(["LN-DUPE-01"]);
    const rawRows = [
      {
        "Loan ID": "LN-DUPE-01", // duplicate against existing
        "Borrower Name": "Dupe 1",
        "Outstanding Amount": "100000",
        DPD: "5",
        Pincode: "452001",
        Branch: "Indore Palasia",
      },
      {
        "Loan ID": "LN-NEW-99",
        "Borrower Name": "Batch First",
        "Outstanding Amount": "200000",
        DPD: "15",
        Pincode: "452001",
        Branch: "Indore Palasia",
      },
      {
        "Loan ID": "LN-NEW-99", // duplicate in batch
        "Borrower Name": "Batch Second",
        "Outstanding Amount": "200000",
        DPD: "15",
        Pincode: "452001",
        Branch: "Indore Palasia",
      },
    ];

    const analysis = validateCsvRows(rawRows, existing);
    expect(analysis.duplicateCount).toBe(2);
    expect(analysis.validRows.length).toBe(1);
  });

  it("should auto-assign to the least loaded officer matching pincode", () => {
    const officers: OfficerCandidate[] = [
      {
        id: "off-1",
        name: "Rahul Chouhan",
        email: "rahul@test.in",
        pincodes: ["452001", "452002"],
        currentAssignedCount: 15,
      },
      {
        id: "off-2",
        name: "Neha Solanki",
        email: "neha@test.in",
        pincodes: ["452001", "452010"],
        currentAssignedCount: 8, // lower workload
      },
      {
        id: "off-3",
        name: "Imran Qureshi",
        email: "imran@test.in",
        pincodes: ["454774"],
        currentAssignedCount: 3,
      },
    ];

    const assigned = autoAssignByPincodeAndWorkload("452001", officers);
    expect(assigned).not.toBeNull();
    // off-2 also covers 452001 and has 8 vs 15 workload
    expect(assigned?.id).toBe("off-2");
  });
});
