import React from "react";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, id, options, children, className = "", ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="valet-form-field">
        {label && (
          <label htmlFor={selectId} className="valet-form-label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`valet-select ${error ? "valet-select-error" : ""} ${className}`.trim()}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {helperText && !error && <div className="valet-form-helper">{helperText}</div>}
        {error && <div className="valet-form-error">{error}</div>}
      </div>
    );
  }
);
Select.displayName = "Select";

