import React, { useState, useEffect } from "react";
import { formatTokenNumber, formatCurrency } from "./TokenCostModal";

export interface HeaderTokenBadgeProps {
  onClick: () => void;
  totalTokens?: number;
  totalCost?: number;
  currency?: string;
  className?: string;
}

export function HeaderTokenBadge({
  onClick,
  totalTokens: controlledTokens,
  totalCost: controlledCost,
  currency: controlledCurrency,
  className = "",
}: HeaderTokenBadgeProps) {
  const [internalTokens, setInternalTokens] = useState<number>(0);
  const [internalCost, setInternalCost] = useState<number>(0);
  const [internalCurrency, setInternalCurrency] = useState<string>("$");

  const isControlled = controlledTokens !== undefined;
  const totalTokens = isControlled ? controlledTokens : internalTokens;
  const totalCost = controlledCost !== undefined ? controlledCost : internalCost;
  const currency = controlledCurrency !== undefined ? controlledCurrency : internalCurrency;

  const fetchTokenData = async () => {
    if (isControlled) return;
    try {
      const res = await fetch("/api/telemetry/tokens");
      if (res.ok) {
        const data = await res.json();
        setInternalTokens(Number(data.summary?.totalTokens || 0));
        setInternalCost(Number(data.totalEstimatedCost || 0));
        setInternalCurrency(data.pricing?.currencySymbol || "$");
      }
    } catch {}
  };

  useEffect(() => {
    if (isControlled) return;
    fetchTokenData();
    const interval = setInterval(fetchTokenData, 4000);
    return () => clearInterval(interval);
  }, [isControlled]);

  return (
    <button
      type="button"
      className={`header-token-badge ${className}`.trim()}
      onClick={onClick}
      title="View AI token consumption, per-model breakdown, and cost estimates"
      aria-label="AI Token usage and cost"
    >
      <span className="token-badge-icon" aria-hidden="true">
        ⚡
      </span>
      <span className="token-badge-count">{formatTokenNumber(totalTokens)}</span>
      <span className="token-badge-cost">
        · {formatCurrency(totalCost, currency)}
      </span>
    </button>
  );
}

