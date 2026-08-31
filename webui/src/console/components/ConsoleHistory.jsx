import React, { useRef, useEffect, useCallback } from "react";
import { highlightJSON, highlightTable, formatResultData } from "../resultRenderer.js";
import ConsoleTable from "./ConsoleTable.jsx";

/**
 * CommandResult — renders a single history entry (command + result).
 */
function CopyButton({ text }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };
  return (
    <button
      className="console-copy-btn"
      onClick={handleCopy}
      title="Copy to clipboard"
      aria-label="Copy result to clipboard"
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

function LoadingEntry({ commandName }) {
  const [dots, setDots] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setDots(d => (d + 1) % 4), 300);
    return () => clearInterval(id);
  }, []);
  const dotStr = ".".repeat(dots);
  return (
    <div className="console-entry console-entry--loading" aria-live="polite" aria-label={`Executing ${commandName}`}>
      <div className="console-cmd-line">
        <span className="console-prompt">›</span>
        <span className="console-cmd-text">{commandName}</span>
      </div>
      <div className="console-result-meta console-result-meta--loading">
        <span className="console-spinner" aria-hidden="true">⠋</span>
        <span className="console-status-text">Executing{dotStr}</span>
      </div>
    </div>
  );
}

export function CommandResult({ entry }) {
  const displayStr = formatResultData(entry.result);
  const isTable = entry.result.format === "table";

  let renderedHtml = "";
  if (entry.result.format === "json") {
    renderedHtml = highlightJSON(displayStr);
  } else if (!isTable) {
    renderedHtml = displayStr.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const isOk = entry.result.status === "ok";

  return (
    <div className="console-entry" aria-label={`Command: ${entry.command}`}>
      <div className="console-cmd-line">
        <span className="console-prompt">›</span>
        <span className="console-cmd-text">{entry.command}</span>
      </div>
      <div className={`console-result-meta ${isOk ? "console-result-meta--ok" : "console-result-meta--error"}`}>
        {isOk ? (
          <>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            <span className="console-status-code">{entry.result.statusCode}</span>
            <span className="console-status-label">OK</span>
          </>
        ) : (
          <>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            <span className="console-status-code">{entry.result.statusCode}</span>
            <span className="console-status-label">Error</span>
          </>
        )}
        <span className="console-duration">{entry.result.durationMs}ms</span>
        <CopyButton text={displayStr} />
      </div>
      {isTable ? (
        <ConsoleTable rawData={displayStr} />
      ) : (
        <pre
          className="console-pre"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      )}
    </div>
  );
}

/**
 * ConsoleHistory — the scrollable area showing all past commands.
 */
export default function ConsoleHistory({ entries, loadingCommand }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, loadingCommand]);

  if (entries.length === 0 && !loadingCommand) {
    return (
      <div className="console-history console-history--empty" aria-label="Command history">
        <div className="console-empty-state">
          <div className="console-empty-icon" aria-hidden="true">›_</div>
          <p className="console-empty-title">Elasticease Console</p>
          <p className="console-empty-desc">
            Start typing a command below, or press{" "}
            <kbd className="console-kbd">Ctrl+K</kbd> to open the command palette.
          </p>
          <div className="console-empty-hints">
            <span className="console-hint">cluster:health</span>
            <span className="console-hint">index:list</span>
            <span className="console-hint">node:list</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="console-history" role="log" aria-live="polite" aria-label="Command output history">
      {entries.map(entry => (
        <CommandResult key={entry.id} entry={entry} />
      ))}
      {loadingCommand && <LoadingEntry commandName={loadingCommand} />}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}