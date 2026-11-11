import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, id, className = "", rows = 4, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="valet-form-field">
        {label && (
          <label htmlFor={textareaId} className="valet-form-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`valet-textarea ${error ? "valet-textarea-error" : ""} ${className}`.trim()}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {helperText && !error && <div className="valet-form-helper">{helperText}</div>}
        {error && <div className="valet-form-error">{error}</div>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

