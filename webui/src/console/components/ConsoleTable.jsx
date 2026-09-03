import React from "react";

/**
 * Parse raw table text (space-separated or key-value) into structured rows & headers.
 */
export function parseTableText(raw) {
  if (!raw || typeof raw !== "string") return null;

  const lines = raw
    .split("\n")
    .map(l => l.trimEnd())
    .filter(l => l.trim().length > 0 && !l.trim().startsWith("---") && !l.trim().startsWith("==="));

  if (lines.length === 0) return null;

  const headerLine = lines[0];

  // Detect Key-Value table (e.g. METRIC VALUE, KEY VALUE, PROPERTY VALUE, SETTING VALUE)
  const isKeyValue = /^METRIC\s+VALUE/i.test(headerLine) || /^KEY\s+VALUE/i.test(headerLine) || /^PROPERTY\s+VALUE/i.test(headerLine) || /^SETTING\s+VALUE/i.test(headerLine);

  if (isKeyValue) {
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(.+?)\s{2,}(.+)$/);
      if (match) {
        rows.push({ metric: match[1].trim(), value: match[2].trim() });
      } else {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          rows.push({ metric: parts[0].trim(), value: parts.slice(1).join(" ").trim() });
        }
      }
    }
    return { type: "key-value", rows };
  }

  // Multi-column table
  const headers = headerLine.trim().split(/\s+/);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].trim().split(/\s+/);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return { type: "table", headers, rows };
}

/**
 * Render a status badge (green, yellow, red, etc.)
 */
function StatusBadge({ val }) {
  const str = String(val).toLowerCase();
  let colorClass = "con-badge--neutral";
  let dotColorClass = "con-dot--neutral";

  if (str === "green" || str === "open" || str === "started" || str === "true") {
    colorClass = "con-badge--green";
    dotColorClass = "con-dot--green";
  } else if (str === "yellow" || str === "relocating" || str === "initializing") {
    colorClass = "con-badge--yellow";
    dotColorClass = "con-dot--yellow";
  } else if (str === "red" || str === "unassigned" || str === "stopped" || str === "close") {
    colorClass = "con-badge--red";
    dotColorClass = "con-dot--red";
  }

  return (
    <span className={`con-badge ${colorClass}`}>
      <span className={`con-badge-dot ${dotColorClass}`} />
      <span>{val}</span>
    </span>
  );
}

/**
 * ConsoleTable — renders structured, modern developer tables for cluster & index data.
 */
export default function ConsoleTable({ rawData }) {
  const parsed = parseTableText(rawData);

  if (!parsed || (parsed.type === "key-value" && parsed.rows.length === 0) || (parsed.type === "table" && parsed.rows.length === 0)) {
    return null;
  }

  // ── 1. KEY-VALUE TABLE (e.g. cluster:health, index:search) ──
  if (parsed.type === "key-value") {
    const statusRow = parsed.rows.find(r => ["status", "health"].includes(r.metric.toLowerCase()));
    const titleRow = parsed.rows.find(r => ["cluster name", "index name", "index", "name"].includes(r.metric.toLowerCase()));
    const otherRows = parsed.rows.filter(r => r !== statusRow && r !== titleRow);

    return (
      <div className="con-kv-widget">
        {/* Header Summary Banner */}
        <div className="con-kv-header">
          <div className="con-kv-title">
            <span className="con-kv-icon">⚡</span>
            <span className="con-kv-name">{titleRow ? titleRow.value : (statusRow ? "Index Details" : "Elasticsearch Cluster")}</span>
          </div>
          {statusRow && <StatusBadge val={statusRow.value} />}
        </div>

        {/* Key Value Grid */}
        <div className="con-kv-grid">
          {otherRows.map((row, idx) => {
            const isStatusLike = ["green", "yellow", "red", "open", "close", "true", "false"].includes(String(row.value).toLowerCase());
            const isNumber = /^\d+(\.\d+)?%?$/.test(row.value);
            const isZero = row.value === "0" || row.value === "false";

            return (
              <div key={idx} className="con-kv-row">
                <span className="con-kv-label">{row.metric}</span>
                <span className="con-kv-value">
                  {isStatusLike ? (
                    <StatusBadge val={row.value} />
                  ) : (
                    <span className={`con-kv-val-text ${isNumber ? "con-kv-number" : ""} ${isZero ? "con-kv-zero" : ""}`}>
                      {row.value}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── 2. MULTI-COLUMN DATA TABLE (e.g. index:list, node:list) ──
  return (
    <div className="con-table-wrapper">
      <table className="con-table">
        <thead>
          <tr>
            {parsed.headers.map((h, i) => (
              <th key={i} className="con-th">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {parsed.rows.map((row, rIdx) => (
            <tr key={rIdx} className="con-tr">
              {row.map((cell, cIdx) => {
                const headerName = (parsed.headers[cIdx] || "").toLowerCase();
                const isStatusCell = ["health", "status", "state", "prirep"].includes(headerName) ||
                  ["green", "yellow", "red", "open", "close", "started", "unassigned"].includes(String(cell).toLowerCase());

                const isNumeric = /^[0-9,.]+$/.test(cell) || /^[0-9.]+(mb|gb|kb|b|ms)$/i.test(cell);

                return (
                  <td key={cIdx} className={`con-td ${isNumeric ? "con-td-num" : ""}`}>
                    {isStatusCell ? (
                      <StatusBadge val={cell} />
                    ) : (
                      <span className={headerName.includes("index") || headerName.includes("name") ? "con-cell-primary" : ""}>
                        {cell}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}