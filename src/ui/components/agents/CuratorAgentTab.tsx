/**
 * Agent 3: Taxonomy Curator configuration tab.
 */

import React from "react";
import type { ModelSettings } from "../../../db";
import { AGENT_BOTS, type AgentId } from "../../utils/agents";
import { AgentPageHeader } from "./common/AgentPageHeader";
import { CONFIG } from "../../../config";
import { AttachedEditorFrame } from "./common/AttachedEditorFrame";

export interface CuratorAgentTabProps {
  form: ModelSettings;
  updateForm: (patch: Partial<ModelSettings>) => void;
  renderBotTimingRow: (bot: AgentId, name: string) => React.ReactNode;
  onNavigateToLibrary?: (action?: "recluster" | "recurate" | "reread") => void;
  curatorData?: {
    totalArticlesAnalyzed: number;
    totalVectorsScanned: number;
    totalEntitiesConsolidated: number;
    shelves: Array<{
      id: string;
      title: string;
      icon: string;
      description: string;
      articleCount: number;
      topEntities: string[];
      sampleArticles: Array<{ id: number; title: string }>;
    }>;
    lastCuratedAt: string;
  } | null;
  handleCuratorRun: () => void;
  isCurating: boolean;
  curatorMessage?: string | null;
  canUndo?: boolean;
  canRedo?: boolean;
  handleUndo?: () => void;
  handleRedo?: () => void;
}

export function CuratorAgentTab({
  form,
  updateForm,
  renderBotTimingRow,
  onNavigateToLibrary,
  curatorData,
  handleCuratorRun,
  isCurating,
  curatorMessage,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
}: CuratorAgentTabProps) {
  return (
    <div className="curator-agent-tab agent-page-container">
      <AgentPageHeader
        bot="curator"
        subtitle="Autonomously discovers emerging topic clusters, merges entity synonyms, and dynamically organizes knowledge shelves across your library."
        timingNode={renderBotTimingRow("curator", AGENT_BOTS.curator.name)}
        actionsNode={
          <button
            type="button"
            className="secondary-btn"
            onClick={() => onNavigateToLibrary?.("recurate")}
            title="View Curator status and re-curate shelves in Library"
          >
            View in Knowledge Pipeline ↗
          </button>
        }
      />

      {/* Section 1: Taxonomy Classification Directives */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Ontology & Classification Directives</h4>
            <p className="muted">
              Instructs the Taxonomy Curator on how to discover macro topic shelves, consolidate
              entity tags, and maintain a clean knowledge graph.
            </p>
          </div>
        </div>

        <AttachedEditorFrame
          id="curatorSystemPrompt"
          value={form.curatorSystemPrompt || ""}
          onChange={(val) => updateForm({ curatorSystemPrompt: val })}
          onResetDefault={() =>
            updateForm({
              curatorSystemPrompt: CONFIG.LM_STUDIO.DEFAULT_CURATOR_SYSTEM_PROMPT,
            })
          }
          placeholder="Enter taxonomy classification instructions..."
          rows={6}
          promptType="curator-system"
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </div>

      {/* Section 2: Dynamic Knowledge Shelves */}
      <div className="admin-card">
        <div className="card-title-row">
          <div>
            <h4>Dynamic Knowledge Shelves</h4>
            <p className="muted">
              Active macro topics autonomously curated from library content, vector embeddings, and
              entity co-occurrences.
            </p>
          </div>
        </div>

        {curatorData && (
          <div className="taxonomy-summary-metrics">
            <span className="metric-chip">
              📚 <strong>{curatorData.totalArticlesAnalyzed}</strong> Articles Analyzed
            </span>
            <span className="metric-chip">
              ⚡ <strong>{curatorData.totalVectorsScanned}</strong> Vector Embeddings Scanned
            </span>
            <span className="metric-chip">
              🏷️ <strong>{curatorData.totalEntitiesConsolidated}</strong> Consolidated Entities
            </span>
            <span className="metric-chip">
              🗂️ <strong>{curatorData.shelves.length}</strong> Active Shelves
            </span>
          </div>
        )}

        <div className="taxonomy-shelves-container">
          {(curatorData?.shelves || []).map((shelf) => (
            <div key={shelf.id} className="taxonomy-shelf-card">
              <div className="shelf-header">
                <span className="shelf-icon">{shelf.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong className="shelf-title">{shelf.title}</strong>
                  <span className="shelf-count">
                    {shelf.articleCount} article{shelf.articleCount > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <p className="shelf-description">{shelf.description}</p>

              {shelf.topEntities && shelf.topEntities.length > 0 && (
                <div className="shelf-entities-row">
                  {shelf.topEntities.map((ent) => (
                    <span key={ent} className="shelf-entity-badge">
                      {ent}
                    </span>
                  ))}
                </div>
              )}

              {shelf.sampleArticles && shelf.sampleArticles.length > 0 && (
                <div className="shelf-samples-list">
                  <span className="shelf-samples-label">Sample Articles:</span>
                  <ul>
                    {shelf.sampleArticles.map((sample) => (
                      <li key={sample.id} title={sample.title}>
                        {sample.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "1.25rem",
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="primary-btn"
            onClick={handleCuratorRun}
            disabled={isCurating}
          >
            {isCurating
              ? "Auditing Library & Vector Embeddings..."
              : "⚡ Run Taxonomy Discovery & Consolidate"}
          </button>
          {curatorMessage && (
            <span className="save-indicator is-saved">{curatorMessage}</span>
          )}
        </div>
      </div>
    </div>
  );
}

