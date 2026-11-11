import React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "danger-solid";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      className = "",
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const variantClass = `valet-btn-${variant}`;
    const sizeClass = `valet-btn-${size}`;
    const disabledState = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabledState}
        className={`valet-button valet-btn ${variantClass} ${sizeClass} ${isLoading ? "is-loading" : ""} ${className}`.trim()}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="valet-spinner" aria-hidden="true" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="valet-btn-icon-left">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="valet-btn-icon-right">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

