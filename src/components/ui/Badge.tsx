import React from "react";
import { clsx } from "clsx";

export interface BadgeProps {
  variant?:
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "critical"
    | "neutral"
    | "outline";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  size = "md",
  children,
  className,
}: BadgeProps) {
  const base =
    "inline-flex items-center font-medium rounded-full tracking-tight transition-colors";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] leading-tight",
    md: "px-2.5 py-1 text-xs leading-none",
  };

  const variantStyles = {
    default: "bg-[#E8E9E3] text-[#171918] border border-[#E2E4DE]",
    primary: "bg-[#EAF3EF] text-[#176B4D] border border-[#CDE3D9]",
    success: "bg-[#DCFCE7] text-[#14532D] border border-[#BBF7D0]",
    warning: "bg-[#FEF3C7] text-[#78350F] border border-[#FDE68A]",
    critical: "bg-[#FEE2E2] text-[#7F1D1D] border border-[#FECACA]",
    neutral: "bg-surface text-muted border border-border",
    outline: "bg-transparent text-foreground border border-border",
  };

  return (
    <span
      className={clsx(base, sizeStyles[size], variantStyles[variant], className)}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({
  score,
  category,
}: {
  score: number;
  category?: string;
}) {
  let variant: BadgeProps["variant"] = "neutral";
  const cat = category || (score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW");

  if (cat === "CRITICAL") variant = "critical";
  else if (cat === "HIGH") variant = "warning";
  else if (cat === "MEDIUM") variant = "primary";
  else variant = "neutral";

  return (
    <Badge variant={variant} size="sm">
      <span className="font-semibold mr-1">{score}</span>
      <span className="text-[10px] uppercase font-mono tracking-wider opacity-80">
        {cat}
      </span>
    </Badge>
  );
}

export function PromiseStatusBadge({ status }: { status: string }) {
  if (status === "BROKEN") {
    return <Badge variant="critical" size="sm">Broken Promise</Badge>;
  }
  if (status === "DUE_TODAY") {
    return <Badge variant="warning" size="sm">Promise Due Today</Badge>;
  }
  if (status === "FULFILLED") {
    return <Badge variant="success" size="sm">Fulfilled</Badge>;
  }
  if (status === "PENDING") {
    return <Badge variant="neutral" size="sm">Promise Pending</Badge>;
  }
  return null;
}

