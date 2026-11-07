export interface LoanMetricItem {
  id: string;
  dpd: number;
  dpdBucket: string;
  outstandingAmount: number;
  disbursedAmount: number;
  branchId: string;
  branchName?: string;
  assignedOfficerId?: string | null;
  assignedOfficerName?: string | null;
}

export interface PromiseMetricItem {
  id: string;
  status: string;
  promisedAmount: number;
  promiseDate: Date;
  fulfilledAmount?: number | null;
}

export interface RollRateSummary {
  totalLoans: number;
  totalOutstanding: number;
  bucket1to30Count: number;
  bucket1to30Volume: number;
  bucket31to60Count: number;
  bucket31to60Volume: number;
  bucket61to90Count: number;
  bucket61to90Volume: number;
  bucket90PlusCount: number;
  bucket90PlusVolume: number;
  // Roll rate calculation: ratio of loans in 31-60 DPD vs (1-30 DPD + 31-60 DPD)
  rollRate1to30To31to60Percent: number;
  totalBrokenPromises: number;
  totalPendingPromises: number;
  totalFulfilledPromises: number;
  promiseBrokenRatePercent: number;
}

/**
 * Calculates DPD bucket assignments from raw DPD
 */
export function getDpdBucket(dpd: number): "1-30" | "31-60" | "61-90" | "90+" {
  if (dpd <= 30) return "1-30";
  if (dpd <= 60) return "31-60";
  if (dpd <= 90) return "61-90";
  return "90+";
}

/**
 * Computes portfolio roll-rates and key collections metrics
 */
export function computeRollRateAnalytics(
  loans: LoanMetricItem[],
  promises: PromiseMetricItem[]
): RollRateSummary {
  let totalOutstanding = 0;
  let b1Count = 0;
  let b1Vol = 0;
  let b2Count = 0;
  let b2Vol = 0;
  let b3Count = 0;
  let b3Vol = 0;
  let b4Count = 0;
  let b4Vol = 0;

  for (const loan of loans) {
    totalOutstanding += loan.outstandingAmount;
    const bucket = getDpdBucket(loan.dpd);

    if (bucket === "1-30") {
      b1Count++;
      b1Vol += loan.outstandingAmount;
    } else if (bucket === "31-60") {
      b2Count++;
      b2Vol += loan.outstandingAmount;
    } else if (bucket === "61-90") {
      b3Count++;
      b3Vol += loan.outstandingAmount;
    } else {
      b4Count++;
      b4Vol += loan.outstandingAmount;
    }
  }

  // Roll Rate formula for 1-30 to 31-60 transition proxy:
  // (31-60 count / (1-30 count + 31-60 count)) * 100
  const combinedEarlyVintage = b1Count + b2Count;
  const rollRate =
    combinedEarlyVintage > 0 ? (b2Count / combinedEarlyVintage) * 100 : 0;

  let brokenCount = 0;
  let pendingCount = 0;
  let fulfilledCount = 0;

  for (const p of promises) {
    if (p.status === "BROKEN") brokenCount++;
    else if (p.status === "FULFILLED") fulfilledCount++;
    else pendingCount++;
  }

  const totalDecidedPromises = brokenCount + fulfilledCount;
  const promiseBrokenRate =
    totalDecidedPromises > 0 ? (brokenCount / totalDecidedPromises) * 100 : 0;

  return {
    totalLoans: loans.length,
    totalOutstanding,
    bucket1to30Count: b1Count,
    bucket1to30Volume: b1Vol,
    bucket31to60Count: b2Count,
    bucket31to60Volume: b2Vol,
    bucket61to90Count: b3Count,
    bucket61to90Volume: b3Vol,
    bucket90PlusCount: b4Count,
    bucket90PlusVolume: b4Vol,
    rollRate1to30To31to60Percent: Number(rollRate.toFixed(1)),
    totalBrokenPromises: brokenCount,
    totalPendingPromises: pendingCount,
    totalFulfilledPromises: fulfilledCount,
    promiseBrokenRatePercent: Number(promiseBrokenRate.toFixed(1)),
  };
}

