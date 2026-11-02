import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    // Role-based scoping: Field officers only see their assigned loans
    const whereClause: Record<string, unknown> = {};
    if (user.role === "OFFICER") {
      whereClause.assignedOfficerId = user.id;
    } else {
      // Manager can view loans in their branch or by officer query param
      const officerParam = searchParams.get("officerId");
      if (officerParam) {
        whereClause.assignedOfficerId = officerParam;
      } else if (user.branchId) {
        whereClause.branchId = user.branchId;
      }
    }

    const loans = await db.loan.findMany({
      where: whereClause,
      include: {
        borrower: true,
        branch: true,
        assignedOfficer: {
          select: { id: true, name: true, phone: true },
        },
        promises: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        collectionOutcomes: {
          orderBy: { clientRecordedAt: "desc" },
          take: 1,
        },
      },
      orderBy: [
        { priorityScore: "desc" },
        { dpd: "desc" },
      ],
    });

    const formattedLoans = loans.map((loan) => {
      const activePromise = loan.promises[0];
      const lastOutcome = loan.collectionOutcomes[0];

      let reasons: string[] = [];
      try {
        reasons = JSON.parse(loan.priorityReasons);
      } catch {
        reasons = ["Delinquency vintage", "High portfolio exposure"];
      }

      return {
        id: loan.id,
        borrowerId: loan.borrowerId,
        borrowerName: loan.borrower.name,
        contactPerson: loan.borrower.contactPerson,
        businessType: loan.borrower.businessType,
        phone: loan.borrower.phone,
        address: loan.borrower.address,
        pincode: loan.borrower.pincode,
        latitude: loan.borrower.latitude,
        longitude: loan.borrower.longitude,
        branchName: loan.branch.name,
        assignedOfficerName: loan.assignedOfficer?.name,
        disbursedAmount: loan.disbursedAmount,
        outstandingAmount: loan.outstandingAmount,
        dpd: loan.dpd,
        dpdBucket: loan.dpdBucket,
        emiAmount: loan.emiAmount,
        totalMissedEmis: loan.totalMissedEmis,
        lastPaymentDate: loan.lastPaymentDate,
        priorityScore: loan.overrideScore ?? loan.priorityScore,
        priorityCategory: loan.priorityCategory,
        priorityReasons: reasons,
        isOverridden: loan.priorityOverride,
        status: loan.status,
        activePromise: activePromise
          ? {
              id: activePromise.id,
              promisedAmount: activePromise.promisedAmount,
              promiseDate: activePromise.promiseDate,
              status: activePromise.status,
              notes: activePromise.notes,
            }
          : null,
        lastOutcome: lastOutcome
          ? {
              outcomeType: lastOutcome.outcomeType,
              clientRecordedAt: lastOutcome.clientRecordedAt,
              notes: lastOutcome.notes,
            }
          : null,
      };
    });

    // Apply filters
    const filtered = formattedLoans.filter((item) => {
      if (filter === "high") {
        return item.priorityScore >= 70;
      }
      if (filter === "promise_due") {
        return (
          item.activePromise?.status === "DUE_TODAY" ||
          (item.activePromise?.status === "PENDING" &&
            new Date(item.activePromise.promiseDate).toDateString() ===
              new Date().toDateString())
        );
      }
      if (filter === "broken_promise") {
        return item.activePromise?.status === "BROKEN";
      }
      if (filter === "not_contacted") {
        return !item.lastOutcome;
      }
      return true;
    });

    // Summary counts for officer top cards
    const totalAssigned = formattedLoans.length;
    const promisesDueToday = formattedLoans.filter(
      (l) =>
        l.activePromise?.status === "DUE_TODAY" ||
        (l.activePromise &&
          new Date(l.activePromise.promiseDate).toDateString() ===
            new Date().toDateString())
    ).length;
    const brokenPromisesCount = formattedLoans.filter(
      (l) => l.activePromise?.status === "BROKEN"
    ).length;
    const pendingVisitsCount = formattedLoans.filter((l) => !l.lastOutcome).length;

    return NextResponse.json({
      loans: filtered,
      summary: {
        totalAssigned,
        promisesDueToday,
        brokenPromisesCount,
        pendingVisitsCount,
      },
    });
  } catch (err: unknown) {
    console.error("Officer loans API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch assigned loans" },
      { status: 500 }
    );
  }
}
