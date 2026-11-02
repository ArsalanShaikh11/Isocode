import { describe, it, expect } from "vitest";
import {
  draftReminder,
  validateMessageSafety,
} from "../src/lib/ai/reminder";

describe("AI Reminder Drafting & Safety Policy", () => {
  it("should generate polite English reminder with dynamic placeholders", () => {
    const result = draftReminder({
      templateId: "en-courteous-due",
      borrowerName: "Company B (packaging unit)",
      loanId: "LN-10293",
      outstandingAmount: 640000,
      emiAmount: 48500,
      dpd: 12,
      officerName: "Rahul Chouhan",
      officerPhone: "+91 98260 11234",
    });

    expect(result.messageContent).toContain("Company B (packaging unit)");
    expect(result.messageContent).toContain("LN-10293");
    expect(result.messageContent).toContain("Rahul Chouhan");
    expect(result.safetyCheck.isValid).toBe(true);
  });

  it("should generate polite Hindi reminder with correct grammar and tone", () => {
    const result = draftReminder({
      templateId: "hi-courteous-due",
      borrowerName: "कंपनी बी",
      loanId: "LN-10293",
      outstandingAmount: 640000,
      emiAmount: 48500,
      dpd: 12,
      officerName: "राहुल चौहान",
      officerPhone: "+91 98260 11234",
    });

    expect(result.messageContent).toContain("कंपनी बी");
    expect(result.messageContent).toContain("मासिक किस्त");
    expect(result.safetyCheck.isValid).toBe(true);
  });

  it("should reject messages containing coercive or threatening words", () => {
    const unsafeText = "Pay your EMI immediately or we will send police and seize your assets at factory";
    const check = validateMessageSafety(unsafeText);

    expect(check.isValid).toBe(false);
    expect(check.blockedWordsFound).toContain("police");
    expect(check.blockedWordsFound).toContain("seize");
  });
});

