import { describe, it, expect } from "vitest";
import {
  computeRollRateAnalytics,
  getDpdBucket,
  LoanMetricItem,
  PromiseMetricItem,
} from "../src/lib/analytics/roll-rate";

describe("Roll-Rate & Portfolio Analytics Engine", () => {
  it("should categorize DPD into standard regulatory buckets", () => {
    expect(getDpdBucket(5)).toBe("1-30");
    expect(getDpdBucket(30)).toBe("1-30");
    expect(getDpdBucket(31)).toBe("31-60");
    expect(getDpdBucket(60)).toBe("31-60");
    expect(getDpdBucket(61)).toBe("61-90");
    expect(getDpdBucket(95)).toBe("90+");
  });

  it("should calculate exact roll rates and broken promise percentages", () => {
    const mockLoans: LoanMetricItem[] = [
      {
        id: "L1",
        dpd: 15,
        dpdBucket: "1-30",
        outstandingAmount: 100000,
        disbursedAmount: 200000,
        branchId: "B1",
      },
      {
        id: "L2",
        dpd: 25,
        dpdBucket: "1-30",
        outstandingAmount: 200000,
        disbursedAmount: 400000,
        branchId: "B1",
      },
      {
        id: "L3",
        dpd: 45,
        dpdBucket: "31-60",
        outstandingAmount: 300000,
        disbursedAmount: 500000,
        branchId: "B1",
      },
      {
        id: "L4",
        dpd: 75,
        dpdBucket: "61-90",
        outstandingAmount: 400000,
        disbursedAmount: 600000,
        branchId: "B1",
      },
    ];

    const mockPromises: PromiseMetricItem[] = [
      {
        id: "P1",
        status: "BROKEN",
        promisedAmount: 25000,
        promiseDate: new Date(),
      },
      {
        id: "P2",
        status: "FULFILLED",
        promisedAmount: 30000,
        promiseDate: new Date(),
      },
      {
        id: "P3",
        status: "PENDING",
        promisedAmount: 15000,
        promiseDate: new Date(),
      },
    ];

    const analytics = computeRollRateAnalytics(mockLoans, mockPromises);

    expect(analytics.totalLoans).toBe(4);
    expect(analytics.totalOutstanding).toBe(1000000);
    expect(analytics.bucket1to30Count).toBe(2);
    expect(analytics.bucket31to60Count).toBe(1);
    // 1 / (2 + 1) = 33.3%
    expect(analytics.rollRate1to30To31to60Percent).toBe(33.3);
    expect(analytics.totalBrokenPromises).toBe(1);
    expect(analytics.totalFulfilledPromises).toBe(1);
    expect(analytics.promiseBrokenRatePercent).toBe(50);
  });
});

