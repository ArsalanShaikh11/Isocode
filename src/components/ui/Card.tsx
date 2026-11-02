import React from "react";
import { clsx } from "clsx";

export function Card({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-white rounded-xl border border-[#E2E4DE] shadow-card transition-all",
        onClick && "cursor-pointer hover:border-[#C5C8BD] active:scale-[0.99]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "px-5 py-4 border-b border-[#EBECE7] flex items-center justify-between",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={clsx("p-5", className)}>{children}</div>;
}
