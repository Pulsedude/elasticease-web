import React, { useState, useRef, useEffect } from "react";
import { TerminalIcon, PlayIcon, SparklesIcon } from "./Icons";

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
  return text.split("\n").map((line, i) => {
    if (i === 0) return `<span style="color:#64748b;font-weight:600">${line}</span>`;
    return line
      .replace(/\bgreen\b/g,  `<span style="color:#34d399">green</span>`)
      .replace(/\byellow\b/g, `<span style="color:#fbbf24">yellow</span>`)
      .replace(/\bred\b/g,    `<span style="color:#f87171">red</span>`)
      .replace(/\*/g,         `<span style="color:#34d399">*</span>`);
  }).join("\n");
}

const PRESETS = [
  "GET /_cluster/health",
  "GET /_cat/indices?v=true",
  "GET /_cat/nodes?v=true",
  "GET /_cluster/stats",
];

const INITIAL_HISTORY = [
  {
    cmd:  "elasticease-cli --version",
    out:  "Elasticease Console v1.2.0\nEngine: Elasticsearch 8.x / OpenSearch Compatible\nStatus: Connected",
    type: "text",
  },
  {
    cmd: "GET /_cluster/health",
    out: JSON.stringify({
      cluster_name: "elasticease-production",
      status: "green",
      number_of_nodes: 3,
      number_of_data_nodes: 3,
      active_primary_shards: 142,
      active_shards: 284,
      unassigned_shards: 0,
      active_shards_percent_as_number: 100.0,
    }, null, 2),
    type: "json",
  },
];

function execCommand(target) {
  let out = "", type = "json";
  if (target.includes("_cat/indices")) {
    out  = "health status index              pri rep docs.count store.size\ngreen  open   app-logs-2026        3   1  1,420,891      842mb\ngreen  open   user-analytics       2   1    850,210      310mb\ngreen  open   product-catalog      5   1  4,102,005     1.24gb";
    type = "tabular";
  } else if (target.includes("_cat/nodes")) {
    out  = "ip         heap.% ram.% cpu node.role master name\n10.0.0.12      42    78   4 cdfhilmrstw *      node-primary-01\n10.0.0.13      38    74   2 cdfhilmrstw -      node-data-02\n10.0.0.14      45    81   5 cdfhilmrstw -      node-data-03";
    type = "tabular";
  } else if (target.includes("_cluster/stats")) {
    out = JSON.stringify({ nodes: { count: { total: 3 } }, indices: { count: 24, docs: { count: 6373106 }, store: { size_in_bytes: 2316255744 } } }, null, 2);
  } else if (target.includes("elasticease-cli")) {
    out  = "Elasticease Console v1.2.0\nEngine: Elasticsearch 8.x\nStatus: Connected";
    type = "text";
  } else {
    out = JSON.stringify({ cluster_name: "elasticease-production", status: "green", number_of_nodes: 3, active_primary_shards: 142, active_shards: 284, unassigned_shards: 0, active_shards_percent_as_number: 100.0 }, null, 2);
  }
  return { out, type };
}

export default function ConsoleTerminal() {
  const [inputVal, setInputVal] = useState("GET /_cluster/health");
  const [history,  setHistory]  = useState(INITIAL_HISTORY);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const runCommand = (cmd) => {
    const target = (cmd || inputVal).trim();
    if (!target) return;
    const { out, type } = execCommand(target);
    setHistory(prev => [...prev, { cmd: target, out, type }]);
    if (!cmd) setInputVal("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

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
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Connected
        </div>
      </div>

      {/* Preset bar */}
      <div className="terminal-presets" role="toolbar" aria-label="Quick command presets">
        <span style={{ color: "#475569", fontSize: "11px", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
          <SparklesIcon className="w-3 h-3" style={{ color: "#6366f1" }} /> Quick:
        </span>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            className="terminal-preset-button"
            onClick={() => { setInputVal(p); runCommand(p); }}
            type="button"
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
        onClick={() => inputRef.current?.focus()}
        role="log"
        aria-live="polite"
        aria-label="Command output history"
      >
        {history.map((item, i) => (
          <div key={i}>
            <div className="terminal-command">
              <span className="terminal-prompt" aria-hidden="true">$</span>
              <span className="terminal-command-text">{item.cmd}</span>
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
        <div ref={bottomRef} />
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
          placeholder="Enter Elasticsearch REST command..."
          className="terminal-input"
          spellCheck="false"
          autoComplete="off"
          aria-label="Elasticsearch REST command input"
        />
        <button
          onClick={() => runCommand()}
          type="button"
          className="terminal-run-button"
          aria-label="Run command"
        >
          <PlayIcon className="w-3 h-3" /> Run
        </button>
      </div>
    </div>
  );
}
