import React from "react";

/**
 * ConsoleHeader — sticky top bar with title, connected indicator,
 * and Ctrl+K hint.
 *
 * Props:
 *   clusterStatus  "connected" | "disconnected" | null
 *   onOpenPalette  () => void
 */
export default function ConsoleHeader({ clusterStatus, onOpenPalette }) {
  const isConnected = clusterStatus !== "disconnected";

  return (
    <div className="console-header">
      <div className="console-header-left">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="console-header-icon" aria-hidden="true">
          <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
        </svg>
        <span className="console-header-title">Elasticease Console</span>
      </div>
      <div className="console-header-right">
        <button
          className="console-palette-hint"
          onClick={onOpenPalette}
          title="Open command palette (Ctrl+K)"
          aria-label="Open command palette"
          type="button"
        >
          <kbd>Ctrl</kbd><span>+</span><kbd>K</kbd>
          <span className="console-palette-hint-label">Palette</span>
        </button>
        <div className={`console-status-badge ${isConnected ? "console-status-badge--ok" : "console-status-badge--error"}`}>
          <span
            className={`console-status-dot ${isConnected ? "console-status-dot--ok" : "console-status-dot--error"}`}
            aria-hidden="true"
          />
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>
    </div>
  );
}