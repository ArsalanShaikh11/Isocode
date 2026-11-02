import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import {
  validateCsvRows,
  autoAssignByPincodeAndWorkload,
  OfficerCandidate,
} from "@/lib/validation/csv-import";
import { calculatePriorityScore } from "@/lib/ai/prioritisation";
import { getDpdBucket } from "@/lib/analytics/roll-rate";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "MANAGER") {
      return NextResponse.json(
        { error: "Forbidden: Only Branch Managers may import and assign loans" },
        { status: 403 }
      );
    }

    const { rawRows, commit, autoAssign } = await req.json();

    if (!Array.isArray(rawRows) || rawRows.length === 0) {
      return NextResponse.json(
        { error: "No CSV row data received" },
        { status: 400 }
      );
    }

    // Retrieve existing Loan IDs to detect duplicates
    const existingLoans = await db.loan.findMany({ select: { id: true } });
    const existingIds = new Set(existingLoans.map((l) => l.id));

    // Validate CSV rows
    const analysis = validateCsvRows(rawRows, existingIds);

    // Retrieve active officers and their assigned branches/pincodes for auto-assignment
    const dbOfficers = await db.user.findMany({
      where: { role: "OFFICER", active: true },
      include: {
        branch: true,
        assignedLoans: { select: { id: true } },
      },
    });

    const officerCandidates: OfficerCandidate[] = dbOfficers.map((off) => ({
      id: off.id,
      name: off.name,
      email: off.email,
      pincodes: off.branch?.pincodes.split(",").map((p) => p.trim()) || [],
      currentAssignedCount: off.assignedLoans.length,
    }));

    // Generate assignment plan
    const previewAssignments = analysis.validRows.map((row) => {
      const data = row.data;
      const pincode = data.pincode || "452001";
      const candidate = autoAssign
        ? autoAssignByPincodeAndWorkload(pincode, officerCandidates)
        : null;

      // Temporary update local officer workload for round-robin assignment during preview
      if (candidate) {
        candidate.currentAssignedCount++;
      }

      const scoreResult = calculatePriorityScore({
        loanId: data.loanId || "PREVIEW",
        borrowerName: data.borrowerName || "Borrower",
        dpd: data.dpd || 0,
        outstandingAmount: data.outstandingAmount || 0,
        totalMissedEmis: 1,
        promiseStatus: "NONE",
      });

      return {
        ...data,
        assignedOfficerId: candidate?.id || null,
        assignedOfficerName: candidate?.name || "Unassigned",
        predictedPriorityScore: scoreResult.score,
        predictedCategory: scoreResult.category,
        priorityReasons: scoreResult.reasons,
      };
    });

    // If commit is false, return preview analysis
    if (!commit) {
      return NextResponse.json({
        success: true,
        isDryRun: true,
        summary: {
          totalRows: analysis.totalRows,
          validCount: analysis.validRows.length,
          invalidCount: analysis.invalidRows.length,
          duplicateCount: analysis.duplicateCount,
          hasRequiredColumns: analysis.hasRequiredColumns,
          missingColumns: analysis.missingColumns,
        },
        previewRows: previewAssignments,
        invalidRows: analysis.invalidRows,
      });
    }

    // Commit valid rows to database
    const defaultBranch =
      (await db.branch.findFirst()) ||
      (await db.branch.create({
        data: {
          code: "IND-DEF",
          name: "Indore Central",
          city: "Indore",
          state: "Madhya Pradesh",
          pincodes: "452001",
        },
      }));

    let committedCount = 0;

    for (const item of previewAssignments) {
      if (!item.loanId || !item.borrowerName || !item.outstandingAmount) continue;

      // 1. Create or find Borrower
      const borrower = await db.borrower.create({
        data: {
          name: item.borrowerName,
          businessType: item.businessType || "Trading & Services",
          phone: item.phone || "9826011222",
          address: `Indore Location, Pincode ${item.pincode}`,
          pincode: item.pincode || "452001",
        },
      });

      // 2. Resolve Branch
      const branch =
        (await db.branch.findFirst({
          where: {
            OR: [
              { name: { contains: item.branch || "" } },
              { code: item.branch || "" },
            ],
          },
        })) || defaultBranch;

      // 3. Create Loan
      await db.loan.create({
        data: {
          id: item.loanId,
          borrowerId: borrower.id,
          branchId: branch.id,
          assignedOfficerId: item.assignedOfficerId,
          disbursedAmount: item.outstandingAmount * 1.5,
          outstandingAmount: item.outstandingAmount,
          dpd: item.dpd || 0,
          dpdBucket: getDpdBucket(item.dpd || 0),
          emiAmount: Math.round(item.outstandingAmount / 12),
          totalMissedEmis: Math.max(1, Math.floor((item.dpd || 0) / 30)),
          priorityScore: item.predictedPriorityScore,
          priorityCategory: item.predictedCategory,
          priorityReasons: JSON.stringify(item.priorityReasons),
        },
      });

      committedCount++;
    }

    // Audit Event
    await db.auditEvent.create({
      data: {
        userId: user.id,
        action: "CSV_IMPORT_COMMITTED",
        details: JSON.stringify({
          totalProcessed: analysis.totalRows,
          committedCount,
          duplicatesSkipped: analysis.duplicateCount,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      isDryRun: false,
      message: `Successfully imported ${committedCount} loans into CollectIQ.`,
      committedCount,
      skippedDuplicates: analysis.duplicateCount,
    });
  } catch (err: unknown) {
    console.error("CSV import error:", err);
    return NextResponse.json(
      { error: "Failed to process CSV import" },
      { status: 500 }
    );
  }
}

