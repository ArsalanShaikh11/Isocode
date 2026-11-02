export interface PrioritisationInput {
  loanId: string;
  borrowerName: string;
  dpd: number;
  outstandingAmount: number;
  totalMissedEmis: number;
  lastPaymentDate?: Date | null;
  lastPaymentAmount?: number | null;
  promiseStatus?: "BROKEN" | "DUE_TODAY" | "PENDING" | "FULFILLED" | "NONE";
  promiseDate?: Date | null;
  daysSinceLastContact?: number;
  historicalOutcomesCount?: number;
}

export interface ScoreComponent {
  factor: string;
  points: number;
  maxPoints: number;
  reason: string;
}

export interface PrioritisationResult {
  score: number; // 0 - 100
  category: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
  components: ScoreComponent[];
  hasLimitedEvidence: boolean;
  advisoryNote: string;
}

/**
 * Format Indian Rupees into human-friendly Lakh / Crore strings
 */
export function formatLakhs(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} lakh`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Explainable AI Prioritisation Engine for NBFC Field Collections
 *
 * Scoring methodology (Total 100 Points max):
 * 1. Broken / Due Promise Impact (Max 30 pts)
 * 2. DPD Roll-Rate Risk Velocity (Max 30 pts)
 * 3. Outstanding Exposure (Max 25 pts)
 * 4. Payment Default & Missed EMIs (Max 15 pts)
 */
export function calculatePriorityScore(input: PrioritisationInput): PrioritisationResult {
  const components: ScoreComponent[] = [];

  // 1. Promise Status Evaluation (Max 30)
  let promisePoints = 0;
  let promiseReason = "";

  if (input.promiseStatus === "BROKEN") {
    promisePoints = 30;
    promiseReason = "Previously broken promise to pay.";
  } else if (input.promiseStatus === "DUE_TODAY") {
    promisePoints = 26;
    promiseReason = "Promise to pay is due today.";
  } else if (input.promiseStatus === "PENDING") {
    promisePoints = 12;
    promiseReason = "Active promise to pay pending verification.";
  } else if (input.promiseStatus === "FULFILLED") {
    promisePoints = 0;
    promiseReason = "Recent payment commitment fulfilled successfully.";
  } else {
    promisePoints = 4;
    promiseReason = "No active promise recorded.";
  }
  components.push({
    factor: "Promise Integrity",
    points: promisePoints,
    maxPoints: 30,
    reason: promiseReason,
  });

  // 2. DPD Roll-Risk Velocity (Max 30)
  // Higher risk when approaching 30-day (SMA-1) or 60-day (SMA-2) regulatory roll boundaries
  let dpdPoints = 0;
  let dpdReason = "";

  if (input.dpd === 0) {
    dpdPoints = 0;
    dpdReason = "Account cured — 0 DPD (current on payments).";
  } else if (input.dpd >= 15 && input.dpd <= 30) {
    dpdPoints = 28;
    dpdReason = `Loan is ${input.dpd} days past due, nearing roll into 31-60 DPD bucket.`;
  } else if (input.dpd >= 50 && input.dpd <= 60) {
    dpdPoints = 30;
    dpdReason = `Loan is ${input.dpd} days past due, critical roll risk to SMA-2.`;
  } else if (input.dpd > 60) {
    dpdPoints = 26;
    dpdReason = `High overdue vintage at ${input.dpd} DPD.`;
  } else if (input.dpd >= 10 && input.dpd < 15) {
    dpdPoints = 20;
    dpdReason = `Loan is ${input.dpd} days past due.`;
  } else if (input.dpd > 0) {
    dpdPoints = 10;
    dpdReason = `Early stage delinquency of ${input.dpd} DPD.`;
  } else {
    dpdPoints = 0;
    dpdReason = "Current on payments.";
  }
  components.push({
    factor: "Delinquency Stage (DPD)",
    points: dpdPoints,
    maxPoints: 30,
    reason: dpdReason,
  });

  // 3. Outstanding Exposure (Max 25)
  let exposurePoints = 0;
  let exposureReason = "";

  const formattedAmount = formatLakhs(input.outstandingAmount);
  if (input.outstandingAmount >= 500000) {
    exposurePoints = 25;
    exposureReason = `High portfolio exposure of ${formattedAmount}.`;
  } else if (input.outstandingAmount >= 200000) {
    exposurePoints = 18;
    exposureReason = `Outstanding amount is ${formattedAmount}.`;
  } else if (input.outstandingAmount >= 100000) {
    exposurePoints = 12;
    exposureReason = `Outstanding balance of ${formattedAmount}.`;
  } else {
    exposurePoints = 6;
    exposureReason = `Manageable exposure of ${formattedAmount}.`;
  }
  components.push({
    factor: "Outstanding Exposure",
    points: exposurePoints,
    maxPoints: 25,
    reason: exposureReason,
  });

  // 4. Default Track & Missed EMIs (Max 15)
  let historyPoints = 0;
  let historyReason = "";

  if (input.totalMissedEmis >= 3) {
    historyPoints = 15;
    historyReason = `Persistent default with ${input.totalMissedEmis} missed monthly EMIs.`;
  } else if (input.totalMissedEmis === 2) {
    historyPoints = 10;
    historyReason = "Two consecutive missed EMIs.";
  } else if (input.totalMissedEmis === 1) {
    historyPoints = 6;
    historyReason = "Single missed EMI instalment.";
  } else {
    historyPoints = 0;
    historyReason = "All overdue monthly instalments cleared.";
  }
  components.push({
    factor: "Repayment Track Record",
    points: historyPoints,
    maxPoints: 15,
    reason: historyReason,
  });

  // Total raw score (clamped between 0 and 100)
  const rawScore = components.reduce((sum, c) => sum + c.points, 0);
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Categorisation
  let category: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  if (score >= 80) category = "CRITICAL";
  else if (score >= 60) category = "HIGH";
  else if (score >= 40) category = "MEDIUM";
  else category = "LOW";

  // Select top 3 distinct reasons sorted by point contribution
  const sortedComponents = [...components].sort((a, b) => b.points - a.points);
  const reasons = sortedComponents.slice(0, 3).map((c) => c.reason);

  // Limited evidence assessment
  const hasLimitedEvidence =
    input.historicalOutcomesCount !== undefined && input.historicalOutcomesCount <= 1;

  const advisoryNote =
    "Advisory AI priority metric. Intended solely for route planning and daily field scheduling. Must not be used for automatic legal notices or denial of service.";

  return {
    score,
    category,
    reasons,
    components,
    hasLimitedEvidence,
    advisoryNote,
  };
}
