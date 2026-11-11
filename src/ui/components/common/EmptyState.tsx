import React from "react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
  ...props
}) => {
  return (
    <div className={`valet-empty-state ${className}`.trim()} {...props}>
      {icon && <div className="valet-empty-state-icon">{icon}</div>}
      <h4 className="valet-empty-state-title">{title}</h4>
      {description && <p className="valet-empty-state-description">{description}</p>}
      {action && <div className="valet-empty-state-action">{action}</div>}
    </div>
  );
};

