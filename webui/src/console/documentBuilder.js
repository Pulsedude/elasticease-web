/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  DOCUMENT BUILDER & EXECUTOR                             ║
 * ║  Parses user field & value definitions and executes      ║
 * ║  document insert, update, delete against backend CRUD.  ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Supports:
 * - Key-value comma separated: name=john, age=12, email=john@example.com
 * - Key-value colon separated: name: john, age: 12
 * - Newline / semicolon separated:
 *     name=john
 *     age=12
 * - Direct JSON input: {"name": "john", "age": 12}
 *
 * Automatic type coercion:
 * - "true" / "false" -> boolean
 * - numeric strings (e.g. "12", "99.5") -> number
 * - "null" -> null
 * - quoted strings -> strip outer quotes
 */

import { API_BASE_URL, apiFetch } from "../api/client.js";

function ok(data, format = "json", durationMs = 0) {
  return { status: "ok", statusCode: 200, durationMs, format, data };
}

function error(data, statusCode = 500, durationMs = 0) {
  return { status: "error", statusCode, durationMs, format: "text", data };
}

export function parseDocumentFields(inputStr) {
  if (!inputStr || typeof inputStr !== "string" || !inputStr.trim()) {
    return { valid: false, error: "Empty field definitions provided.", doc: {} };
  }

  const trimmed = inputStr.trim();

  // 1. Direct JSON input
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return { valid: true, doc: parsed };
      }
      return { valid: false, error: "Document must be a JSON object ({ ... }), not an array.", doc: {} };
    } catch (e) {
      return { valid: false, error: `Invalid JSON syntax: ${e.message}`, doc: {} };
    }
  }

  // 2. Key-value string parsing
  const doc = {};
  const entries = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inQuote) {
      if (ch === quoteChar) {
        inQuote = false;
      }
      current += ch;
    } else if (ch === '"' || ch === "'") {
      inQuote = true;
      quoteChar = ch;
      current += ch;
    } else if (ch === ',' || ch === '\n' || ch === ';') {
      if (current.trim()) {
        entries.push(current.trim());
      }
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) {
    entries.push(current.trim());
  }

  if (entries.length === 0) {
    return { valid: false, error: "No fields detected.", doc: {} };
  }

  for (const entry of entries) {
    let eqIdx = entry.indexOf("=");
    let colonIdx = entry.indexOf(":");
    let splitIdx = -1;

    if (eqIdx !== -1 && colonIdx !== -1) {
      splitIdx = Math.min(eqIdx, colonIdx);
    } else if (eqIdx !== -1) {
      splitIdx = eqIdx;
    } else if (colonIdx !== -1) {
      splitIdx = colonIdx;
    }

    if (splitIdx === -1) {
      return {
        valid: false,
        error: `Invalid field format in '${entry}'. Expected format: field=value (e.g. name=john, age=12)`,
        doc: {},
      };
    }

    const rawKey = entry.slice(0, splitIdx).trim();
    let rawVal = entry.slice(splitIdx + 1).trim();

    if (!rawKey) {
      return { valid: false, error: `Missing field name in '${entry}'`, doc: {} };
    }

    // Coerce value
    let val = rawVal;
    if ((rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'"))) {
      val = rawVal.slice(1, -1);
    } else if (rawVal.toLowerCase() === "true") {
      val = true;
    } else if (rawVal.toLowerCase() === "false") {
      val = false;
    } else if (rawVal.toLowerCase() === "null") {
      val = null;
    } else if (/^-?\d+(\.\d+)?$/.test(rawVal)) {
      val = Number(rawVal);
    } else if ((rawVal.startsWith("[") && rawVal.endsWith("]")) || (rawVal.startsWith("{") && rawVal.endsWith("}"))) {
      try {
        val = JSON.parse(rawVal);
      } catch {}
    }

    doc[rawKey] = val;
  }

  return { valid: true, doc };
}

/**
 * Retrieve and inspect a single document by its document ID
 * Endpoint: GET /v1/crud/doc_inspect?index_name=...&doc_id=...
 */
