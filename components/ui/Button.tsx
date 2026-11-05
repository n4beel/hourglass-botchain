"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost" | "danger" | "ladder";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, children, className = "", style, ...props }, ref) => {
    let bgStyle = "bg-[var(--accent)] text-[var(--accent-ink)] hover:brightness-110";
    if (variant === "ghost") bgStyle = "bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]";
    if (variant === "danger") bgStyle = "bg-transparent border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white";
    if (variant === "ladder") bgStyle = "bg-[#FFB347] text-[#0A1050] font-black shadow-lg hover:bg-[#FFA526]";

    let padStyle = "px-4 py-2 text-sm";
    if (size === "sm") padStyle = "px-2.5 py-1 text-xs";
    if (size === "lg") padStyle = "px-6 py-3 text-base font-bold";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${bgStyle} ${padStyle} ${className}`}
        style={style}
        {...props}
      >
        {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
