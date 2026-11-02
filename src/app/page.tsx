"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
  LayoutDashboard,
  Sparkles,
  WifiOff,
  Clock,
  FileSpreadsheet,
  CheckCircle2,
  Building2,
  ChevronRight,
} from "lucide-react";
import Lenis from "lenis";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  useEffect(() => {
    // Initialize Lenis for smooth scrolling on public marketing page
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F8F5] text-[#171918] selection:bg-[#EAF3EF] selection:text-[#176B4D]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#F8F8F5]/90 backdrop-blur-md border-b border-[#E2E4DE] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#176B4D] flex items-center justify-center text-white font-bold text-sm shadow-xs">
              CQ
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-[#171918]">
                CollectIQ
              </span>
              <span className="ml-2 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#E8E9E3] text-muted font-medium">
                Indore NBFC Pilot
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/sign-in"
              className="text-xs font-semibold text-[#171918] hover:text-[#176B4D] px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-in"
              className="px-4 py-2 bg-[#176B4D] hover:bg-[#12533B] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Launch Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E2E4DE] text-xs shadow-xs text-muted">
          <Building2 className="w-3.5 h-3.5 text-[#176B4D]" />
          <span>Tailored for Company A — RBI-Registered NBFC (Indore, MP)</span>
        </div>

        <h1 className="fluid-h1 font-bold text-[#171918] max-w-4xl mx-auto tracking-tight">
          Precision field collections.
          <br />
          <span className="text-[#176B4D]">Without Excel or WhatsApp.</span>
        </h1>

        <p className="text-sm md:text-base text-muted max-w-2xl mx-auto leading-relaxed">
          CollectIQ equips Indore field collection officers with explainable AI loan prioritisation, 3-tap outcome logging, IndexedDB offline persistence, and gives branch managers real-time roll-rate analytics.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/auth/sign-in"
            className="w-full sm:w-auto px-6 py-3 bg-[#176B4D] hover:bg-[#12533B] text-white font-semibold text-sm rounded-xl shadow-card transition-all flex items-center justify-center gap-2"
          >
            <span>Open Field Officer App</span>
            <Smartphone className="w-4 h-4" />
          </Link>

          <Link
            href="/auth/sign-in"
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-[#F2F3EE] text-[#171918] border border-[#D5D7CF] font-semibold text-sm rounded-xl shadow-card transition-all flex items-center justify-center gap-2"
          >
            <span>Open Branch Manager Terminal</span>
            <LayoutDashboard className="w-4 h-4 text-muted" />
          </Link>
        </div>
      </section>

      {/* Dual Roles Feature Cards */}
      <section className="py-16 px-6 max-w-6xl mx-auto space-y-12 border-t border-[#E2E4DE]">
        <div className="text-center space-y-2">
          <h2 className="fluid-h2 font-bold text-[#171918]">
            Two Purpose-Built Application Experiences
          </h2>
          <p className="text-xs text-muted max-w-lg mx-auto">
            Engineered around realistic NBFC operations: low-end Android phones in the field and high-density analytics in the branch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Role 1 Card */}
          <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-card p-6 space-y-4 hover:border-[#176B4D] transition-colors">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-[#EAF3EF] text-[#176B4D]">
                <Smartphone className="w-6 h-6" />
              </span>
              <span className="text-[11px] font-mono uppercase bg-[#F2F3EE] text-muted font-bold px-2.5 py-1 rounded-full">
                Role 1: Field Officer
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#171918]">
              Mobile-First Operational Route
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Designed for one-handed use on budget devices. Officers immediately see which borrowers to visit, the transparent reasons why, and log outcomes in approximately three taps.
            </p>

            <ul className="space-y-2 text-xs text-[#2D312E] pt-2 border-t border-[#F2F3EE]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <span>Explainable 0–100 AI priority score with top 3 explicit reasons</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <span>IndexedDB offline caching with automatic background retry & sync</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <span>Strict 8 AM – 7 PM IST calling window validation under RBI guidelines</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <span>AI reminder drafting in English & Hindi with anti-coercion filter</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/auth/sign-in"
                className="text-xs font-semibold text-[#176B4D] hover:underline flex items-center gap-1"
              >
                <span>Experience Field Officer UI</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Role 2 Card */}
          <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-card p-6 space-y-4 hover:border-[#176B4D] transition-colors">
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-xl bg-[#EAF3EF] text-[#176B4D]">
                <LayoutDashboard className="w-6 h-6" />
              </span>
              <span className="text-[11px] font-mono uppercase bg-[#F2F3EE] text-muted font-bold px-2.5 py-1 rounded-full">
                Role 2: Branch Manager
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#171918]">
              Live Portfolio & Roll-Rate Terminal
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Desktop-optimised dashboard calculating real migration rates from 1–30 DPD to 31–60 DPD (SMA-1) directly from database records, without Excel spreadsheets.
            </p>

            <ul className="space-y-2 text-xs text-[#2D312E] pt-2 border-t border-[#F2F3EE]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <span>Drag-and-drop CBS CSV upload with duplicate detection & preview</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <span>Automated loan assignment by branch pincode & officer workload</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <span>Supervisory priority override with full audit trail compliance</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <span>AI model backtesting report comparing priority bands against cure rates</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/auth/sign-in"
                className="text-xs font-semibold text-[#176B4D] hover:underline flex items-center gap-1"
              >
                <span>Experience Manager Terminal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Engineering Principles */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-[#E2E4DE] space-y-8">
        <div className="text-center space-y-2">
          <h2 className="fluid-h2 font-bold text-[#171918]">
            Architected for Regulatory & Operational Rigor
          </h2>
          <p className="text-xs text-muted max-w-lg mx-auto">
            Zero synthetic fluff. Built to withstand regulatory scrutiny and real-world connectivity disruptions in industrial corridors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 bg-white rounded-xl border border-[#E2E4DE] space-y-2 shadow-xs">
            <Sparkles className="w-5 h-5 text-[#176B4D]" />
            <h4 className="font-bold text-sm text-[#171918]">
              Transparent, Explainable AI
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              No black-box hallucination. Explicit scoring weights based on DPD vintage, broken promise history, and exposure with plain-language reasons.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-[#E2E4DE] space-y-2 shadow-xs">
            <WifiOff className="w-5 h-5 text-[#176B4D]" />
            <h4 className="font-bold text-sm text-[#171918]">
              Full Offline Resilience
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              IndexedDB offline queue with cryptographic idempotency keys prevents duplicate entries when field officers sync after poor connectivity.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-[#E2E4DE] space-y-2 shadow-xs">
            <Clock className="w-5 h-5 text-[#176B4D]" />
            <h4 className="font-bold text-sm text-[#171918]">
              RBI Contact Restrictions
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Client & server verification enforces the strict 8 AM – 7 PM IST calling boundary. Contact attempts outside the window are cleanly blocked and audited.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#E2E4DE] bg-white text-xs text-muted">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#176B4D] flex items-center justify-center text-white font-bold text-xs">
              CQ
            </div>
            <span className="font-semibold text-[#171918]">CollectIQ</span>
            <span>— Fintech Field Operations Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Indore Region NBFC Pilot</span>
            <span>•</span>
            <Link href="/auth/sign-in" className="text-[#176B4D] hover:underline font-semibold">
              Demo Access
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
