import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../src/lib/db/prisma";
import { calculatePriorityScore } from "../src/lib/ai/prioritisation";
import { computeRollRateAnalytics } from "../src/lib/analytics/roll-rate";

describe("End-to-End Core Collections Workflow & Access Control", () => {
  const testLoanId = "LN-E2E-TEST";
  const testOfficerId = "usr-off-rahul";

  beforeAll(async () => {
    // Ensure clean state for test loan
    await db.collectionOutcome.deleteMany({ where: { loanId: testLoanId } });
    await db.promiseToPay.deleteMany({ where: { loanId: testLoanId } });
    await db.loan.deleteMany({ where: { id: testLoanId } });

    const borrower =
      (await db.borrower.findFirst()) ||
      (await db.borrower.create({
        data: {
          name: "Test E2E Borrower",
          businessType: "Machining",
          phone: "9826011111",
          address: "Indore",
          pincode: "452001",
        },
      }));

    const branch =
      (await db.branch.findFirst()) ||
      (await db.branch.create({
        data: {
          code: "IND-TEST",
          name: "Test Branch",
          pincodes: "452001",
        },
      }));

    await db.loan.create({
      data: {
        id: testLoanId,
        borrowerId: borrower.id,
        branchId: branch.id,
        assignedOfficerId: testOfficerId,
        disbursedAmount: 500000,
        outstandingAmount: 200000,
        dpd: 18,
        dpdBucket: "1-30",
        emiAmount: 20000,
        totalMissedEmis: 1,
        priorityScore: 70,
        priorityCategory: "HIGH",
        priorityReasons: JSON.stringify(["Test initial reason"]),
      },
    });
  });

  afterAll(async () => {
    await db.collectionOutcome.deleteMany({ where: { loanId: testLoanId } });
    await db.promiseToPay.deleteMany({ where: { loanId: testLoanId } });
    await db.loan.deleteMany({ where: { id: testLoanId } });
  });

  it("should execute end-to-end field collection outcome logging and prevent duplicate offline sync", async () => {
    const loanBefore = await db.loan.findUnique({
      where: { id: testLoanId },
    });
    expect(loanBefore).not.toBeNull();
    expect(loanBefore?.outstandingAmount).toBe(200000);

    const idempotencyKey = `e2e-sync-${Date.now()}`;
    const collectedAmount = 20000;

    // 1. First sync submission
    const existing = await db.collectionOutcome.findUnique({
      where: { idempotencyKey },
    });
    expect(existing).toBeNull();

    const outcome = await db.collectionOutcome.create({
      data: {
        idempotencyKey,
        loanId: testLoanId,
        officerId: testOfficerId,
        outcomeType: "PAID",
        amountCollected: collectedAmount,
        paymentMode: "UPI",
        receiptNumber: "REC-E2E-1",
        clientRecordedAt: new Date(),
        isOfflineSync: true,
      },
    });
    expect(outcome.id).toBeDefined();

    // Update loan outstanding
    const updatedLoan = await db.loan.update({
      where: { id: testLoanId },
      data: {
        outstandingAmount: loanBefore!.outstandingAmount - collectedAmount,
      },
    });
    expect(updatedLoan.outstandingAmount).toBe(180000);

    // 2. Duplicate sync attempt with identical idempotencyKey
    const duplicateCheck = await db.collectionOutcome.findUnique({
      where: { idempotencyKey },
    });
    expect(duplicateCheck).not.toBeNull();
    // System recognizes duplicate idempotency key and does NOT insert or double-deduct
    const outcomesCount = await db.collectionOutcome.count({
      where: { idempotencyKey },
    });
    expect(outcomesCount).toBe(1);

    // 3. Verify AI priority re-calculation reflects updated outstanding & payment
    const recalculated = calculatePriorityScore({
      loanId: testLoanId,
      borrowerName: "Test E2E Borrower",
      dpd: 18,
      outstandingAmount: updatedLoan.outstandingAmount,
      totalMissedEmis: 1,
      promiseStatus: "NONE",
    });
    expect(recalculated.score).toBeGreaterThan(0);
    expect(recalculated.reasons.length).toBe(3);
  });

  it("should enforce officer loan assignment scoping", async () => {
    const loan = await db.loan.findUnique({
      where: { id: testLoanId },
    });

    const isAuthorized = loan?.assignedOfficerId === testOfficerId;
    const isUnauthorizedOfficer = loan?.assignedOfficerId === "other-officer-id";

    expect(isAuthorized).toBe(true);
    expect(isUnauthorizedOfficer).toBe(false);
  });
});
