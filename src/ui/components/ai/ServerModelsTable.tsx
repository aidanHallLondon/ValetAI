import React from "react";
import type { LoadedModelMetadata, ModelSettings } from "../../../db/schema";
import { matchesModelId, getModelParamDetails, getBotsUsingModel } from "../AiSection";

export interface ServerModelsTableProps {
  availableModels: LoadedModelMetadata[];
  form: ModelSettings;
  isQueryingMeta?: boolean;
  onRefreshMetadata: () => void;
  className?: string;
}

/**
 * Server models inspection table presenting active discovered endpoints,
 * model architecture tiers, context length capacities, and assigned agent bots.
 */
export function ServerModelsTable({
  availableModels,
  form,
  isQueryingMeta = false,
  onRefreshMetadata,
  className = "",
}: ServerModelsTableProps) {
  return (
    <div className={`admin-card ${className}`.trim()} style={{ marginTop: "1rem" }}>
      <div className="card-title-row">
        <div>
          <h4 style={{ margin: 0 }}>Available Models on Server ({availableModels.length})</h4>
          <p className="muted" style={{ margin: "2px 0 0" }}>
            Models discovered from active server endpoint. Highlighted models are actively configured in Valet.
          </p>
        </div>
        <button
          type="button"
          className="secondary-btn"
          onClick={onRefreshMetadata}
          disabled={isQueryingMeta}
          title="Rescan server for loaded models"
          style={{ height: "30px", padding: "0 10px", fontSize: "0.78rem" }}
        >
          {isQueryingMeta ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <span className="spinner-icon">⟳</span> Probing…
            </span>
          ) : (
            "↺ Refresh"
          )}
        </button>
      </div>

      {availableModels.length === 0 ? (
        <div className="token-empty-state" style={{ marginTop: "0.75rem" }}>
          {isQueryingMeta
            ? "Scanning server for available models…"
            : "No models detected on server. Make sure LM Studio or your local inference engine is running."}
        </div>
      ) : (
        <div className="table-wrapper" style={{ marginTop: "0.75rem", overflowX: "auto" }}>
          <table className="server-models-table">
            <thead>
              <tr>
                <th>Model Name & Identifier</th>
                <th style={{ width: "90px" }}>Type</th>
                <th style={{ width: "120px" }}>Params & Arch</th>
                <th style={{ width: "120px" }}>Context Length</th>
                <th style={{ minWidth: "220px" }}>Assigned Agents & Bots</th>
              </tr>
            </thead>
            <tbody>
              {/* Sort: In-use models first, then parameters descending, then type, then name */}
              {[...availableModels]
                .sort((a, b) => {
                  const aUsed =
                    matchesModelId(form.llmModel, a.id, a.displayName) ||
                    matchesModelId(form.scoutModel, a.id, a.displayName) ||
                    matchesModelId(form.embeddingModel, a.id, a.displayName);
                  const bUsed =
                    matchesModelId(form.llmModel, b.id, b.displayName) ||
                    matchesModelId(form.scoutModel, b.id, b.displayName) ||
                    matchesModelId(form.embeddingModel, b.id, b.displayName);
                  if (aUsed !== bUsed) return aUsed ? -1 : 1;

                  const aParam = getModelParamDetails(a);
                  const bParam = getModelParamDetails(b);
                  if (bParam.count !== aParam.count) return bParam.count - aParam.count;

                  if (a.type !== b.type) return a.type === "embedding" ? 1 : -1;
                  return (a.displayName || a.id).localeCompare(b.displayName || b.id);
                })
                .map((m) => {
                  const isEmbedding = m.type === "embedding";
                  const assignedBots = getBotsUsingModel(m.id, m.displayName, form);
                  const isInUse = assignedBots.length > 0;
                  const paramInfo = getModelParamDetails(m);

                  return (
                    <tr key={m.id} className={isInUse ? "active-in-use-row" : ""}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--color-foreground-primary)" }}>
                          {m.displayName || m.id}
                        </div>
                        <div className="muted" style={{ fontSize: "0.72rem", fontFamily: "monospace" }}>
                          {m.id}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isEmbedding ? "badge-info" : "badge-accent"}`}>
                          {isEmbedding ? "EMBEDDING" : "LLM"}
                        </span>
                      </td>
                      <td>
                        <span className={`param-badge param-${paramInfo.tier}`}>
                          {paramInfo.label}
                        </span>
                        {m.quantization && (
                          <span className="muted" style={{ fontSize: "0.72rem", marginLeft: "4px" }}>
                            ({m.quantization})
                          </span>
                        )}
                      </td>
                      <td>
                        {m.contextLength ? (
                          <span>
                            <strong>{(m.contextLength / 1024).toFixed(0)}k</strong>
                            <span className="muted" style={{ fontSize: "0.72rem", marginLeft: "4px" }}>
                              ({m.contextLength.toLocaleString()})
                            </span>
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        {assignedBots.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {assignedBots.map((b) => (
                              <span
                                key={b.id}
                                className="bot-assigned-pill"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  padding: "2px 7px",
                                  borderRadius: "4px",
                                  background: "var(--surface-elevated)",
                                  border: `1px solid ${b.color}45`,
                                  color: b.color,
                                }}
                                title={`${b.name}: ${b.role}`}
                              >
                                <span>{b.emoji}</span>
                                <span>{b.name}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="muted" style={{ fontSize: "0.78rem" }}>
                            Unused
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

