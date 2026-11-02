"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, UserCheck, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (targetEmail: string, targetPass: string = "Password@123") => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed. Please check credentials.");
        setIsLoading(false);
        return;
      }

      if (data.user?.role === "MANAGER") {
        router.push("/manager");
      } else {
        router.push("/officer");
      }
      router.refresh();
    } catch {
      setErrorMessage("Network error connecting to authentication service.");
      setIsLoading(false);
    }
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Please enter your registered NBFC email address.");
      return;
    }
    handleLogin(email, password || "Password@123");
  };

  return (
    <div className="min-h-screen bg-[#F8F8F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#176B4D] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            CQ
          </div>
          <span className="text-2xl font-semibold tracking-tight text-[#171918]">
            CollectIQ
          </span>
        </div>
        <p className="text-center text-xs text-muted max-w-xs mx-auto">
          AI-Assisted Field Collections Platform for RBI-Registered NBFCs
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-[#E2E4DE] shadow-card">
          <form className="space-y-4" onSubmit={submitForm}>
            {errorMessage && (
              <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FECACA] text-xs text-[#7F1D1D] font-medium">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#171918] mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@collectiq.in"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E4DE] text-sm text-[#171918] bg-white placeholder-[#9DA09B] focus:outline-none focus:ring-2 focus:ring-[#176B4D] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#171918] mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E4DE] text-sm text-[#171918] bg-white placeholder-[#9DA09B] focus:outline-none focus:ring-2 focus:ring-[#176B4D] focus:border-transparent transition-all"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2 font-medium"
            >
              Sign In to Terminal
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Quick Demo Access Options */}
          <div className="mt-6 pt-6 border-t border-[#EBECE7]">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wider text-center mb-3">
              One-Click Evaluation Access
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  handleLogin("rahul.chouhan@collectiq.in", "Password@123")
                }
                disabled={isLoading}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-[#D5D7CF] hover:border-[#176B4D] bg-[#F8F8F5] hover:bg-[#EAF3EF] transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E4DE] flex items-center justify-center text-[#176B4D] group-hover:border-[#176B4D]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#171918]">
                      Rahul Chouhan (Field Officer)
                    </p>
                    <p className="text-[11px] text-muted">
                      Mobile-first priority visits, offline logging & promises
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-[#176B4D] transition-colors" />
              </button>

              <button
                type="button"
                onClick={() =>
                  handleLogin("anand.verma@collectiq.in", "Password@123")
                }
                disabled={isLoading}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-[#D5D7CF] hover:border-[#176B4D] bg-[#F8F8F5] hover:bg-[#EAF3EF] transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E4DE] flex items-center justify-center text-[#176B4D] group-hover:border-[#176B4D]">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#171918]">
                      Anand Verma (Branch Manager)
                    </p>
                    <p className="text-[11px] text-muted">
                      Portfolio roll-rates, CSV import & AI overrides
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-[#176B4D] transition-colors" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-[#176B4D]" />
            <span>Company A Indore NBFC — RBI Regulatory Sandbox Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
}

