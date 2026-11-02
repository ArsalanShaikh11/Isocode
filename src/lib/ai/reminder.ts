export interface ReminderTemplate {
  id: string;
  name: string;
  tone: "COURTEOUS_REMINDER" | "PROMISE_FOLLOWUP" | "URGENT_ROLL_PREVENTION";
  language: "EN" | "HI";
  templateText: string;
}

export const APPROVED_TEMPLATES: ReminderTemplate[] = [
  {
    id: "en-courteous-due",
    name: "General Overdue Notice (English)",
    tone: "COURTEOUS_REMINDER",
    language: "EN",
    templateText:
      "Dear {borrowerName}, your loan instalment of {emiAmount} for loan {loanId} is overdue ({dpd} days). Please contact your assigned officer {officerName} at {officerPhone} to discuss the payment status. Thank you. - Company A Indore",
  },
  {
    id: "en-promise-followup",
    name: "Promise to Pay Reminder (English)",
    tone: "PROMISE_FOLLOWUP",
    language: "EN",
    templateText:
      "Dear {borrowerName}, this is a gentle reminder regarding your commitment to clear {promisedAmount} towards loan {loanId} on {promiseDate}. Please contact {officerName} at {officerPhone} to confirm your payment mode. Regards, Company A Indore",
  },
  {
    id: "hi-courteous-due",
    name: "सामान्य अतिदेय सूचना (Hindi)",
    tone: "COURTEOUS_REMINDER",
    language: "HI",
    templateText:
      "प्रिय {borrowerName}, आपके ऋण {loanId} की मासिक किस्त {emiAmount} देय तिथि से {dpd} दिन अतिदेय है। कृपया भुगतान स्थिति पर चर्चा के लिए अपने फील्ड अधिकारी {officerName} से {officerPhone} पर संपर्क करें। धन्यवाद - कंपनी ए, इंदौर।",
  },
  {
    id: "hi-promise-followup",
    name: "वादा भुगतान अनुस्मारक (Hindi)",
    tone: "PROMISE_FOLLOWUP",
    language: "HI",
    templateText:
      "प्रिय {borrowerName}, ऋण {loanId} हेतु {promiseDate} को {promisedAmount} के भुगतान के आपके वादे के संदर्भ में यह एक विनम्र अनुस्मारक है। कृपया अपने अधिकारी {officerName} ({officerPhone}) से संपर्क कर भुगतान की पुष्टि करें। धन्यवाद - कंपनी ए, इंदौर।",
  },
];

// Prohibited words and phrases that breach RBI fair practices code (harassment, threats, police, legal seizures)
const PROHIBITED_WORDS = [
  "threat",
  "jail",
  "police",
  "arrest",
  "seize",
  "seizure",
  "confiscate",
  "defaulter list",
  "shame",
  "humiliate",
  "court warrant",
  "action against family",
  "criminal case",
  "fbi",
  "rbi penalty",
  "fraudster",
  "cheater",
  "चोर",
  "जेल",
  "पुलिस",
  "कुर्की",
  "बदनाम",
];

export interface ValidationCheckResult {
  isValid: boolean;
  blockedWordsFound: string[];
  reason?: string;
}

/**
 * Validates text against RBI Fair Practices Collections Policy
 */
export function validateMessageSafety(content: string): ValidationCheckResult {
  const lower = content.toLowerCase();
  const matched: string[] = [];

  for (const word of PROHIBITED_WORDS) {
    if (lower.includes(word.toLowerCase())) {
      matched.push(word);
    }
  }

  if (matched.length > 0) {
    return {
      isValid: false,
      blockedWordsFound: matched,
      reason: `Message contains prohibited or coercive terminology violating RBI Fair Practices: "${matched.join(", ")}"`,
    };
  }

  return {
    isValid: true,
    blockedWordsFound: [],
  };
}

export interface DraftReminderParams {
  templateId: string;
  borrowerName: string;
  loanId: string;
  outstandingAmount: number;
  emiAmount: number;
  dpd: number;
  officerName: string;
  officerPhone: string;
  promisedAmount?: number;
  promiseDate?: string;
}

export function draftReminder(params: DraftReminderParams): {
  messageContent: string;
  safetyCheck: ValidationCheckResult;
  template: ReminderTemplate;
} {
  const template =
    APPROVED_TEMPLATES.find((t) => t.id === params.templateId) || APPROVED_TEMPLATES[0];

  let message = template.templateText
    .replace("{borrowerName}", params.borrowerName)
    .replace("{loanId}", params.loanId)
    .replace("{outstandingAmount}", `₹${params.outstandingAmount.toLocaleString("en-IN")}`)
    .replace("{emiAmount}", `₹${params.emiAmount.toLocaleString("en-IN")}`)
    .replace("{dpd}", params.dpd.toString())
    .replace("{officerName}", params.officerName)
    .replace("{officerPhone}", params.officerPhone);

  if (params.promisedAmount) {
    message = message.replace(
      "{promisedAmount}",
      `₹${params.promisedAmount.toLocaleString("en-IN")}`
    );
  }
  if (params.promiseDate) {
    message = message.replace("{promiseDate}", params.promiseDate);
  }

  const safetyCheck = validateMessageSafety(message);

  return {
    messageContent: message,
    safetyCheck,
    template,
  };
}
