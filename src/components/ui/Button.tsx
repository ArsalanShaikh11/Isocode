import React from "react";
import { clsx } from "clsx";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#176B4D] focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs h-8 gap-1.5",
      md: "px-4 py-2 text-sm h-10 gap-2",
      lg: "px-5 py-2.5 text-base h-12 gap-2.5 font-medium",
    };

    const variantStyles = {
      primary:
        "bg-[#176B4D] text-white hover:bg-[#12533B] border border-[#12533B] shadow-sm",
      secondary:
        "bg-[#E8E9E3] text-[#171918] hover:bg-[#DEDFD7] border border-[#D5D7CF]",
      outline:
        "bg-white text-[#171918] hover:bg-[#F2F3EE] border border-[#E2E4DE] shadow-xs",
      danger:
        "bg-[#B91C1C] text-white hover:bg-[#991B1B] border border-[#7F1D1D]",
      ghost:
        "bg-transparent text-[#171918] hover:bg-[#E8E9E3]/50 border-transparent",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          base,
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

