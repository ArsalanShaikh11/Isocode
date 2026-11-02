import { describe, it, expect } from "vitest";
import { checkContactWindow, getIstDateTime } from "../src/lib/contact-window";

describe("Contact Time Restrictions (8 AM - 7 PM IST)", () => {
  it("should permit contact at 10:30 AM IST", () => {
    // 10:30 AM IST = 05:00 UTC
    const dateAt1030AmIst = new Date("2026-11-02T05:00:00Z");
    const status = checkContactWindow({ customDate: dateAt1030AmIst });

    expect(status.isWithinWindow).toBe(true);
    expect(status.currentIstHour).toBe(10);
    expect(status.reason).toBeUndefined();
  });

  it("should block contact at 07:15 AM IST (before 8 AM)", () => {
    // 07:15 AM IST = 01:45 UTC
    const earlyMorning = new Date("2026-11-02T01:45:00Z");
    const status = checkContactWindow({ customDate: earlyMorning });

    expect(status.isWithinWindow).toBe(false);
    expect(status.currentIstHour).toBe(7);
    expect(status.reason).toContain("strictly prohibited before 08:00 AM IST");
  });

  it("should block contact at 08:00 PM (20:00) IST (after 7 PM)", () => {
    // 08:00 PM IST = 14:30 UTC
    const nightTime = new Date("2026-11-02T14:30:00Z");
    const status = checkContactWindow({ customDate: nightTime });

    expect(status.isWithinWindow).toBe(false);
    expect(status.currentIstHour).toBe(20);
    expect(status.reason).toContain("strictly prohibited after 07:00 PM IST");
  });

  it("should support simulation bypass for development and demo evaluations", () => {
    const nightTime = new Date("2026-11-02T14:30:00Z");
    const status = checkContactWindow({
      customDate: nightTime,
      simulationBypass: true,
    });

    expect(status.isWithinWindow).toBe(true);
    expect(status.currentIstTime).toContain("Simulation Bypass Active");
  });
});
