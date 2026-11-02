import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loanId = params.id;
    const loan = await db.loan.findUnique({
      where: { id: loanId },
      include: {
        borrower: true,
        branch: true,
        assignedOfficer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        promises: {
          orderBy: { createdAt: "desc" },
          include: {
            officer: { select: { name: true } },
          },
        },
        collectionOutcomes: {
          orderBy: { clientRecordedAt: "desc" },
          include: {
            officer: { select: { name: true } },
          },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Role-based access check: If officer, must be assigned to them
    if (user.role === "OFFICER" && loan.assignedOfficerId !== user.id) {
      return NextResponse.json(
        { error: "Access denied. You are only authorized to view loans assigned to you." },
        { status: 403 }
      );
    }

    let reasons: string[] = [];
    try {
      reasons = JSON.parse(loan.priorityReasons);
    } catch {
      reasons = [];
    }

    return NextResponse.json({
      loan: {
        ...loan,
        priorityReasons: reasons,
      },
    });
  } catch (err: unknown) {
    console.error("Single loan API error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve loan details" },
      { status: 500 }
    );
  }
}
