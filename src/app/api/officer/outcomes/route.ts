import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { z } from "zod";
import { calculatePriorityScore } from "@/lib/ai/prioritisation";

const OutcomeLoggingSchema = z.object({
  idempotencyKey: z.string().min(6),
  loanId: z.string().min(3),
  outcomeType: z.enum(["PAID", "PROMISE_TO_PAY", "NOT_REACHABLE", "DISPUTE"]),
  amountCollected: z.number().optional().nullable(),
  paymentMode: z.string().optional().nullable(),
  receiptNumber: z.string().optional().nullable(),
  promisedAmount: z.number().optional().nullable(),
  promiseDate: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  disputeReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  clientRecordedAt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = OutcomeLoggingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Duplicate check using idempotency key
    const existing = await db.collectionOutcome.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Outcome already recorded (idempotent replay)",
        outcomeId: existing.id,
      });
    }

    const loan = await db.loan.findUnique({
      where: { id: data.loanId },
      include: { borrower: true },
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Role check: field officer can only log for their assigned loans
    if (user.role === "OFFICER" && loan.assignedOfficerId !== user.id) {
      return NextResponse.json(
        { error: "Access denied. Cannot log outcome for unassigned loan." },
        { status: 403 }
      );
    }

    const clientTime = data.clientRecordedAt
      ? new Date(data.clientRecordedAt)
      : new Date();

    // 1. If PROMISE_TO_PAY, create or update PromiseToPay record
    let promiseRecordId: string | null = null;
    if (data.outcomeType === "PROMISE_TO_PAY" && data.promiseDate && data.promisedAmount) {
      const pDate = new Date(data.promiseDate);
      const isToday = pDate.toDateString() === new Date().toDateString();

      const newPromise = await db.promiseToPay.create({
        data: {
          loanId: loan.id,
          officerId: user.id,
          promisedAmount: data.promisedAmount,
          promiseDate: pDate,
          status: isToday ? "DUE_TODAY" : "PENDING",
          notes: data.notes || "Recorded via officer field outcome",
        },
      });
      promiseRecordId = newPromise.id;
    }

    // 2. If PAID, mark any existing pending promise as FULFILLED and update loan outstanding
    if (data.outcomeType === "PAID" && data.amountCollected) {
      const pendingPromise = await db.promiseToPay.findFirst({
        where: { loanId: loan.id, status: { in: ["PENDING", "DUE_TODAY"] } },
        orderBy: { createdAt: "desc" },
      });

      if (pendingPromise) {
        await db.promiseToPay.update({
          where: { id: pendingPromise.id },
          data: {
            status: "FULFILLED",
            fulfilledDate: clientTime,
            fulfilledAmount: data.amountCollected,
          },
        });
      }

      const updatedOutstanding = Math.max(0, loan.outstandingAmount - data.amountCollected);
      await db.loan.update({
        where: { id: loan.id },
        data: {
          outstandingAmount: updatedOutstanding,
          lastPaymentDate: clientTime,
          lastPaymentAmount: data.amountCollected,
          status: updatedOutstanding === 0 ? "PAID_OFF" : loan.status,
        },
      });
    }

    // 3. Create the CollectionOutcome record
    const outcome = await db.collectionOutcome.create({
      data: {
        idempotencyKey: data.idempotencyKey,
        loanId: loan.id,
        officerId: user.id,
        outcomeType: data.outcomeType,
        amountCollected: data.amountCollected,
        paymentMode: data.paymentMode,
        receiptNumber: data.receiptNumber,
        promiseId: promiseRecordId,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        disputeReason: data.disputeReason,
        notes: data.notes,
        latitude: data.latitude,
        longitude: data.longitude,
        clientRecordedAt: clientTime,
      },
    });

    // 4. Create Audit Event
    await db.auditEvent.create({
      data: {
        loanId: loan.id,
        userId: user.id,
        action: `OUTCOME_${data.outcomeType}`,
        details: JSON.stringify({
          outcomeId: outcome.id,
          type: data.outcomeType,
          amount: data.amountCollected,
          promisedAmount: data.promisedAmount,
          promiseDate: data.promiseDate,
          notes: data.notes,
          gps: data.latitude ? `${data.latitude}, ${data.longitude}` : "N/A",
        }),
      },
    });

    // 5. Recompute AI Priority Score based on new state
    const latestPromise = await db.promiseToPay.findFirst({
      where: { loanId: loan.id },
      orderBy: { createdAt: "desc" },
    });

    const aiResult = calculatePriorityScore({
      loanId: loan.id,
      borrowerName: loan.borrower.name,
      dpd: loan.dpd,
      outstandingAmount: loan.outstandingAmount,
      totalMissedEmis: loan.totalMissedEmis,
      promiseStatus: latestPromise?.status as "BROKEN" | "DUE_TODAY" | "PENDING" | "FULFILLED" | "NONE" | undefined,
    });

    await db.loan.update({
      where: { id: loan.id },
      data: {
        priorityScore: aiResult.score,
        priorityCategory: aiResult.category,
        priorityReasons: JSON.stringify(aiResult.reasons),
      },
    });

    return NextResponse.json({
      success: true,
      outcomeId: outcome.id,
      recalculatedScore: aiResult.score,
    });
  } catch (err: unknown) {
    console.error("Outcome logging error:", err);
    return NextResponse.json(
      { error: "Failed to record collection outcome" },
      { status: 500 }
    );
  }
}
