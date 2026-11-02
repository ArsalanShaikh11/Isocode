import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const {
      idempotencyKey,
      loanId,
      outcomeType,
      amountCollected,
      paymentMode,
      receiptNumber,
      promisedAmount,
      promiseDate,
      followUpDate,
      disputeReason,
      notes,
      latitude,
      longitude,
      clientRecordedAt,
    } = payload;

    if (!idempotencyKey || !loanId || !outcomeType) {
      return NextResponse.json(
        { error: "Missing required fields for sync" },
        { status: 400 }
      );
    }

    // Check if already synced previously
    const existing = await db.collectionOutcome.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      return NextResponse.json({
        synced: true,
        message: "Duplicate sync suppressed cleanly via idempotency key.",
        outcomeId: existing.id,
      });
    }

    const loan = await db.loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      return NextResponse.json(
        { error: "Target loan not found for synced outcome" },
        { status: 404 }
      );
    }

    const clientTime = clientRecordedAt ? new Date(clientRecordedAt) : new Date();

    let promiseRecordId: string | null = null;
    if (outcomeType === "PROMISE_TO_PAY" && promiseDate && promisedAmount) {
      const pDate = new Date(promiseDate);
      const newPromise = await db.promiseToPay.create({
        data: {
          loanId: loan.id,
          officerId: user.id,
          promisedAmount: Number(promisedAmount),
          promiseDate: pDate,
          status: pDate.toDateString() === new Date().toDateString() ? "DUE_TODAY" : "PENDING",
          notes: notes || "Created during offline field visit",
        },
      });
      promiseRecordId = newPromise.id;
    }

    if (outcomeType === "PAID" && amountCollected) {
      const amt = Number(amountCollected);
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
            fulfilledAmount: amt,
          },
        });
      }

      await db.loan.update({
        where: { id: loan.id },
        data: {
          outstandingAmount: Math.max(0, loan.outstandingAmount - amt),
          lastPaymentDate: clientTime,
          lastPaymentAmount: amt,
        },
      });
    }

    const outcome = await db.collectionOutcome.create({
      data: {
        idempotencyKey,
        loanId: loan.id,
        officerId: user.id,
        outcomeType,
        amountCollected: amountCollected ? Number(amountCollected) : null,
        paymentMode,
        receiptNumber,
        promiseId: promiseRecordId,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        disputeReason,
        notes,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        isOfflineSync: true,
        clientRecordedAt: clientTime,
      },
    });

    await db.auditEvent.create({
      data: {
        loanId: loan.id,
        userId: user.id,
        action: `OFFLINE_SYNC_${outcomeType}`,
        details: JSON.stringify({
          outcomeId: outcome.id,
          idempotencyKey,
          clientRecordedAt,
          serverReceivedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      synced: true,
      outcomeId: outcome.id,
    });
  } catch (err: unknown) {
    console.error("Offline sync endpoint error:", err);
    return NextResponse.json(
      { error: "Failed to sync offline record" },
      { status: 500 }
    );
  }
}
