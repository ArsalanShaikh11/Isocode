import { describe, it, expect } from "vitest";
import {
  calculatePriorityScore,
  formatLakhs,
} from "../src/lib/ai/prioritisation";

describe("AI Prioritisation Scoring Engine", () => {
  it("should match Company D (LN-11930) prompt example with score 86 and top 3 reasons", () => {
    const result = calculatePriorityScore({
      loanId: "LN-11930",
      borrowerName: "Company D (printing press)",
      dpd: 19,
      outstandingAmount: 220000,
      promiseStatus: "BROKEN",
      totalMissedEmis: 2,
    });

    expect(result.score).toBe(86);
    expect(result.category).toBe("CRITICAL");
    expect(result.reasons.length).toBe(3);
    expect(result.reasons[0]).toContain("Previously broken promise to pay");
    expect(result.reasons[1]).toContain("19 days past due");
    expect(result.reasons[2]).toContain("2.2 lakh");
    expect(result.advisoryNote).toBeDefined();
  });

  it("should assign lower priority to current loans with no broken promise", () => {
    const result = calculatePriorityScore({
      loanId: "LN-TEST-01",
      borrowerName: "Clean Borrower",
      dpd: 2,
      outstandingAmount: 50000,
      promiseStatus: "NONE",
      totalMissedEmis: 0,
    });

    expect(result.score).toBeLessThan(40);
    expect(result.category).toBe("LOW");
  });

  it("should detect limited evidence when loan has minimal collection history", () => {
    const result = calculatePriorityScore({
      loanId: "LN-NEW-01",
      borrowerName: "New Entity",
      dpd: 10,
      outstandingAmount: 150000,
      totalMissedEmis: 1,
      historicalOutcomesCount: 0,
    });

    expect(result.hasLimitedEvidence).toBe(true);
  });

  it("should downgrade priority score and display cured reasons when payment clears overdue instalments", () => {
    const result = calculatePriorityScore({
      loanId: "LN-11405",
      borrowerName: "Malwa Fabricators & Textile",
      dpd: 0,
      outstandingAmount: 404000,
      totalMissedEmis: 0,
      promiseStatus: "FULFILLED",
    });

    expect(result.score).toBeLessThan(30);
    expect(result.category).toBe("LOW");
    expect(result.reasons).toContain("Account cured — 0 DPD (current on payments).");
    expect(result.reasons).toContain("Recent payment commitment fulfilled successfully.");
  });

  it("should format Indian currency values correctly", () => {
    expect(formatLakhs(640000)).toBe("₹6.4 lakh");
    expect(formatLakhs(220000)).toBe("₹2.2 lakh");
    expect(formatLakhs(12500000)).toBe("₹1.25 Cr");
    expect(formatLakhs(45000)).toBe("₹45,000");
  });
});

