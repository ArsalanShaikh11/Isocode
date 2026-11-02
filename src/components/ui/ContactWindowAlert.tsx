"use client";

import React, { useEffect, useState } from "react";
import { Clock, ShieldAlert, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import { checkContactWindow, ContactWindowStatus } from "@/lib/contact-window";

export function ContactWindowAlert({
  simulationBypass,
  onToggleSimulation,
}: {
  simulationBypass: boolean;
  onToggleSimulation: (val: boolean) => void;
}) {
  const [status, setStatus] = useState<ContactWindowStatus | null>(null);

  useEffect(() => {
    const update = () => {
      setStatus(checkContactWindow({ simulationBypass }));
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [simulationBypass]);

  if (!status) return null;

  return (
    <div
      className={`px-4 py-2.5 rounded-lg border text-xs transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-2 ${
        status.isWithinWindow
          ? "bg-[#F2F7F4] border-[#D1E6DC] text-[#176B4D]"
          : "bg-[#FEF3C7] border-[#FDE68A] text-[#78350F]"
      }`}
    >
      <div className="flex items-center gap-2">
        {status.isWithinWindow ? (
          <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0" />
        ) : (
          <ShieldAlert className="w-4 h-4 text-[#B45309] shrink-0" />
        )}
        <div>
          <span className="font-semibold">
            {status.isWithinWindow
              ? "Borrower Contact Window Active"
              : "Borrower Contact Window Restricted"}
          </span>
          <span className="mx-1.5 opacity-60">•</span>
          <span className="font-mono">{status.currentIstTime}</span>
          <span className="mx-1.5 opacity-60">•</span>
          <span className="opacity-90">
            {status.isWithinWindow
              ? "8:00 AM – 7:00 PM IST (Permitted under RBI Fair Practices)"
              : status.reason || "Calls and outbound reminders restricted outside 8 AM - 7 PM IST."}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
        <span className="text-[11px] opacity-80">Demo Simulation:</span>
        <button
          onClick={() => onToggleSimulation(!simulationBypass)}
          className="flex items-center gap-1 font-medium text-[11px] hover:underline"
          title="Toggle contact window simulation for testing outside 8 AM - 7 PM IST"
        >
          {simulationBypass ? (
            <span className="text-[#176B4D] flex items-center gap-1">
              <ToggleRight className="w-4 h-4 text-[#176B4D]" /> Day Mode
            </span>
          ) : (
            <span className="text-muted flex items-center gap-1">
              <ToggleLeft className="w-4 h-4" /> Live Clock
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

