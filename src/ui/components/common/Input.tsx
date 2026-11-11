import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, id, className = "", ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="valet-form-field">
        {label && (
          <label htmlFor={inputId} className="valet-form-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`valet-input ${error ? "valet-input-error" : ""} ${className}`.trim()}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {helperText && !error && <div className="valet-form-helper">{helperText}</div>}
        {error && <div className="valet-form-error">{error}</div>}
      </div>
    );
  }
);
Input.displayName = "Input";