export async function fetchDocumentGet(indexName, documentId, isJson = false) {
  const startTime = performance.now();
  const cleanIndex = String(indexName || "").trim().replace(/^\/+/, "");
  const cleanDocId = String(documentId || "").trim();

  if (!cleanIndex) {
    return error("Index name is required to get a document. Usage: document:get <index> <id>", 400, 0);
  }
  if (!cleanDocId) {
    return error("Document ID is required to get a document. Usage: document:get <index> <id>", 400, 0);
  }

  try {
    const res = await apiFetch(
      `${API_BASE_URL}/v1/crud/doc_inspect?index_name=${encodeURIComponent(cleanIndex)}&doc_id=${encodeURIComponent(cleanDocId)}`
    );

    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `Failed to get document with HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.detail?.error) errMsg = typeof errJson.detail.error === "string" ? errJson.detail.error : JSON.stringify(errJson.detail.error);
        else if (errJson?.detail) errMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        else if (errJson?.error) errMsg = typeof errJson.error === "string" ? errJson.error : JSON.stringify(errJson.error);
      } catch {}
      return error(errMsg, res.status, durationMs);
    }

    const payload = await res.json();
    if (payload && payload.success === false) {
      const errMsg = payload.error || payload.response || "Failed to get document";
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const data = (payload && payload.response !== undefined) ? payload.response : payload;
    return ok(data, isJson ? "json" : "json", durationMs);
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. (${err.message || "Failed to get document"})`,
      503,
      durationMs
    );
  }
}

/**
 * Insert new document into existing index
 * Endpoint: POST /v1/crud/insert_doc
 */
export async function fetchDocumentInsert(indexName, documentId = "", documentData = {}) {
  const startTime = performance.now();
  const cleanIndex = String(indexName || "").trim().replace(/^\/+/, "");
  if (!cleanIndex) {
    return error("Index name is required to insert a document. Usage: document:insert <index> [id]", 400, 0);
  }

  const cleanDocId = String(documentId || "").trim();

  try {
    const res = await apiFetch(`${API_BASE_URL}/v1/crud/insert_doc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        index_name: cleanIndex,
        document_id: cleanDocId,
        document: documentData && typeof documentData === "object" ? documentData : {},
      }),
    });

    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `Failed to insert document with HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.detail?.error) errMsg = typeof errJson.detail.error === "string" ? errJson.detail.error : JSON.stringify(errJson.detail.error);
        else if (errJson?.detail) errMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        else if (errJson?.error) errMsg = typeof errJson.error === "string" ? errJson.error : JSON.stringify(errJson.error);
      } catch {}
      return error(errMsg, res.status, durationMs);
    }

    const payload = await res.json();
    if (payload && payload.success === false) {
      const errMsg = payload.error || payload.response || "Failed to insert document";
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const data = (payload && payload.response !== undefined) ? payload.response : payload;
    return ok(data, "json", durationMs);
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. (${err.message || "Failed to insert document"})`,
      503,
      durationMs
    );
  }
}

/**
 * Update existing document by its ID
 * Endpoint: POST /v1/crud/update_doc
 */
export async function fetchDocumentUpdate(indexName, documentId, documentData = {}) {
  const startTime = performance.now();
  const cleanIndex = String(indexName || "").trim().replace(/^\/+/, "");
  const cleanDocId = String(documentId || "").trim();

  if (!cleanIndex) {
    return error("Index name is required to update a document. Usage: document:update <index> <id>", 400, 0);
  }
  if (!cleanDocId) {
    return error("Document ID is required to update a document. Usage: document:update <index> <id>", 400, 0);
  }

  // Ensure Elasticsearch _update wraps fields in {"doc": ...} if not already wrapped
  const updateDoc = (documentData && typeof documentData === "object" && documentData.doc)
    ? documentData
    : { doc: documentData || {} };

  try {
    const res = await apiFetch(`${API_BASE_URL}/v1/crud/update_doc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        index_name: cleanIndex,
        document_id: cleanDocId,
        document: updateDoc,
      }),
    });

    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `Failed to update document with HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.detail?.error) errMsg = typeof errJson.detail.error === "string" ? errJson.detail.error : JSON.stringify(errJson.detail.error);
        else if (errJson?.detail) errMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        else if (errJson?.error) errMsg = typeof errJson.error === "string" ? errJson.error : JSON.stringify(errJson.error);
      } catch {}
      return error(errMsg, res.status, durationMs);
    }

    const payload = await res.json();
    if (payload && payload.success === false) {
      const errMsg = payload.error || payload.response || "Failed to update document";
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const data = (payload && payload.response !== undefined) ? payload.response : payload;
    return ok(data, "json", durationMs);
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. (${err.message || "Failed to update document"})`,
      503,
      durationMs
    );
  }
}

/**
 * Delete existing document by its ID
 * Endpoint: DELETE /v1/crud/delete_doc?index_name=...&document_id=...
 */
