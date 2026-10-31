import React, { useState, useMemo } from "react";

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
  let headers = headerLine.trim().split(/\s{2,}/);
  if (headers.length <= 1) {
    headers = headerLine.trim().split(/\s+/);
  }
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    let cells = lines[i].trim().split(/\s{2,}/);
    if (cells.length !== headers.length) {
      cells = lines[i].trim().split(/\s+/);
    }
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
 * Features search filtering, table/cards view toggle, pagination, and full word wrap without overflow.
 */
export default function ConsoleTable({ rawData, fallback = null }) {
  const parsed = useMemo(() => parseTableText(rawData), [rawData]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [copiedKey, setCopiedKey] = useState(null);

  // If > 14 properties, default to clean "table" view instead of dense cards grid
  const isLargeKv = Boolean(parsed?.type === "key-value" && parsed.rows.length > 14);
  const [viewMode, setViewMode] = useState(() => (isLargeKv ? "table" : "grid"));

  const handleCopy = (text, key) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  };

  if (!parsed || (parsed.type === "key-value" && parsed.rows.length === 0) || (parsed.type === "table" && parsed.rows.length === 0)) {
    return fallback || (
      <pre className="console-pre">
        {rawData}
      </pre>
    );
  }

  // ── 1. KEY-VALUE TABLE (e.g. cluster:health, node:jvm, node:settings, node:stats) ──
  if (parsed.type === "key-value") {
    const statusRow = parsed.rows.find(r => ["status", "health"].includes(r.metric.toLowerCase()));
    const titleRow = parsed.rows.find(r => ["cluster name", "index name", "index", "name", "node name", "node"].includes(r.metric.toLowerCase()));
    const otherRows = parsed.rows.filter(r => r !== statusRow && r !== titleRow);

    // Filter by search query
    const filteredRows = search.trim()
      ? otherRows.filter(r =>
          r.metric.toLowerCase().includes(search.toLowerCase()) ||
          r.value.toLowerCase().includes(search.toLowerCase())
        )
      : otherRows;

    const totalRows = filteredRows.length;
    const effectivePageSize = pageSize === "all" ? totalRows : Number(pageSize);
    const totalPages = Math.ceil(totalRows / effectivePageSize) || 1;
    const safePage = Math.min(page, totalPages - 1);
    const paginatedRows = pageSize === "all" ? filteredRows : filteredRows.slice(safePage * effectivePageSize, (safePage + 1) * effectivePageSize);

    const titleText = titleRow ? titleRow.value : (statusRow ? "Details Overview" : "Node / Cluster Properties");

    return (
      <div className="con-kv-widget">
        {/* Header Summary Banner */}
        <div className="con-kv-header">
          <div className="con-kv-title">
            <span className="con-kv-icon" aria-hidden="true">⚡</span>
            <span className="con-kv-name">{titleText}</span>
            {statusRow && <StatusBadge val={statusRow.value} />}
          </div>

          <div className="con-kv-controls">
            {otherRows.length > 8 && (
              <div className="con-search-wrapper">
                <svg className="con-search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Filter properties..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                  className="con-search-input"
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="con-search-clear" title="Clear filter">×</button>
                )}
              </div>
            )}

            {/* View Mode Toggle: Table or Cards */}
            <div className="con-view-toggle">
              <button
                type="button"
                className={`con-toggle-btn ${viewMode === "table" ? "con-toggle-btn--active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Table view (clean structured rows)"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                Table
              </button>
              <button
                type="button"
                className={`con-toggle-btn ${viewMode === "grid" ? "con-toggle-btn--active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Cards view (compact grid tiles)"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* Content Body: Table View or Cards View */}
        {filteredRows.length === 0 ? (
          <div className="con-empty-filter">No properties matching "{search}"</div>
        ) : viewMode === "table" ? (
          <div className="con-kv-table-scroll">
            <table className="con-kv-table">
              <thead>
                <tr>
                  <th className="con-kv-th-metric">PROPERTY / METRIC</th>
                  <th className="con-kv-th-value">VALUE</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, idx) => {
                  const isStatusLike = ["green", "yellow", "red", "open", "close", "true", "false"].includes(String(row.value).toLowerCase());
                  const isNumber = /^\d+(\.\d+)?%?$/.test(row.value);
                  const isZero = row.value === "0" || row.value === "false";
                  const rowId = `r_${safePage}_${idx}`;

                  return (
                    <tr key={idx} className="con-kv-tr">
                      <td className="con-kv-td-metric">
                        <span className="con-kv-metric-text">{row.metric}</span>
                      </td>
                      <td className="con-kv-td-value">
                        <div className="con-kv-val-cell">
                          {isStatusLike ? (
                            <StatusBadge val={row.value} />
                          ) : (
                            <span className={`con-kv-val-text ${isNumber ? "con-kv-number" : ""} ${isZero ? "con-kv-zero" : ""}`}>
                              {row.value}
                            </span>
                          )}
                          <button
                            type="button"
                            className="con-row-copy-btn"
                            onClick={() => handleCopy(row.value, rowId)}
                            title="Copy value"
                          >
                            {copiedKey === rowId ? "✓" : "📋"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards Grid View with full overflow prevention */
          <div className="con-kv-grid">
            {paginatedRows.map((row, idx) => {
              const isStatusLike = ["green", "yellow", "red", "open", "close", "true", "false"].includes(String(row.value).toLowerCase());
              const isNumber = /^\d+(\.\d+)?%?$/.test(row.value);
              const isZero = row.value === "0" || row.value === "false";

              return (
                <div key={idx} className="con-kv-row">
                  <span className="con-kv-label" title={row.metric}>{row.metric}</span>
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
        )}

        {/* Pagination Toolbar */}
        {totalRows > 15 && (
          <div className="con-pagination">
            <span className="con-page-info">
              Showing {pageSize === "all" ? `1–${totalRows}` : `${safePage * effectivePageSize + 1}–${Math.min((safePage + 1) * effectivePageSize, totalRows)}`} of {totalRows}
            </span>
            <div className="con-page-actions">
              <select
                value={pageSize}
                onChange={e => { setPageSize(e.target.value === "all" ? "all" : Number(e.target.value)); setPage(0); }}
                className="con-page-select"
                title="Entries per page"
              >
                <option value={15}>15 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value="all">Show All</option>
              </select>
              {pageSize !== "all" && totalPages > 1 && (
                <div className="con-page-btns">
                  <button
                    type="button"
                    disabled={safePage === 0}
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    className="con-page-btn"
                  >
                    ‹ Prev
                  </button>
                  <span className="con-page-current">{safePage + 1} / {totalPages}</span>
                  <button
                    type="button"
                    disabled={safePage >= totalPages - 1}
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    className="con-page-btn"
                  >
                    Next ›
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── 2. MULTI-COLUMN DATA TABLE (e.g. index:list, node:list, shards:list) ──
  const filteredMultiRows = search.trim()
    ? parsed.rows.filter(row =>
        row.some(cell => String(cell).toLowerCase().includes(search.toLowerCase()))
      )
    : parsed.rows;

  const totalMultiRows = filteredMultiRows.length;
  const effectiveMultiPageSize = pageSize === "all" ? totalMultiRows : Number(pageSize);
  const totalMultiPages = Math.ceil(totalMultiRows / effectiveMultiPageSize) || 1;
  const safeMultiPage = Math.min(page, totalMultiPages - 1);
  const paginatedMultiRows = pageSize === "all" ? filteredMultiRows : filteredMultiRows.slice(safeMultiPage * effectiveMultiPageSize, (safeMultiPage + 1) * effectiveMultiPageSize);

  return (
    <div className="con-table-widget">
      {parsed.rows.length > 8 && (
        <div className="con-table-toolbar">
          <div className="con-search-wrapper">
            <svg className="con-search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search table rows..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="con-search-input"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="con-search-clear" title="Clear search">×</button>
            )}
          </div>
          <span className="con-table-count">
            {totalMultiRows} {totalMultiRows === 1 ? "row" : "rows"}
          </span>
        </div>
      )}

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
            {paginatedMultiRows.length === 0 ? (
              <tr>
                <td colSpan={parsed.headers.length} className="con-empty-td">
                  No rows matching "{search}"
                </td>
              </tr>
            ) : (
              paginatedMultiRows.map((row, rIdx) => (
                <tr key={rIdx} className="con-tr">
                  {row.map((cell, cIdx) => {
                    const headerName = (parsed.headers[cIdx] || "").toLowerCase();
                    const isStatusCell = ["health", "status", "state", "prirep"].includes(headerName) ||
                      ["green", "yellow", "red", "open", "close", "started", "unassigned"].includes(String(cell).toLowerCase());

                    const isNumeric = /^[0-9,.]+$/.test(cell) || /^[0-9.]+(mb|gb|kb|b|ms|%)$/i.test(cell);

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
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalMultiRows > 15 && (
        <div className="con-pagination">
          <span className="con-page-info">
            Showing {pageSize === "all" ? `1–${totalMultiRows}` : `${safeMultiPage * effectiveMultiPageSize + 1}–${Math.min((safeMultiPage + 1) * effectiveMultiPageSize, totalMultiRows)}`} of {totalMultiRows}
          </span>
          <div className="con-page-actions">
            <select
              value={pageSize}
              onChange={e => { setPageSize(e.target.value === "all" ? "all" : Number(e.target.value)); setPage(0); }}
              className="con-page-select"
              title="Rows per page"
            >
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value="all">Show All</option>
            </select>
            {pageSize !== "all" && totalMultiPages > 1 && (
              <div className="con-page-btns">
                <button
                  type="button"
                  disabled={safeMultiPage === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  className="con-page-btn"
                >
                  ‹ Prev
                </button>
                <span className="con-page-current">{safeMultiPage + 1} / {totalMultiPages}</span>
                <button
                  type="button"
                  disabled={safeMultiPage >= totalMultiPages - 1}
                  onClick={() => setPage(p => Math.min(totalMultiPages - 1, p + 1))}
                  className="con-page-btn"
                >
                  Next ›
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
