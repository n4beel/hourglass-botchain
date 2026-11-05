import { HTMLAttributes } from "react";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  noPadding?: boolean;
  glassStyle?: boolean;
}

export default function Panel({
  elevated,
  noPadding,
  glassStyle,
  children,
  className = "",
  style,
  ...props
}: PanelProps) {
  return (
    <div
      className={["rounded-sm relative", noPadding ? "" : "p-5 md:p-6", className].join(" ")}
      style={{
        background: elevated ? "var(--bg-elevated)" : "var(--bg-surface)",
        border: glassStyle ? "1px solid var(--accent)" : "1px solid var(--border-default)",
        boxShadow: glassStyle ? "0 4px 20px rgba(0,0,0,0.25)" : "none",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
