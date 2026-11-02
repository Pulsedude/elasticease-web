import React, { useRef, useEffect, useCallback } from "react";
import { highlightJSON, highlightTable, formatResultData } from "../resultRenderer.js";
import ConsoleTable from "./ConsoleTable.jsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API_BASE_URL, apiFetch } from "../../api/client.js";
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

export function CommandResult({ entry, isLatest }) {
  const displayStr = formatResultData(entry.result);
  const isTable = entry.result.format === "table";

  let renderedHtml = "";
  if (entry.result.format === "json") {
    renderedHtml = highlightJSON(displayStr);
  } else if (!isTable) {
    renderedHtml = displayStr.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const isOk = entry.result.status === "ok";

  const [aiExpanded, setAiExpanded] = React.useState(true);
  const [localAiResponse, setLocalAiResponse] = React.useState(entry.result.aiResponse);
  const [fetchingAi, setFetchingAi] = React.useState(false);

  const handleRetroactiveAi = async () => {
    setFetchingAi(true);
    try {
      const dataStr = typeof entry.result.data === 'string' ? entry.result.data : JSON.stringify(entry.result.data);
      const promptStr = `${dataStr}\n\nHere is the data on my elasticsearch node now please start explaining the data in details in simple order to say that please summarize this given data. Start directly from explaining and NO EXTRA ANSWER.`;

      const res = await apiFetch(`${API_BASE_URL}/v1/core/ai_summarization`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptStr }),
      });
      
      if (!res.ok) throw new Error("API failed");
      const payload = await res.json();
      
      if (payload.success && payload.response) {
        setLocalAiResponse(payload.response);
      } else {
        setLocalAiResponse("error");
      }
    } catch (err) {
      setLocalAiResponse("error");
    } finally {
      setFetchingAi(false);
      setAiExpanded(true);
    }
  };

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
      
      {!localAiResponse && isLatest && isOk && (
        <div className="mt-[8px] flex justify-end">
          <button
            onClick={handleRetroactiveAi}
            disabled={fetchingAi}
            className="inline-flex items-center gap-[6px] px-[10px] py-[4px] rounded-[6px] bg-[rgba(99,102,241,0.1)] hover:bg-[rgba(99,102,241,0.18)] border border-[rgba(99,102,241,0.25)] text-[#818cf8] text-[12px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Summarize this data using AI"
          >
            {fetchingAi ? (
              <span className="console-spinner" aria-hidden="true">⠋</span>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /></svg>
            )}
            {fetchingAi ? "Summarizing..." : "Summarize with AI"}
          </button>
        </div>
      )}

      {localAiResponse && (
        <div className="console-ai-response mt-[12px] p-[12px] bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.2)] rounded-[6px] text-[#c7d2fe] text-[13px] leading-[1.5]">
          <div 
            className="flex items-center justify-between cursor-pointer font-semibold text-[#818cf8] mb-[8px]"
            onClick={() => setAiExpanded(!aiExpanded)}
            title="Toggle AI Response"
          >
            <div className="flex items-center gap-[8px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /></svg>
              AI Explanation
            </div>
            <svg 
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              className={`transform transition-transform duration-200 ${aiExpanded ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          
          <div className={`overflow-hidden transition-all duration-300 ${aiExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="pt-2 border-t border-[rgba(99,102,241,0.15)]">
              {localAiResponse === "error" ? (
                <span className="text-[#f87171]">Failed to generate AI response. Please check your AI model configuration or try again. Displaying raw data only.</span>
              ) : (
                <div className="console-ai-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{localAiResponse}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
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
            <span className="console-hint">nodes:list</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="console-history" role="log" aria-live="polite" aria-label="Command output history">
      {entries.map((entry, idx) => (
        <CommandResult key={entry.id} entry={entry} isLatest={idx === entries.length - 1} />
      ))}
      {loadingCommand && <LoadingEntry commandName={loadingCommand} />}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}