export async function fetchDocumentDelete(indexName, documentId) {
  const startTime = performance.now();
  const cleanIndex = String(indexName || "").trim().replace(/^\/+/, "");
  const cleanDocId = String(documentId || "").trim();

  if (!cleanIndex) {
    return error("Index name is required to delete a document. Usage: document:delete <index> <id>", 400, 0);
  }
  if (!cleanDocId) {
    return error("Document ID is required to delete a document. Usage: document:delete <index> <id>", 400, 0);
  }

  try {
    const res = await apiFetch(
      `${API_BASE_URL}/v1/crud/delete_doc?index_name=${encodeURIComponent(cleanIndex)}&document_id=${encodeURIComponent(cleanDocId)}`,
      { method: "DELETE" }
    );

    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `Failed to delete document with HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.detail?.error) errMsg = typeof errJson.detail.error === "string" ? errJson.detail.error : JSON.stringify(errJson.detail.error);
        else if (errJson?.detail) errMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        else if (errJson?.error) errMsg = typeof errJson.error === "string" ? errJson.error : JSON.stringify(errJson.error);
      } catch {}
      return error(errMsg, res.status, durationMs);
    }

    const payload = await res.json();
    if (payload && payload.success === false) {
      const errMsg = payload.error || payload.response || "Failed to delete document";
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const data = (payload && payload.response !== undefined) ? payload.response : payload;
    return ok(data, "json", durationMs);
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. (${err.message || "Failed to delete document"})`,
      503,
      durationMs
    );
  }
}

/**
 * Parse bulk documents from JSON array, NDJSON, or list of IDs
 */
export function parseBulkDocuments(inputStr) {
  if (!inputStr || typeof inputStr !== "string" || !inputStr.trim()) {
    return { valid: false, error: "Empty bulk documents payload provided.", docs: [] };
  }

  const trimmed = inputStr.trim();

  // 1. Direct JSON array: [ {...}, {...} ] or [ "id1", "id2" ]
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return { valid: true, docs: parsed };
      }
      return { valid: false, error: "Bulk payload must be a JSON array ([ ... ]).", docs: [] };
    } catch (e) {
      return { valid: false, error: `Invalid JSON syntax: ${e.message}`, docs: [] };
    }
  }

  // 2. Single JSON object: wrap in array
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return { valid: true, docs: [parsed] };
      }
    } catch (e) {
      return { valid: false, error: `Invalid JSON syntax: ${e.message}`, docs: [] };
    }
  }

  // 3. Newline-delimited JSON (NDJSON)
  const lines = trimmed.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length > 1 && lines.every(l => l.startsWith("{") && l.endsWith("}"))) {
    try {
      const docs = lines.map(l => JSON.parse(l));
      return { valid: true, docs };
    } catch (e) {
      return { valid: false, error: `Invalid NDJSON syntax: ${e.message}`, docs: [] };
    }
  }

  // 4. Comma-separated or space-separated list of IDs (e.g. for bulk delete: "doc1, doc2, doc3")
  const tokens = trimmed.split(/[\s,]+/).map(t => t.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  if (tokens.length > 0 && !tokens.some(t => t.includes("="))) {
    return { valid: true, docs: tokens.map(id => ({ id })) };
  }

  return { valid: false, error: "Unable to parse bulk documents. Please provide a JSON array ([{...}, {...}]) or comma-separated document IDs.", docs: [] };
}

/**
 * Format bulk operation result items into a table
 */
export function formatBulkResultTable(data) {
  if (!data || typeof data !== "object") return null;
  const items = data.items;
  if (!Array.isArray(items) || items.length === 0) return null;

  const cols = ["action", "id", "status", "result"];
  const rows = items.map(item => {
    const action = Object.keys(item)[0] || "op";
    const details = item[action] || {};
    const resVal = details.result || (details.error ? (details.error.reason || "error") : "ok");
    return {
      action,
      id: details._id || "-",
      status: String(details.status ?? "-"),
      result: String(resVal),
    };
  });

  const widths = {};
  for (const col of cols) {
    widths[col] = col.length;
  }
  for (const row of rows) {
    for (const col of cols) {
      const valLen = String(row[col] ?? "-").length;
      if (valLen > widths[col]) {
        widths[col] = valLen;
      }
    }
  }

  const header = cols.map(c => c.padEnd(widths[c])).join("  ");
  const tableRows = rows.map(row => {
    return cols.map(c => String(row[c] ?? "-").padEnd(widths[c])).join("  ");
  });

  return [header, ...tableRows].join("\n");
}

/**
 * Store and retrieve File objects selected by the user
 */
const selectedFileStore = new Map();

