import React from "react";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  size?: "sm" | "md";
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  size = "md",
  className = "",
}) => {
  const toggleId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <label
      htmlFor={toggleId}
      className={`valet-toggle-wrapper valet-toggle-${size} ${disabled ? "is-disabled" : ""} ${className}`.trim()}
    >
      <button
        type="button"
        id={toggleId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`valet-toggle ${checked ? "is-checked" : ""}`}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span className="valet-toggle-thumb" aria-hidden="true" />
      </button>
      {label && <span className="valet-form-label">{label}</span>}
    </label>
  );
};

