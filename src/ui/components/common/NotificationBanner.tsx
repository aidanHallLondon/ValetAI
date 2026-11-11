import React from "react";

export type NotificationVariant = "success" | "warning" | "danger" | "info";

export interface NotificationBannerProps {
  variant?: NotificationVariant;
  message: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  variant = "info",
  message,
  onDismiss,
  className = "",
}) => {
  return (
    <div
      className={`notification-banner ${variant} ${className}`.trim()}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--primitive-space-3)",
      }}
      role="alert"
    >
      <div>{message}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "inherit",
            fontSize: "1rem",
            padding: "2px 6px",
            lineHeight: 1,
          }}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      )}
    </div>
  );
};

