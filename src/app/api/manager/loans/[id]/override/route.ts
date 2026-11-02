import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "MANAGER") {
      return NextResponse.json(
        { error: "Forbidden: Only Branch Managers can override AI priorities" },
        { status: 403 }
      );
    }

    const { overrideScore, overrideReason, reset } = await req.json();
    const loanId = params.id;

    const loan = await db.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    if (reset) {
      // Revert override
      await db.loan.update({
        where: { id: loanId },
        data: {
          priorityOverride: false,
          overrideScore: null,
          overrideReason: null,
        },
      });

      await db.auditEvent.create({
        data: {
          loanId,
          userId: user.id,
          action: "PRIORITY_OVERRIDE_RESET",
          details: JSON.stringify({
            originalAiScore: loan.priorityScore,
            managerId: user.id,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: "AI priority restored to standard algorithmic calculation.",
        activeScore: loan.priorityScore,
        isOverridden: false,
      });
    }

    const numScore = Number(overrideScore);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      return NextResponse.json(
        { error: "Override score must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    if (!overrideReason || overrideReason.trim().length < 5) {
      return NextResponse.json(
        { error: "A clear supervisory justification reason is required for audit compliance" },
        { status: 400 }
      );
    }

    await db.loan.update({
      where: { id: loanId },
      data: {
        priorityOverride: true,
        overrideScore: numScore,
        overrideReason: overrideReason.trim(),
      },
    });

    await db.auditEvent.create({
      data: {
        loanId,
        userId: user.id,
        action: "PRIORITY_OVERRIDDEN",
        details: JSON.stringify({
          previousScore: loan.priorityScore,
          newScore: numScore,
          reason: overrideReason,
          manager: user.name,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Priority score updated with managerial override.",
      activeScore: numScore,
      isOverridden: true,
    });
  } catch (err: unknown) {
    console.error("Override API error:", err);
    return NextResponse.json(
      { error: "Failed to override priority" },
      { status: 500 }
    );
  }
}

