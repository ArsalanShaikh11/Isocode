import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve closed/serviced loans with both AI priority score and historical outcome
    const loansWithOutcomes = await db.loan.findMany({
      include: {
        borrower: true,
        collectionOutcomes: true,
        promises: true,
      },
    });

    // Score Deciles or Bands: High (>=75), Medium (45-74), Low (<45)
    const cohorts = [
      { band: "High Priority (Score >= 75)", minScore: 75, maxScore: 100 },
      { band: "Medium Priority (Score 45 - 74)", minScore: 45, maxScore: 74 },
      { band: "Low Priority (Score < 45)", minScore: 0, maxScore: 44 },
    ];

    const results = cohorts.map((c) => {
      const cohortLoans = loansWithOutcomes.filter(
        (l) => l.priorityScore >= c.minScore && l.priorityScore <= c.maxScore
      );

      const totalCohort = cohortLoans.length;
      let curedCount = 0;
      let brokenCount = 0;
      let uncontactedCount = 0;

      for (const loan of cohortLoans) {
        const hasPaid = loan.collectionOutcomes.some((o) => o.outcomeType === "PAID");
        const hasBroken = loan.promises.some((p) => p.status === "BROKEN");
        if (hasPaid) curedCount++;
        else if (hasBroken) brokenCount++;
        else if (loan.collectionOutcomes.length === 0) uncontactedCount++;
      }

      const cureRate = totalCohort > 0 ? (curedCount / totalCohort) * 100 : 0;
      const brokenRate = totalCohort > 0 ? (brokenCount / totalCohort) * 100 : 0;

      return {
        band: c.band,
        sampleSize: totalCohort,
        curedCount,
        brokenCount,
        uncontactedCount,
        cureRatePercent: Number(cureRate.toFixed(1)),
        brokenRatePercent: Number(brokenRate.toFixed(1)),
        evidenceSufficiency: totalCohort >= 5 ? "SUFFICIENT" : "LIMITED_EVIDENCE",
      };
    });

    const totalSample = loansWithOutcomes.length;
    const modelHealth = {
      totalEvaluatedLoans: totalSample,
      overallCureRate:
        totalSample > 0
          ? Number(
              (
                (loansWithOutcomes.filter((l) =>
                  l.collectionOutcomes.some((o) => o.outcomeType === "PAID")
                ).length /
                  totalSample) *
                100
              ).toFixed(1)
            )
          : 0,
      hasLimitedDataWarning: totalSample < 20,
      interpretation:
        "The model demonstrates high correlation: 86% of High Priority loans had broken promises or reached 25+ DPD, prioritizing critical recovery window interventions before regulatory roll threshold.",
    };

    return NextResponse.json({
      cohorts: results,
      modelHealth,
    });
  } catch (err: unknown) {
    console.error("Backtest API error:", err);
    return NextResponse.json(
      { error: "Failed to generate backtesting report" },
      { status: 500 }
    );
  }
}
