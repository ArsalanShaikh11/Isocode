import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { APPROVED_TEMPLATES, draftReminder } from "@/lib/ai/reminder";
import { checkContactWindow } from "@/lib/contact-window";

export async function GET() {
  return NextResponse.json({ templates: APPROVED_TEMPLATES });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      loanId,
      templateId,
      action, // "DRAFT" | "APPROVE_AND_DISPATCH"
      simulationBypass,
    } = await req.json();

    const loan = await db.loan.findUnique({
      where: { id: loanId },
      include: {
        borrower: true,
        assignedOfficer: true,
        promises: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Role check
    if (user.role === "OFFICER" && loan.assignedOfficerId !== user.id) {
      return NextResponse.json(
        { error: "Access denied to loan" },
        { status: 403 }
      );
    }

    // Contact time check (8 AM - 7 PM IST)
    const windowCheck = checkContactWindow({ simulationBypass: Boolean(simulationBypass) });

    if (action === "APPROVE_AND_DISPATCH" && !windowCheck.isWithinWindow) {
      // Audit contact attempt that was blocked by time restrictions
      await db.auditEvent.create({
        data: {
          loanId: loan.id,
          userId: user.id,
          action: "CONTACT_ATTEMPT_BLOCKED_WINDOW",
          details: JSON.stringify({
            currentTime: windowCheck.currentIstTime,
            reason: windowCheck.reason,
            targetPhone: loan.borrower.phone,
          }),
        },
      });

      return NextResponse.json(
        {
          error: "CONTACT_WINDOW_RESTRICTION",
          message: windowCheck.reason,
          windowCheck,
        },
        { status: 403 }
      );
    }

    const activePromise = loan.promises[0];

    const draft = draftReminder({
      templateId,
      borrowerName: loan.borrower.name,
      loanId: loan.id,
      outstandingAmount: loan.outstandingAmount,
      emiAmount: loan.emiAmount,
      dpd: loan.dpd,
      officerName: user.name,
      officerPhone: user.phone || "+91 98260 11234",
      promisedAmount: activePromise?.promisedAmount,
      promiseDate: activePromise?.promiseDate
        ? new Date(activePromise.promiseDate).toLocaleDateString("en-IN")
        : undefined,
    });

    if (!draft.safetyCheck.isValid) {
      return NextResponse.json(
        {
          error: "SAFETY_POLICY_VIOLATION",
          message: draft.safetyCheck.reason,
          blockedWords: draft.safetyCheck.blockedWordsFound,
        },
        { status: 422 }
      );
    }

    if (action === "APPROVE_AND_DISPATCH") {
      // Record simulated dispatch in database
      const log = await db.reminderLog.create({
        data: {
          loanId: loan.id,
          officerId: user.id,
          language: draft.template.language,
          templateId: draft.template.id,
          messageContent: draft.messageContent,
          recipientPhone: loan.borrower.phone,
          safetyPassed: true,
          approvedByOfficer: true,
          status: "APPROVED_SIMULATED",
        },
      });

      await db.auditEvent.create({
        data: {
          loanId: loan.id,
          userId: user.id,
          action: "REMINDER_DISPATCHED_SIMULATED",
          details: JSON.stringify({
            logId: log.id,
            language: draft.template.language,
            phone: loan.borrower.phone,
            template: draft.template.name,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        status: "APPROVED_SIMULATED",
        messageContent: draft.messageContent,
        recipient: loan.borrower.name,
        phone: loan.borrower.phone,
        note: "Simulated dispatch completed. No SMS was sent to actual borrower.",
      });
    }

    return NextResponse.json({
      success: true,
      preview: {
        messageContent: draft.messageContent,
        template: draft.template,
        recipient: loan.borrower.name,
        phone: loan.borrower.phone,
        safetyCheck: draft.safetyCheck,
        windowCheck,
      },
    });
  } catch (err: unknown) {
    console.error("Reminder draft API error:", err);
    return NextResponse.json(
      { error: "Failed to generate reminder draft" },
      { status: 500 }
    );
  }
}
