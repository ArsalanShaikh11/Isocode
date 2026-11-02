import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { computeRollRateAnalytics } from "@/lib/analytics/roll-rate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchFilter = searchParams.get("branchId");

    const loanWhere: Record<string, unknown> = {};
    if (branchFilter && branchFilter !== "ALL") {
      loanWhere.branchId = branchFilter;
    }

    // 1. Fetch live loans
    const loans = await db.loan.findMany({
      where: loanWhere,
      include: {
        branch: true,
        assignedOfficer: true,
      },
    });

    // 2. Fetch live promises
    const promises = await db.promiseToPay.findMany({
      where: branchFilter && branchFilter !== "ALL" ? { loan: { branchId: branchFilter } } : {},
      include: { loan: true },
    });

    // 3. Compute roll rate & DPD distribution
    const rollRateAnalytics = computeRollRateAnalytics(
      loans.map((l) => ({
        id: l.id,
        dpd: l.dpd,
        dpdBucket: l.dpdBucket,
        outstandingAmount: l.outstandingAmount,
        disbursedAmount: l.disbursedAmount,
        branchId: l.branchId,
        branchName: l.branch.name,
        assignedOfficerId: l.assignedOfficerId,
        assignedOfficerName: l.assignedOfficer?.name,
      })),
      promises.map((p) => ({
        id: p.id,
        status: p.status,
        promisedAmount: p.promisedAmount,
        promiseDate: p.promiseDate,
        fulfilledAmount: p.fulfilledAmount,
      }))
    );

    // 4. Fetch collection outcomes summary
    const outcomes = await db.collectionOutcome.findMany({
      where: branchFilter && branchFilter !== "ALL" ? { loan: { branchId: branchFilter } } : {},
      include: { officer: true, loan: true },
    });

    const outcomeBreakdown = {
      PAID: outcomes.filter((o) => o.outcomeType === "PAID").length,
      PROMISE_TO_PAY: outcomes.filter((o) => o.outcomeType === "PROMISE_TO_PAY").length,
      NOT_REACHABLE: outcomes.filter((o) => o.outcomeType === "NOT_REACHABLE").length,
      DISPUTE: outcomes.filter((o) => o.outcomeType === "DISPUTE").length,
      totalAmountCollected: outcomes
        .filter((o) => o.outcomeType === "PAID" && o.amountCollected)
        .reduce((sum, o) => sum + (o.amountCollected || 0), 0),
    };

    // 5. Branch comparison
    const allBranches = await db.branch.findMany({
      include: {
        loans: true,
      },
    });

    const branchComparison = allBranches.map((br) => {
      const brLoans = br.loans;
      const totalOutstanding = brLoans.reduce((sum, l) => sum + l.outstandingAmount, 0);
      const b1 = brLoans.filter((l) => l.dpd <= 30).length;
      const b2 = brLoans.filter((l) => l.dpd > 30 && l.dpd <= 60).length;
      const rollRate = b1 + b2 > 0 ? (b2 / (b1 + b2)) * 100 : 0;

      return {
        id: br.id,
        code: br.code,
        name: br.name,
        totalLoans: brLoans.length,
        totalOutstanding,
        rollRatePercent: Number(rollRate.toFixed(1)),
      };
    });

    // 6. Officer activity breakdown
    const officers = await db.user.findMany({
      where: { role: "OFFICER" },
      include: {
        assignedLoans: true,
        collectionOutcomes: true,
        promises: true,
      },
    });

    const officerPerformance = officers.map((off) => {
      const collectedAmount = off.collectionOutcomes
        .filter((o) => o.outcomeType === "PAID")
        .reduce((s, o) => s + (o.amountCollected || 0), 0);

      return {
        id: off.id,
        name: off.name,
        assignedLoansCount: off.assignedLoans.length,
        visitsLogged: off.collectionOutcomes.length,
        promisesTracked: off.promises.length,
        collectedAmount,
      };
    });

    // 7. Historical Roll Rate Trend
    const historicalSnapshots = await db.rollRateSnapshot.findMany({
      orderBy: { createdAt: "asc" },
      take: 6,
    });

    return NextResponse.json({
      analytics: rollRateAnalytics,
      outcomeBreakdown,
      branchComparison,
      officerPerformance,
      historicalSnapshots,
      branches: allBranches.map((b) => ({ id: b.id, name: b.name, code: b.code })),
    });
  } catch (err: unknown) {
    console.error("Manager dashboard error:", err);
    return NextResponse.json(
      { error: "Failed to generate dashboard analytics" },
      { status: 500 }
    );
  }
}
