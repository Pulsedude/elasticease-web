import React, { useState, useRef, useEffect } from "react";
import { TerminalIcon, PlayIcon, SparklesIcon } from "./Icons";
import { parseInput } from "../console/commandParser.js";
import { executeCommand } from "../console/mockExecutor.js";
import {
  fetchDocumentDelete,
  fetchDocumentInsert,
  fetchDocumentUpdate,
  parseDocumentFields,
} from "../console/documentBuilder.js";

function highlightJSON(str) {
  if (typeof str !== "string") return str;
  return str.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    match => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span style="color:#94a3b8;font-weight:500">${match}</span>`;
        return `<span style="color:#34d399">${match}</span>`;
      }
      if (/true|false/.test(match)) return `<span style="color:#c084fc">${match}</span>`;
      if (/null/.test(match))       return `<span style="color:#475569">${match}</span>`;
      return `<span style="color:#60a5fa">${match}</span>`;
    }
  );
}

function highlightTabular(text) {
  if (typeof text !== "string") return String(text);
  return text.split("\n").map((line, i) => {
    if (i === 0) return `<span style="color:#64748b;font-weight:600">${line}</span>`;
    return line
      .replace(/\bgreen\b/g,  `<span style="color:#34d399">green</span>`)
      .replace(/\byellow\b/g, `<span style="color:#fbbf24">yellow</span>`)
      .replace(/\bred\b/g,    `<span style="color:#f87171">red</span>`)
      .replace(/\bSTARTED\b/g,`<span style="color:#34d399">STARTED</span>`)
      .replace(/\bUNASSIGNED\b/g,`<span style="color:#f87171">UNASSIGNED</span>`)
      .replace(/\*/g,         `<span style="color:#34d399">*</span>`);
  }).join("\n");
}

const PRESETS = [
  "cluster:health",
  "cluster:stats",
  "cluster:settings",
  "index:list",
  "cluster:nodes",
  "node:stats",
  "node:settings",
  "node:os",
  "shards:list",
  "allocation:list",
];

function normalizeCommand(raw) {
  const trimmed = (raw || "").trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("get /_cluster/health")) {
    return lower.includes("json") ? "cluster:health json=true" : "cluster:health";
  }
  if (lower.startsWith("get /_cluster/stats")) {
    return lower.includes("json") ? "cluster:stats json=true" : "cluster:stats";
  }
  if (lower.startsWith("get /_cluster/settings")) {
    return lower.includes("json") ? "cluster:settings json=true" : "cluster:settings";
  }
  const countMatch = trimmed.match(/^get\s+\/([a-zA-Z0-9_.*-]+)\/_count/i);
  if (countMatch) {
    return lower.includes("json") ? `index:count ${countMatch[1]} json=true` : `index:count ${countMatch[1]}`;
  }
  const nodeInspectMatch = trimmed.match(/^get\s+\/_nodes(?:\/([^/\s]+))?\/([a-zA-Z0-9_-]+)/i);
  if (nodeInspectMatch) {
    const targetNode = nodeInspectMatch[1];
    const infoType = nodeInspectMatch[2].toLowerCase();
    const knownNodeTypes = ["stats", "settings", "os", "process", "jvm", "plugins", "http", "ingest", "remote_cluster_server", "usage", "transport"];
    if (knownNodeTypes.includes(infoType)) {
      const nodePart = targetNode ? ` ${targetNode}` : "";
      const jsonPart = lower.includes("json") ? " json=true" : "";
      return `node:${infoType}${nodePart}${jsonPart}`;
    }
  }
  const searchMatch = trimmed.match(/^get\s+\/([a-zA-Z0-9_\-.*]+)\/_search/i);
  if (searchMatch) {
    return `index:data ${searchMatch[1]}`;
  }
  const getIndexMatch = trimmed.match(/^get\s+\/([a-zA-Z0-9_\-.*]+)$/i);
  if (getIndexMatch && !getIndexMatch[1].startsWith("_")) {
    return lower.includes("json") ? `index:get ${getIndexMatch[1]} json=true` : `index:get ${getIndexMatch[1]}`;
  }
  const bulkMatch = trimmed.match(/^post\s+\/([a-zA-Z0-9_\-.*]+)\/_bulk/i);
  if (bulkMatch) {
    return `bulk:insert ${bulkMatch[1]}`;
  }
  return trimmed;
}

export default function ConsoleTerminal() {
  const [inputVal, setInputVal] = useState("cluster:health");
  const [history,  setHistory]  = useState([
    {
      cmd: "elasticease --version",
      out: "Elasticease CLI v1.0.0\nStatus: Connected to Elasticsearch Backend API\nAvailable commands: cluster:health, index:list, index:get, index:count, index:data, bulk:insert, bulk:update, bulk:delete, cluster:nodes, node:stats, node:settings, node:os, node:process, node:jvm, node:plugins, node:http, node:ingest, node:remote_cluster_server, node:usage, node:transport, shards:list, allocation:list",
      type: "text",
    },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const inputRef  = useRef(null);

  // Execute initial cluster:health on load to display live data from backend API
  useEffect(() => {
    let active = true;
    async function loadInitial() {
      setIsRunning(true);
      try {
        const parsed = parseInput("cluster:health");
        const result = await executeCommand(parsed);
        if (!active) return;
        const outStr = (result.format === "table" || result.format === "text")
          ? (typeof result.data === "string" ? result.data : String(result.data))
          : (typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2));
        const displayType = (result.format === "table" || result.format === "text") ? "tabular" : "json";
        setHistory(prev => [
          ...prev,
          {
            cmd: "cluster:health",
            out: outStr,
            type: displayType,
            duration: result.durationMs,
            statusCode: result.statusCode,
          }
        ]);
      } catch (err) {
        if (!active) return;
        setHistory(prev => [
          ...prev,
          {
            cmd: "cluster:health",
            out: `Cannot connect to backend API: ${err.message || "Failed to fetch"}`,
            type: "text",
            statusCode: 503,
          }
        ]);
      } finally {
        if (active) setIsRunning(false);
      }
    }
    loadInitial();
    return () => { active = false; };
  }, []);

  const runCommand = async (cmd) => {
    const rawTarget = (cmd || inputVal).trim();
    if (!rawTarget || isRunning) return;
    
    setIsRunning(true);
    if (!cmd) setInputVal("");

    const target = normalizeCommand(rawTarget);
    const parsed = parseInput(target);

    try {
      let result;
      if (parsed.commandName === "document:delete") {
        const indexName = (parsed.argMap.index || parsed.argTokens[0] || "").replace(/^index=/, "");
        const docId = (parsed.argMap.id || parsed.argTokens[1] || "").replace(/^id=/, "");
        result = await fetchDocumentDelete(indexName, docId);
      } else if (parsed.commandName === "document:insert") {
        const indexName = (parsed.argMap.index || parsed.argTokens[0] || "").replace(/^index=/, "");
        const docId = (parsed.argMap.id || parsed.argTokens[1] || "").replace(/^id=/, "");
        const remaining = parsed.argTokens.slice(2).join(" ");
        if (remaining) {
          const parsedFields = parseDocumentFields(remaining);
          if (parsedFields.valid) {
            result = await fetchDocumentInsert(indexName, docId, parsedFields.doc);
          } else {
            result = { status: "error", statusCode: 400, durationMs: 0, format: "text", data: `Invalid document fields: ${parsedFields.error}` };
          }
        } else {
          result = {
            status: "ok",
            statusCode: 200,
            durationMs: 0,
            format: "text",
            data: `To insert documents with field prompts (e.g. name=john, age=12), please use the Interactive Console (/console) or pass fields inline: document:insert ${indexName || "<index>"} [id] field1=val1 field2=val2`,
          };
        }
      } else if (parsed.commandName === "document:update") {
        const indexName = (parsed.argMap.index || parsed.argTokens[0] || "").replace(/^index=/, "");
        const docId = (parsed.argMap.id || parsed.argTokens[1] || "").replace(/^id=/, "");
        const remaining = parsed.argTokens.slice(2).join(" ");
        if (remaining) {
          const parsedFields = parseDocumentFields(remaining);
          if (parsedFields.valid) {
            result = await fetchDocumentUpdate(indexName, docId, parsedFields.doc);
          } else {
            result = { status: "error", statusCode: 400, durationMs: 0, format: "text", data: `Invalid document fields: ${parsedFields.error}` };
          }
        } else {
          result = {
            status: "ok",
            statusCode: 200,
            durationMs: 0,
            format: "text",
            data: `To update documents with field prompts (e.g. name=john, age=12), please use the Interactive Console (/console) or pass fields inline: document:update ${indexName || "<index>"} ${docId || "<id>"} field1=val1 field2=val2`,
          };
        }
      } else {
        result = await executeCommand(parsed);
      }
      const outStr = (result.format === "table" || result.format === "text")
        ? (typeof result.data === "string" ? result.data : String(result.data))
        : (typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2));
      const displayType = (result.format === "table" || result.format === "text") ? "tabular" : "json";

      setHistory(prev => [
        ...prev,
        {
          cmd: rawTarget,
          out: outStr,
          type: displayType,
          duration: result.durationMs,
          statusCode: result.statusCode,
        }
      ]);
    } catch (err) {
      setHistory(prev => [
        ...prev,
        {
          cmd: rawTarget,
          out: `Error executing command: ${err.message || "Unknown error"}`,
          type: "text",
          statusCode: 500,
        }
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const outputRef = useRef(null);

  useEffect(() => {
    // Scroll only the terminal output container, not the whole page
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history, isRunning]);

  return (
    <div className="terminal-panel" role="region" aria-label="Interactive Elasticsearch console">
      {/* Chrome */}
      <div className="terminal-chrome">
        <div className="flex items-center gap-3">
          <div className="terminal-dots" aria-hidden="true">
            <span style={{ background: "#ff5f57" }} />
            <span style={{ background: "#febc2e" }} />
            <span style={{ background: "#28c840" }} />
          </div>
          <div className="terminal-title">
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>elasticease-console</span>
          </div>
        </div>
        <div className="terminal-status">
          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-amber-400 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
          {isRunning ? "Executing..." : "Live API"}
        </div>
      </div>

      {/* Preset bar */}
      <div className="terminal-presets" role="toolbar" aria-label="Quick command presets">
        <span style={{ color: "#64748b", fontSize: "11px", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
          <SparklesIcon className="w-3 h-3" style={{ color: "#6366f1" }} /> Quick:
        </span>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            className="terminal-preset-button"
            onClick={() => { setInputVal(p); runCommand(p); }}
            type="button"
            disabled={isRunning}
            title={`Run ${p}`}
            aria-label={`Run preset command ${p}`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Output */}
      <div
        className="terminal-output"
        ref={outputRef}
        onClick={() => inputRef.current?.focus()}
        role="log"
        aria-live="polite"
        aria-label="Command output history"
      >
        {history.map((item, i) => (
          <div key={i}>
            <div className="terminal-command flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="terminal-prompt" aria-hidden="true">$</span>
                <span className="terminal-command-text">{item.cmd}</span>
              </div>
              {item.duration !== undefined && (
                <span className="text-[11px] font-mono text-slate-500">
                  {item.statusCode ? `${item.statusCode} · ` : ""}{item.duration}ms
                </span>
              )}
            </div>
            <pre
              className="terminal-pre"
              dangerouslySetInnerHTML={{
                __html: item.type === "json"
                  ? highlightJSON(item.out)
                  : item.type === "tabular"
                  ? highlightTabular(item.out)
                  : item.out,
              }}
            />
          </div>
        ))}
        {isRunning && (
          <div>
            <div className="terminal-command">
              <span className="terminal-prompt" aria-hidden="true">$</span>
              <span className="terminal-command-text text-indigo-400 animate-pulse">Calling backend API...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="terminal-input-row">
        <span className="terminal-prompt font-bold" aria-hidden="true">$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") runCommand(); }}
          placeholder="Enter command (e.g. cluster:health, index:list, cluster:nodes)..."
          className="terminal-input"
          spellCheck="false"
          autoComplete="off"
          disabled={isRunning}
          aria-label="Elasticsearch command input"
        />
        <button
          onClick={() => runCommand()}
          type="button"
          disabled={isRunning}
          className="terminal-run-button cursor-pointer disabled:opacity-50"
          aria-label="Run command"
        >
          <PlayIcon className="w-3 h-3" /> {isRunning ? "Running..." : "Run"}
        </button>
      </div>
    </div>
  );
}