export function registerSelectedFile(file) {
  if (!file) return;
  selectedFileStore.set("latest", file);
  selectedFileStore.set(file.name, file);
  const baseName = file.name.split(/[/\\]/).pop();
  selectedFileStore.set(baseName, file);
  selectedFileStore.set(baseName.toLowerCase(), file);
}

export function getSelectedFile(fileName) {
  if (!fileName) return selectedFileStore.get("latest") || null;
  const clean = String(fileName).trim().replace(/^["']|["']$/g, "");
  const baseName = clean.split(/[/\\]/).pop();
  return selectedFileStore.get(clean) ||
         selectedFileStore.get(baseName) ||
         selectedFileStore.get(baseName.toLowerCase()) ||
         selectedFileStore.get("latest") ||
         null;
}

export async function resolveUploadFile(fileOrPath, defaultName = "data.json") {
  if (!fileOrPath) {
    return selectedFileStore.get("latest") || null;
  }
  if (fileOrPath instanceof File || fileOrPath instanceof Blob) {
    return fileOrPath;
  }
  if (typeof fileOrPath === "string") {
    // 1. Check in-memory store (e.g. from file picker Browse button)
    const matched = getSelectedFile(fileOrPath);
    if (matched) return matched;

    const trimmed = fileOrPath.trim();

    // 2. Direct JSON string array/object
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const parsed = parseBulkDocuments(trimmed);
      if (parsed.valid) {
        return new File([JSON.stringify(parsed.docs)], defaultName, { type: "application/json" });
      }
    }

    // 3. Try fetching from relative path / URL if served by dev server
    try {
      const cleanPath = trimmed.replace(/\\/g, "/");
      const url = cleanPath.startsWith("/") || cleanPath.startsWith("http") ? cleanPath : `/${cleanPath}`;
      const res = await apiFetch(url);
      if (res.ok) {
        const text = await res.text();
        const fileName = cleanPath.split("/").pop() || defaultName;
        return new File([text], fileName, { type: "application/json" });
      }
    } catch {}

    // 4. Try fetching from backend API base if served there
    try {
      const cleanPath = trimmed.replace(/\\/g, "/").replace(/^\/+/, "");
      const fileName = cleanPath.split("/").pop() || defaultName;
      const res = await apiFetch(`${API_BASE_URL}/${cleanPath}`);
      if (res.ok) {
        const text = await res.text();
        return new File([text], fileName, { type: "application/json" });
      }
    } catch {}
  } else if (Array.isArray(fileOrPath)) {
    return new File([JSON.stringify(fileOrPath)], defaultName, { type: "application/json" });
  }

  return selectedFileStore.get("latest") || null;
}

/**
 * Bulk insert multiple documents
 * Endpoint: POST /v1/crud/bulk_insert?index_name=...
 * Body: FormData with file: UploadFile (JSON)
 */
export async function fetchBulkInsert(indexName, fileOrDocs, isJson = false) {
  const startTime = performance.now();
  const cleanIndex = String(indexName || "").trim().replace(/^\/+/, "");
  if (!cleanIndex) {
    return error("Index name is required for bulk insert. Usage: bulk:insert <index> <file.json>", 400, 0);
  }

  const file = await resolveUploadFile(fileOrDocs, "bulk_insert.json");
  if (!file) {
    const hint = typeof fileOrDocs === "string" ? fileOrDocs : "file";
    return error(
      `No .json file selected or found for '${hint}'. Please use the 'Browse' button on the <file> argument chip to select your .json data file.`,
      400,
      0
    );
  }

  try {
    const formData = new FormData();
    const fileName = file.name || "bulk_insert.json";
    formData.append("file", file, fileName);

    const res = await apiFetch(`${API_BASE_URL}/v1/crud/bulk_insert?index_name=${encodeURIComponent(cleanIndex)}`, {
      method: "POST",
      body: formData,
    });

    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `Failed to bulk insert documents with HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.detail?.error) errMsg = typeof errJson.detail.error === "string" ? errJson.detail.error : JSON.stringify(errJson.detail.error);
        else if (errJson?.detail) errMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        else if (errJson?.error) errMsg = typeof errJson.error === "string" ? errJson.error : JSON.stringify(errJson.error);
      } catch {}
      return error(errMsg, res.status, durationMs);
    }

    const payload = await res.json();
    if (payload && payload.success === false) {
      const errMsg = payload.error || payload.response || "Failed to bulk insert documents";
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const data = (payload && payload.response !== undefined) ? payload.response : payload;

    if (isJson) {
      return ok(data, "json", durationMs);
    }
    const formatted = formatBulkResultTable(data);
    if (formatted) {
      return ok(formatted, "table", durationMs);
    }
    return ok(data, "json", durationMs);
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. (${err.message || "Failed to bulk insert documents"})`,
      503,
      durationMs
    );
  }
}

