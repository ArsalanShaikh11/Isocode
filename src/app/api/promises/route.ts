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
    const statusFilter = searchParams.get("status");

    const whereClause: Record<string, unknown> = {};

    // Role-based visibility
    if (user.role === "OFFICER") {
      whereClause.officerId = user.id;
    } else if (user.branchId) {
      whereClause.loan = { branchId: user.branchId };
    }

    if (statusFilter && statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    const promises = await db.promiseToPay.findMany({
      where: whereClause,
      include: {
        loan: {
          include: {
            borrower: true,
            branch: true,
          },
        },
        officer: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { promiseDate: "asc" },
    });

    const formatted = promises.map((p) => ({
      id: p.id,
      loanId: p.loanId,
      borrowerName: p.loan.borrower.name,
      businessType: p.loan.borrower.businessType,
      phone: p.loan.borrower.phone,
      address: p.loan.borrower.address,
      dpd: p.loan.dpd,
      outstandingAmount: p.loan.outstandingAmount,
      branchName: p.loan.branch.name,
      officerId: p.officerId,
      officerName: p.officer.name,
      promisedAmount: p.promisedAmount,
      promiseDate: p.promiseDate,
      status: p.status,
      notes: p.notes,
      fulfilledAmount: p.fulfilledAmount,
      fulfilledDate: p.fulfilledDate,
      createdAt: p.createdAt,
    }));

    const counts = {
      total: formatted.length,
      pending: formatted.filter((p) => p.status === "PENDING").length,
      dueToday: formatted.filter((p) => p.status === "DUE_TODAY").length,
      broken: formatted.filter((p) => p.status === "BROKEN").length,
      fulfilled: formatted.filter((p) => p.status === "FULFILLED").length,
    };

    return NextResponse.json({
      promises: formatted,
      counts,
    });
  } catch (err: unknown) {
    console.error("Promises API error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve promises to pay" },
      { status: 500 }
    );
  }
}
