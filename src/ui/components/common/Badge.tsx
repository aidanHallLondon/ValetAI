import React from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  size = "md",
  dot = false,
  icon,
  children,
  className = "",
  ...props
}) => {
  const variantClass = `valet-badge-${variant}`;
  const sizeClass = `valet-badge-${size}`;

  return (
    <span
      className={`valet-badge ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {dot && <span className="valet-badge-dot" aria-hidden="true" />}
      {icon && <span className="valet-badge-icon">{icon}</span>}
      {children}
    </span>
  );
};

