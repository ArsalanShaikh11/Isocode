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
    const officerId = searchParams.get("officerId");
    const outcomeType = searchParams.get("outcome");
    const branchId = searchParams.get("branchId");

    const whereClause: Record<string, unknown> = {};

    if (officerId && officerId !== "ALL") {
      whereClause.officerId = officerId;
    }
    if (outcomeType && outcomeType !== "ALL") {
      whereClause.outcomeType = outcomeType;
    }
    if (branchId && branchId !== "ALL") {
      whereClause.loan = { branchId };
    }

    const outcomes = await db.collectionOutcome.findMany({
      where: whereClause,
      include: {
        officer: { select: { id: true, name: true, phone: true } },
        loan: {
          include: {
            borrower: true,
            branch: true,
          },
        },
      },
      orderBy: { clientRecordedAt: "desc" },
      take: 50,
    });

    // Also get all officers and branches for filter dropdowns
    const officers = await db.user.findMany({
      where: { role: "OFFICER" },
      select: { id: true, name: true },
    });
    const branches = await db.branch.findMany({
      select: { id: true, name: true, code: true },
    });

    const formatted = outcomes.map((o) => ({
      id: o.id,
      officerId: o.officerId,
      officerName: o.officer.name,
      borrowerName: o.loan.borrower.name,
      loanId: o.loanId,
      branchName: o.loan.branch.name,
      outcomeType: o.outcomeType,
      amountCollected: o.amountCollected,
      paymentMode: o.paymentMode,
      receiptNumber: o.receiptNumber,
      disputeReason: o.disputeReason,
      notes: o.notes,
      latitude: o.latitude,
      longitude: o.longitude,
      isOfflineSync: o.isOfflineSync,
      recordedAt: o.clientRecordedAt,
      serverReceivedAt: o.serverReceivedAt,
    }));

    return NextResponse.json({
      activities: formatted,
      filterOptions: {
        officers,
        branches,
      },
    });
  } catch (err: unknown) {
    console.error("Activity API error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve officer activity log" },
      { status: 500 }
    );
  }
}
