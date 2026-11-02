/**
 * Contact Time Restrictions Module
 * Regulatory Compliance: Reserve Bank of India (RBI) Fair Practices Code
 * Prohibits borrower contact before 08:00 AM IST and after 07:00 PM (19:00) IST.
 */

export interface ContactWindowStatus {
  isWithinWindow: boolean;
  currentIstTime: string;
  currentIstHour: number;
  currentIstMinute: number;
  windowStart: string; // "08:00 AM IST"
  windowEnd: string;   // "07:00 PM IST"
  reason?: string;
}

/**
 * Returns the current time decomposed in Asia/Kolkata (IST = UTC+5:30)
 */
export function getIstDateTime(simulatedDate?: Date): {
  date: Date;
  hour: number;
  minute: number;
  formattedTime: string;
} {
  const baseDate = simulatedDate || new Date();

  // Convert to IST using Intl
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(baseDate);
  const hourPart = parts.find((p) => p.type === "hour")?.value || "0";
  const minutePart = parts.find((p) => p.type === "minute")?.value || "0";

  const hour = parseInt(hourPart, 10);
  const minute = parseInt(minutePart, 10);

  const displayFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return {
    date: baseDate,
    hour,
    minute,
    formattedTime: `${displayFormatter.format(baseDate)} IST`,
  };
}

/**
 * Checks if the given date or current time is strictly within 08:00 and 19:00 IST.
 * Allows an optional bypass flag for demonstration / testing purposes.
 */
export function checkContactWindow(
  options: {
    customDate?: Date;
    simulationBypass?: boolean;
  } = {}
): ContactWindowStatus {
  const { customDate, simulationBypass } = options;

  if (simulationBypass) {
    return {
      isWithinWindow: true,
      currentIstTime: "Simulation Bypass Active (02:30 PM IST)",
      currentIstHour: 14,
      currentIstMinute: 30,
      windowStart: "08:00 AM IST",
      windowEnd: "07:00 PM IST",
    };
  }

  const { hour, minute, formattedTime } = getIstDateTime(customDate);

  // 8 AM to 7 PM IST: hour must be >= 8 and < 19
  const isWithin = hour >= 8 && hour < 19;

  let reason = "";
  if (!isWithin) {
    if (hour < 8) {
      reason = `Borrower contact is strictly prohibited before 08:00 AM IST under RBI Fair Practices guidelines. Current time: ${formattedTime}. Contact window opens at 08:00 AM.`;
    } else {
      reason = `Borrower contact is strictly prohibited after 07:00 PM IST under RBI Fair Practices guidelines. Current time: ${formattedTime}. Contact window re-opens tomorrow at 08:00 AM.`;
    }
  }

  return {
    isWithinWindow: isWithin,
    currentIstTime: formattedTime,
    currentIstHour: hour,
    currentIstMinute: minute,
    windowStart: "08:00 AM IST",
    windowEnd: "07:00 PM IST",
    reason: isWithin ? undefined : reason,
  };
}
