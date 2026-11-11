/**
 * Reusable prompt editor container with undo/redo toolbar, reset button, and prompt auditor.
 */

import React from "react";
import { PromptAuditorWidget } from "./PromptAuditorWidget";

export type PromptType =
  | "scout-system"
  | "scout-template"
  | "analyst-system"
  | "analyst-template"
  | "analyst-rubric"
  | "clusterer-system"
  | "clusterer-template"
  | "curator-system"
  | "assistant-system"
  | "assistant-template"
  | "auditor-system";

export interface AttachedEditorFrameProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onResetDefault?: () => void;
  placeholder?: string;
  rows?: number;
  promptType: PromptType;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  extraToolbar?: React.ReactNode;
}

export function AttachedEditorFrame({
  id,
  value,
  onChange,
  onResetDefault,
  placeholder,
  rows = 9,
  promptType,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  extraToolbar,
}: AttachedEditorFrameProps) {
  return (
    <div className="attached-editor-frame">
      <div className="attached-editor-toolbar">
        <div className="attached-toolbar-left">
          {onUndo && (
            <button
              type="button"
              className="editor-tool-btn"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo edit (Cmd+Z)"
            >
              <span className="tool-icon">↩</span>
              <span>Undo</span>
            </button>
          )}
          {onRedo && (
            <button
              type="button"
              className="editor-tool-btn"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo edit (Cmd+Shift+Z)"
            >
              <span className="tool-icon">↪</span>
              <span>Redo</span>
            </button>
          )}
          {extraToolbar}
        </div>
        {onResetDefault && (
          <div className="attached-toolbar-right">
            <button
              type="button"
              className="editor-tool-btn reset-tool-btn"
              onClick={onResetDefault}
              title="Reset to default prompt"
            >
              Reset Default
            </button>
          </div>
        )}
      </div>

      <textarea
        id={id}
        className="attached-editor-textarea"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />

      <div className="attached-editor-footer">
        <div className="attached-footer-bar">
          <div className="attached-footer-left">
            <PromptAuditorWidget
              prompt={value}
              promptType={promptType}
              onApplyFix={(fix, isFull) =>
                onChange(isFull ? fix : `${value}\n${fix}`)
              }
            />
          </div>
          <div className="attached-footer-right">
            <span className="supervisor-meta-pill" title="Supervisor Active">
              <span className="auditor-shield-icon">🛡️</span>
              <span>Supervisor</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
