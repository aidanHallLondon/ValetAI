import React from "react";

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  className = "",
  ...props
}) => {
  return (
    <div className={`valet-metric-card ${className}`.trim()} {...props}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="valet-metric-label">{label}</span>
        {icon && <span>{icon}</span>}
      </div>
      <div className="valet-metric-value">{value}</div>
      {subtext && <span className="valet-metric-subtext">{subtext}</span>}
    </div>
  );
};

