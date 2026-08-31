/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  RESULT RENDERER HELPERS                                ║
 * ║  Pure functions — no React. The UI imports and uses.    ║
 * ╚══════════════════════════════════════════════════════════╝
 */

/**
 * Convert a result's data to a display string.
 * @param {ExecutionResult} result
 * @returns {string}
 */
export function formatResultData(result) {
  if (result.format === "json") {
    try {
      return JSON.stringify(result.data, null, 2);
    } catch {
      return String(result.data);
    }
  }
  if (result.format === "table" || result.format === "text") {
    return typeof result.data === "string" ? result.data : String(result.data);
  }
  return String(result.data);
}

/**
 * Apply syntax highlighting for JSON output.
 * Returns an HTML string — use dangerouslySetInnerHTML.
 * @param {string} str
 * @returns {string}
 */
export function highlightJSON(str) {
  if (typeof str !== "string") return str;
  // Escape HTML first to prevent XSS
  const escaped = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(
    /(&#34;(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\&#34;])*&#34;(\s*:)?|\b(true|false|null)\b|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    match => {
      if (match.endsWith(":")) {
        // JSON key
        return `<span class="json-key">${match}</span>`;
      }
      if (match.startsWith("&#34;")) {
        // JSON string value
        return `<span class="json-string">${match}</span>`;
      }
      if (match === "true" || match === "false") {
        return `<span class="json-bool">${match}</span>`;
      }
      if (match === "null") {
        return `<span class="json-null">${match}</span>`;
      }
      // Number
      return `<span class="json-number">${match}</span>`;
    }
  );
}

/**
 * Apply simple colour coding to tabular cat output.
 * @param {string} text
 * @returns {string}
 */
export function highlightTable(text) {
  return text
    .split("\n")
    .map((line, i) => {
      if (i === 0) {
        // Header row
        return `<span class="table-header">${escapeHtml(line)}</span>`;
      }
      return escapeHtml(line)
        .replace(/\bgreen\b/g,  '<span class="status-green">green</span>')
        .replace(/\byellow\b/g, '<span class="status-yellow">yellow</span>')
        .replace(/\bred\b/g,    '<span class="status-red">red</span>')
        .replace(/\bSTARTED\b/g,'<span class="status-green">STARTED</span>')
        .replace(/\bUNASSIGNED\b/g,'<span class="status-red">UNASSIGNED</span>')
        .replace(/\bSTOPPED\b/g,'<span class="status-red">STOPPED</span>')
        .replace(/\bRELOCATING\b/g,'<span class="status-yellow">RELOCATING</span>')
        .replace(/\*/g, '<span class="status-green">*</span>');
    })
    .join("\n");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
