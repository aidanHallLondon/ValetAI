import React, { useState, useEffect, useRef, useCallback } from "react";
import type { TokenUsageSummary, PricingSettings, ModelRate } from "../../../db";

export interface TokenCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: TelemetryResponse;
}

export interface TelemetryResponse {
  summary: TokenUsageSummary;
  pricing: PricingSettings;
  totalEstimatedCost: number;
  modelCosts: Record<
    string,
    { promptCost: number; completionCost: number; totalCost: number; inRate?: number; outRate?: number }
  >;
  lastResetAt?: string | null;
}

export function formatTokenNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}k`;
  }
  return num.toLocaleString();
}

export function formatCurrency(amount: number, symbol: string = "$"): string {
  if (amount === 0) return `${symbol}0.00`;
  if (amount < 0.01) return `${symbol}${amount.toFixed(4)}`;
  return `${symbol}${amount.toFixed(2)}`;
}

export interface TokenCostViewProps {
  isEmbedded?: boolean;
  onClose?: () => void;
  initialData?: TelemetryResponse;
}

export function TokenCostView({ isEmbedded = false, onClose, initialData }: TokenCostViewProps) {
  const [data, setData] = useState<TelemetryResponse | null>(() => initialData || null);
  const [pricingForm, setPricingForm] = useState<PricingSettings>(() => {
    if (initialData?.pricing) {
      return {
        ...initialData.pricing,
        perModelRates: initialData.pricing.perModelRates || {},
      };
    }
    return {
      llmInputPricePerMillion: 0,
      llmOutputPricePerMillion: 0,
      embeddingPricePerMillion: 0,
      currencySymbol: "$",
      perModelRates: {},
    };
  });
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    if (initialData) return;
    try {
      const res = await fetch("/api/telemetry/tokens");
      if (res.ok) {
        const json: TelemetryResponse = await res.json();
        setData(json);
        setPricingForm({
          ...json.pricing,
          perModelRates: json.pricing.perModelRates || {},
        });
      }
    } catch {}
  };

  useEffect(() => {
    if (initialData) return;
    fetchData();
  }, [initialData]);

  const triggerAutosave = useCallback((updatedPricing: PricingSettings) => {
    setIsSavingPricing(true);
    setSaveFeedback(null);
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/settings/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPricing),
        });
        if (res.ok) {
          setSaveFeedback("✓ Rates autosaved");
          await fetchData();
          setTimeout(() => setSaveFeedback(null), 2500);
        }
      } catch {
        setSaveFeedback("Error autosaving rates");
      } finally {
        setIsSavingPricing(false);
      }
    }, 600);
  }, []);

  const updateGlobalPricing = (patch: Partial<PricingSettings>) => {
    setPricingForm((prev) => {
      const next = { ...prev, ...patch };
      triggerAutosave(next);
      return next;
    });
  };

  const updateModelRate = (modelName: string, inPrice: number, outPrice: number) => {
    setPricingForm((prev) => {
      const nextRates = { ...(prev.perModelRates || {}) };
      nextRates[modelName] = {
        inputPricePerMillion: inPrice,
        outputPricePerMillion: outPrice,
      };
      const next = { ...prev, perModelRates: nextRates };
      triggerAutosave(next);
      return next;
    });
  };

  const handleApplyPresetToModel = (
    modelName: string,
    preset: { inPrice: number; outPrice: number }
  ) => {
    updateModelRate(modelName, preset.inPrice, preset.outPrice);
  };

  const handleApplyDefaultPreset = (preset: {
    inPrice: number;
    outPrice: number;
    embedPrice: number;
  }) => {
    updateGlobalPricing({
      llmInputPricePerMillion: preset.inPrice,
      llmOutputPricePerMillion: preset.outPrice,
      embeddingPricePerMillion: preset.embedPrice,
    });
  };

  const handleResetTelemetry = async () => {
    if (!confirm("Are you sure you want to reset all token consumption counters?")) {
      return;
    }
    try {
      const res = await fetch("/api/telemetry/tokens/reset", { method: "POST" });
      if (res.ok) {
        await fetchData();
        setSaveFeedback("✓ Token counters have been reset.");
        setTimeout(() => setSaveFeedback(null), 2500);
      }
    } catch {
      setSaveFeedback("Failed to reset token counters.");
    }
  };

  const summary = data?.summary || {
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    callCount: 0,
    byModel: {},
  };

  const currency = pricingForm.currencySymbol || "$";
  const totalCost = data?.totalEstimatedCost || 0;

  return (
    <div className={`token-cost-content ${isEmbedded ? "embedded-mode" : "modal-mode"}`}>
      <div className="token-modal-header">
        <div className="token-modal-title-group">
          <span className="token-header-icon">⚡</span>
          <div>
            <h2 id="token-modal-title">Token Usage & Cost Estimator</h2>
            <p className="muted">
              Track AI model consumption across LLM inferences and vector embeddings
            </p>
          </div>
        </div>
        {!isEmbedded && onClose && (
          <button
            type="button"
            className="token-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        )}
      </div>

      {/* Highlight Stats Row */}
      <div className="token-stat-grid">
        <div className="token-stat-box">
          <span className="token-stat-label">Total Tokens</span>
          <span className="token-stat-value">
            {formatTokenNumber(summary.totalTokens)}
          </span>
          <span className="token-stat-sub">
            {summary.totalTokens.toLocaleString()} raw tokens
          </span>
        </div>

        <div className="token-stat-box">
          <span className="token-stat-label">Prompt / Input</span>
          <span className="token-stat-value">
            {formatTokenNumber(summary.totalPromptTokens)}
          </span>
          <span className="token-stat-sub">
            {summary.totalPromptTokens.toLocaleString()} tokens
          </span>
        </div>

        <div className="token-stat-box">
          <span className="token-stat-label">Completion / Output</span>
          <span className="token-stat-value">
            {formatTokenNumber(summary.totalCompletionTokens)}
          </span>
          <span className="token-stat-sub">
            {summary.totalCompletionTokens.toLocaleString()} tokens
          </span>
        </div>

        <div className="token-stat-box highlight">
          <span className="token-stat-label">Estimated Cost</span>
          <span className="token-stat-value cost-value">
            {formatCurrency(totalCost, currency)}
          </span>
          <span className="token-stat-sub">
            {totalCost === 0 ? "Local / Free ($0.00/M)" : `Calculated with active model rates`}
          </span>
        </div>
      </div>

      {/* Unified 3-Row Matrix Table with Multiple Models */}
      <div className="token-section-wrapper">
        <div className="token-section-title-row">
          <div>
            <h3 style={{ margin: 0 }}>Model Consumption & Pricing Matrix</h3>
            <p className="muted" style={{ margin: "2px 0 0" }}>
              Three rows per model: Tokens used, Charge, and Pricing rates. Rates update automatically on change.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span className="muted" style={{ fontSize: "0.78rem" }}>
              {data?.lastResetAt
                ? `Last reset: ${new Date(data.lastResetAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Last reset: Never"}
            </span>
            <button
              type="button"
              className="text-action-btn danger"
              onClick={handleResetTelemetry}
              title="Reset all recorded token counts"
            >
              Reset Counters
            </button>
          </div>
        </div>

        {Object.keys(summary.byModel).length === 0 ? (
          <div className="token-empty-state">
            No token calls recorded yet. Process an article to view live telemetry.
          </div>
        ) : (
          <div className="table-wrapper" style={{ marginTop: "0.75rem" }}>
            <table className="admin-table usage-matrix-table">
              <thead>
                <tr>
                  <th style={{ width: "220px" }}>Model</th>
                  <th style={{ width: "170px" }}>Dimension</th>
                  <th style={{ textAlign: "right" }}>Prompt / Input</th>
                  <th style={{ textAlign: "right" }}>Completion / Output</th>
                  <th style={{ textAlign: "right", minWidth: "120px" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.byModel).map(([modelName, stats]) => {
                  const costInfo = data?.modelCosts?.[modelName];
                  const totalCost = costInfo?.totalCost || 0;
                  const promptCost = costInfo?.promptCost || 0;
                  const completionCost = costInfo?.completionCost || 0;
                  const isEmbedding = stats.type === "embedding";
                  const customRate = pricingForm.perModelRates?.[modelName];
                  const inRate =
                    customRate?.inputPricePerMillion ??
                    (isEmbedding
                      ? pricingForm.embeddingPricePerMillion
                      : pricingForm.llmInputPricePerMillion);
                  const outRate =
                    customRate?.outputPricePerMillion ?? pricingForm.llmOutputPricePerMillion;

                  return (
                    <React.Fragment key={modelName}>
                      {/* Row 1: Tokens used */}
                      <tr className="usage-metric-row tokens-row" style={{ borderTop: "2px solid var(--border-subtle, #e2e8f0)" }}>
                        <td rowSpan={3} style={{ verticalAlign: "top", background: "var(--surface-elevated, #f8fafc)" }}>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-foreground-primary, #0f172a)", wordBreak: "break-word" }}>
                            {modelName}
                          </div>
                          <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className={`badge ${isEmbedding ? "badge-info" : "badge-accent"}`}>
                              {stats.type.toUpperCase()}
                            </span>
                            <span className="muted" style={{ fontSize: "0.75rem" }}>
                              {stats.callCount} calls
                            </span>
                          </div>
                        </td>
                        <td className="usage-metric-label">
                          <span style={{ marginRight: "6px" }}>📊</span>
                          <strong>Tokens used</strong>
                        </td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          <div style={{ fontWeight: 600 }}>{formatTokenNumber(stats.promptTokens)}</div>
                          <div className="muted" style={{ fontSize: "0.72rem" }}>
                            {stats.promptTokens.toLocaleString()} tokens
                          </div>
                        </td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {isEmbedding ? (
                            <span className="muted">—</span>
                          ) : (
                            <>
                              <div style={{ fontWeight: 600 }}>{formatTokenNumber(stats.completionTokens)}</div>
                              <div className="muted" style={{ fontSize: "0.72rem" }}>
                                {stats.completionTokens.toLocaleString()} tokens
                              </div>
                            </>
                          )}
                        </td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          <div style={{ fontWeight: 700, color: "var(--color-primary, #2563eb)" }}>
                            {formatTokenNumber(stats.totalTokens)}
                          </div>
                          <div className="muted" style={{ fontSize: "0.72rem" }}>
                            {stats.totalTokens.toLocaleString()} total
                          </div>
                        </td>
                      </tr>

                      {/* Row 2: Charge */}
                      <tr className="usage-metric-row cost-row">
                        <td className="usage-metric-label">
                          <span style={{ marginRight: "6px" }}>💰</span>
                          <strong>Charge</strong>
                        </td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(promptCost, currency)}</span>
                        </td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {isEmbedding ? (
                            <span className="muted">—</span>
                          ) : (
                            <span style={{ fontWeight: 600 }}>{formatCurrency(completionCost, currency)}</span>
                          )}
                        </td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          <span className="cost-value" style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                            {formatCurrency(totalCost, currency)}
                          </span>
                        </td>
                      </tr>

                      {/* Row 3: Pricing Rates */}
                      <tr className="usage-metric-row pricing-row">
                        <td className="usage-metric-label">
                          <span style={{ marginRight: "6px" }}>🏷️</span>
                          <strong>Pricing Rates</strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="inline-price-input-box" style={{ justifyContent: "flex-end" }}>
                            <span className="price-prefix">{currency}</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="inline-rate-input"
                              style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", width: "68px" }}
                              value={inRate}
                              onChange={(e) =>
                                updateModelRate(
                                  modelName,
                                  parseFloat(e.target.value) || 0,
                                  outRate
                                )
                              }
                              title={`Input rate $/M for ${modelName}`}
                            />
                            <span className="muted" style={{ fontSize: "0.75rem", marginLeft: "4px" }}>/M</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isEmbedding ? (
                            <span className="muted" style={{ fontSize: "0.8rem" }}>—</span>
                          ) : (
                            <div className="inline-price-input-box" style={{ justifyContent: "flex-end" }}>
                              <span className="price-prefix">{currency}</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="inline-rate-input"
                                style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", width: "68px" }}
                                value={outRate}
                                onChange={(e) =>
                                  updateModelRate(
                                    modelName,
                                    inRate,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                title={`Output rate $/M for ${modelName}`}
                              />
                              <span className="muted" style={{ fontSize: "0.75rem", marginLeft: "4px" }}>/M</span>
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span className="muted" style={{ fontSize: "0.75rem" }}>—</span>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fallback / Default Pricing Configuration (Autosaved on change, NO save button) */}
      <div className="token-section-wrapper pricing-config-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h3 style={{ margin: 0 }}>Fallback / Default Pricing</h3>
            <p className="muted" style={{ margin: "2px 0 0" }}>
              Applied to any unlisted models. Updates automatically on change without needing a save button.
            </p>
          </div>
          <span className="autosave-quiet-status">
            {isSavingPricing ? "Saving…" : saveFeedback || "✓ Rates update on change"}
          </span>
        </div>

        {/* Global Quick Presets */}
        <div className="pricing-presets-row" style={{ marginTop: "0.75rem" }}>
          <span className="preset-label">Apply Default:</span>
          <button
            type="button"
            className="preset-chip"
            onClick={() =>
              handleApplyDefaultPreset({
                inPrice: 0,
                outPrice: 0,
                embedPrice: 0,
              })
            }
          >
            Reset to Local Free ($0/M)
          </button>
        </div>

        <div className="pricing-form-grid" style={{ marginTop: "0.75rem" }}>
          <div className="form-group">
            <label htmlFor="llmInputPrice">
              Default LLM Input ($/1M)
            </label>
            <div className="input-with-affix">
              <span className="input-prefix">{currency}</span>
              <input
                id="llmInputPrice"
                type="number"
                step="0.001"
                min="0"
                value={pricingForm.llmInputPricePerMillion}
                onChange={(e) =>
                  updateGlobalPricing({
                    llmInputPricePerMillion: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="llmOutputPrice">
              Default LLM Output ($/1M)
            </label>
            <div className="input-with-affix">
              <span className="input-prefix">{currency}</span>
              <input
                id="llmOutputPrice"
                type="number"
                step="0.001"
                min="0"
                value={pricingForm.llmOutputPricePerMillion}
                onChange={(e) =>
                  updateGlobalPricing({
                    llmOutputPricePerMillion: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="embeddingPrice">
              Default Embedding ($/1M)
            </label>
            <div className="input-with-affix">
              <span className="input-prefix">{currency}</span>
              <input
                id="embeddingPrice"
                type="number"
                step="0.001"
                min="0"
                value={pricingForm.embeddingPricePerMillion}
                onChange={(e) =>
                  updateGlobalPricing({
                    embeddingPricePerMillion: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="currencySymbol">Currency Symbol</label>
            <input
              id="currencySymbol"
              type="text"
              maxLength={4}
              value={pricingForm.currencySymbol}
              onChange={(e) =>
                updateGlobalPricing({
                  currencySymbol: e.target.value,
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TokenCostModal({ isOpen, onClose, initialData }: TokenCostModalProps) {
  if (!isOpen) return null;

  return (
    <div className="token-cost-modal token-modal-backdrop" onClick={onClose}>
      <div
        className="token-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-modal-title"
      >
        <TokenCostView isEmbedded={false} onClose={onClose} initialData={initialData} />
      </div>
    </div>
  );
}
