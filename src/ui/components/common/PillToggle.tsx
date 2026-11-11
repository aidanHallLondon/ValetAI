import React from "react";

export interface PillToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  count?: number;
  title?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Combined Component: PillToggle
 * Generic, domain-agnostic composite toggle rendered as a pill with an active status dot,
 * text label, and optional numeric counter badge.
 */
export const PillToggle: React.FC<PillToggleProps> = ({
  checked,
  onChange,
  label,
  count,
  title,
  id,
  disabled = false,
  className = "",
}) => {
  const toggleId = id || `pill-toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <label
      htmlFor={toggleId}
      className={`pill-toggle ${checked ? "is-active" : "is-inactive"} ${
        disabled ? "is-disabled" : ""
      } ${className}`.trim()}
      title={title}
    >
      <input
        type="checkbox"
        id={toggleId}
        className="pill-toggle-checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <span className="pill-toggle-dot" aria-hidden="true" />
      <span className="pill-toggle-label">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className="pill-toggle-counter"
          title={`${count} items`}
          aria-label={`${count} items`}
        >
          {count}
        </span>
      )}
    </label>
  );
};