/**
 * Bulk update multiple documents
 * Endpoint: POST /v1/crud/bulk_update?index_name=...
 * Body: FormData with file: UploadFile (JSON)
 */
export async function fetchBulkUpdate(indexName, fileOrDocs, isJson = false) {
  const startTime = performance.now();
  const cleanIndex = String(indexName || "").trim().replace(/^\/+/, "");
  if (!cleanIndex) {
    return error("Index name is required for bulk update. Usage: bulk:update <index> <file.json>", 400, 0);
  }

  const file = await resolveUploadFile(fileOrDocs, "bulk_update.json");
  if (!file) {
    const hint = typeof fileOrDocs === "string" ? fileOrDocs : "file";
    return error(
      `No .json file selected or found for '${hint}'. Please use the 'Browse' button on the <file> argument chip to select your .json data file.`,
      400,
      0
    );
  }

  try {
    const formData = new FormData();
    const fileName = file.name || "bulk_update.json";
    formData.append("file", file, fileName);

    const res = await apiFetch(`${API_BASE_URL}/v1/crud/bulk_update?index_name=${encodeURIComponent(cleanIndex)}`, {
      method: "POST",
      body: formData,
    });

    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `Failed to bulk update documents with HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.detail?.error) errMsg = typeof errJson.detail.error === "string" ? errJson.detail.error : JSON.stringify(errJson.detail.error);
        else if (errJson?.detail) errMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        else if (errJson?.error) errMsg = typeof errJson.error === "string" ? errJson.error : JSON.stringify(errJson.error);
      } catch {}
      return error(errMsg, res.status, durationMs);
    }

    const payload = await res.json();
    if (payload && payload.success === false) {
      const errMsg = payload.error || payload.response || "Failed to bulk update documents";
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const data = (payload && payload.response !== undefined) ? payload.response : payload;

    if (isJson) {
      return ok(data, "json", durationMs);
    }
    const formatted = formatBulkResultTable(data);
    if (formatted) {
      return ok(formatted, "table", durationMs);
    }
    return ok(data, "json", durationMs);
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. (${err.message || "Failed to bulk update documents"})`,
      503,
      durationMs
    );
  }
}

/**
 * Bulk delete multiple documents
 * Endpoint: POST /v1/crud/bulk_delete?index_name=...
 * Body: FormData with file: UploadFile (JSON)
 */
export async function fetchBulkDelete(indexName, fileOrDocs, isJson = false) {
  const startTime = performance.now();
  const cleanIndex = String(indexName || "").trim().replace(/^\/+/, "");
  if (!cleanIndex) {
    return error("Index name is required for bulk delete. Usage: bulk:delete <index> <file.json>", 400, 0);
  }

  const file = await resolveUploadFile(fileOrDocs, "bulk_delete.json");
  if (!file) {
    const hint = typeof fileOrDocs === "string" ? fileOrDocs : "file";
    return error(
      `No .json file selected or found for '${hint}'. Please use the 'Browse' button on the <file> argument chip to select your .json data file.`,
      400,
      0
    );
  }

  try {
    const formData = new FormData();
    const fileName = file.name || "bulk_delete.json";
    formData.append("file", file, fileName);

    const res = await apiFetch(`${API_BASE_URL}/v1/crud/bulk_delete?index_name=${encodeURIComponent(cleanIndex)}`, {
      method: "POST",
      body: formData,
    });

    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `Failed to bulk delete documents with HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.detail?.error) errMsg = typeof errJson.detail.error === "string" ? errJson.detail.error : JSON.stringify(errJson.detail.error);
        else if (errJson?.detail) errMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        else if (errJson?.error) errMsg = typeof errJson.error === "string" ? errJson.error : JSON.stringify(errJson.error);
      } catch {}
      return error(errMsg, res.status, durationMs);
    }

    const payload = await res.json();
    if (payload && payload.success === false) {
      const errMsg = payload.error || payload.response || "Failed to bulk delete documents";
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const data = (payload && payload.response !== undefined) ? payload.response : payload;

    if (isJson) {
      return ok(data, "json", durationMs);
    }
    const formatted = formatBulkResultTable(data);
    if (formatted) {
      return ok(formatted, "table", durationMs);
    }
    return ok(data, "json", durationMs);
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. (${err.message || "Failed to bulk delete documents"})`,
      503,
      durationMs
    );
  }
}
