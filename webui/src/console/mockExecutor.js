/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  MOCK COMMAND EXECUTOR                                  ║
 * ║                                                         ║
 * ║  Simulates realistic API responses.                     ║
 * ║  Replace this entire file with the real executor later. ║
 * ║  The interface (executeCommand) must remain identical.  ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * executeCommand(parsedCommand) returns:
 *   Promise<ExecutionResult>
 *
 * ExecutionResult:
 *   {
 *     status: "ok" | "error",
 *     statusCode: number,          // HTTP-like status
 *     durationMs: number,
 *     format: "json" | "table" | "text",
 *     data: any,                   // parsed object or string
 *   }
 */

import {
  parseBulkDocuments,
  fetchDocumentGet,
  fetchDocumentInsert,
  fetchDocumentUpdate,
  fetchDocumentDelete,
  fetchBulkInsert,
  fetchBulkUpdate,
  fetchBulkDelete,
} from "./documentBuilder.js";

// Fake network latency range
const LATENCY_MIN = 8;
const LATENCY_MAX = 80;

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
function fakeLatency() {
  return Math.floor(Math.random() * (LATENCY_MAX - LATENCY_MIN)) + LATENCY_MIN;
}

// ─── Mock data ─────────────────────────────────────────────

const MOCK_CLUSTER_HEALTH = {
  cluster_name: "elasticease-production",
  status: "green",
  timed_out: false,
  number_of_nodes: 3,
  number_of_data_nodes: 3,
  active_primary_shards: 142,
  active_shards: 284,
  relocating_shards: 0,
  initializing_shards: 0,
  unassigned_shards: 0,
  delayed_unassigned_shards: 0,
  number_of_pending_tasks: 0,
  number_of_in_flight_fetch: 0,
  task_max_waiting_in_queue_millis: 0,
  active_shards_percent_as_number: 100.0,
};

const MOCK_CLUSTER_STATS = {
  _nodes: { total: 3, successful: 3, failed: 0 },
  cluster_name: "elasticease-production",
  cluster_uuid: "xZQMq_XDR8ixbDhqbZ4-Uw",
  status: "green",
  indices: {
    count: 12,
    shards: { total: 284, primaries: 142, replication: 1.0 },
    docs: { count: 6373106, deleted: 2814 },
    store: { size_in_bytes: 2316255744 },
    fielddata: { memory_size_in_bytes: 0, evictions: 0 },
  },
  nodes: {
    count: { total: 3, data: 3, master: 1 },
    os: { mem: { total_in_bytes: 25769803776, free_in_bytes: 5368709120 } },
    jvm: {
      mem: {
        heap_used_in_bytes: 892006400,
        heap_max_in_bytes: 2147483648,
      },
    },
  },
};

const MOCK_CLUSTER_NODES = {
  _nodes: { total: 3, successful: 3, failed: 0 },
  cluster_name: "elasticease-production",
  nodes: {
    "node-1-id": {
      name: "node-primary-01",
      transport_address: "10.0.0.12:9300",
      host: "10.0.0.12",
      ip: "10.0.0.12",
      roles: ["data", "master", "ingest"],
      version: "8.13.0",
    },
    "node-2-id": {
      name: "node-data-02",
      transport_address: "10.0.0.13:9300",
      host: "10.0.0.13",
      ip: "10.0.0.13",
      roles: ["data", "ingest"],
      version: "8.13.0",
    },
    "node-3-id": {
      name: "node-data-03",
      transport_address: "10.0.0.14:9300",
      host: "10.0.0.14",
      ip: "10.0.0.14",
      roles: ["data"],
      version: "8.13.0",
    },
  },
};


function mockIndexInfo(indexName) {
  const docs = { users: 12453, products: 4102005, orders: 320441, logs: 1420891, analytics: 850210 };
  const sizes = { users: "8.2mb", products: "1.24gb", orders: "210.5mb", logs: "842.0mb", analytics: "310.0mb" };
  return {
    [indexName]: {
      aliases: {},
      mappings: {},
      settings: {
        index: {
          creation_date: "1672531200000",
          number_of_shards: "2",
          number_of_replicas: "1",
          uuid: `mock-uuid-${indexName}`,
          provided_name: indexName,
        },
      },
      docs: { count: docs[indexName] ?? Math.floor(Math.random() * 50000), deleted: 0 },
      store: { size_in_bytes: 8601600, size: sizes[indexName] ?? "5.2mb" },
    },
  };
}

function mockSearchResult(index, query) {
  const hits = [
    { _index: index, _id: "1", _score: 1.4, _source: { id: 1, name: "Sample document 1", created: "2026-01-15" } },
    { _index: index, _id: "2", _score: 1.2, _source: { id: 2, name: "Sample document 2", created: "2026-02-22" } },
    { _index: index, _id: "3", _score: 0.9, _source: { id: 3, name: "Sample document 3", created: "2026-03-08" } },
  ];
  return {
    took: Math.floor(Math.random() * 10) + 1,
    timed_out: false,
    _shards: { total: 2, successful: 2, skipped: 0, failed: 0 },
    hits: {
      total: { value: 3, relation: "eq" },
      max_score: 1.4,
      hits: query ? hits.slice(0, 2) : hits,
    },
  };
}

// ─── Main executor ─────────────────────────────────────────

const API_BASE_URL = typeof __API_BASE_URL__ !== "undefined"
  ? __API_BASE_URL__
  : (typeof __BACKEND_BASE_URL__ !== "undefined" ? __BACKEND_BASE_URL__ : "http://localhost:8000");

function formatClusterHealthTable(data) {
  const rows = [
    ["Cluster Name", data.cluster_name ?? "unknown"],
    ["Status", data.status ?? "unknown"],
    ["Total Nodes", data.number_of_nodes ?? 0],
    ["Data Nodes", data.number_of_data_nodes ?? 0],
    ["Active Primary Shards", data.active_primary_shards ?? 0],
    ["Active Total Shards", data.active_shards ?? 0],
    ["Active Shards Percent", `${data.active_shards_percent_as_number ?? 100}%`],
    ["Relocating Shards", data.relocating_shards ?? 0],
    ["Initializing Shards", data.initializing_shards ?? 0],
    ["Unassigned Shards", data.unassigned_shards ?? 0],
    ["Delayed Unassigned Shards", data.delayed_unassigned_shards ?? 0],
    ["Pending Tasks", data.number_of_pending_tasks ?? 0],
    ["In-Flight Fetches", data.number_of_in_flight_fetch ?? 0],
    ["Timed Out", String(data.timed_out ?? false)],
  ];

  const col1Width = 30;
  const header = `${"METRIC".padEnd(col1Width)} VALUE\n${"-".repeat(col1Width)} ------------------`;
  const body = rows.map(([metric, val]) => `${metric.padEnd(col1Width)} ${val}`).join("\n");
  return `${header}\n${body}`;
}

async function fetchClusterHealth(parsed) {
  const startTime = performance.now();
  const rawArg = String(parsed.argMap.json || "").toLowerCase();
  const isJson = rawArg === "true" || rawArg === "1";

  try {
    const res = await fetch(`${API_BASE_URL}/v1/core/cluster_status`);
    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `API request failed with HTTP status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.detail?.error) errMsg = typeof errJson.detail.error === "string" ? errJson.detail.error : JSON.stringify(errJson.detail.error);
        else if (errJson?.detail) errMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        else if (errJson?.error) errMsg = typeof errJson.error === "string" ? errJson.error : JSON.stringify(errJson.error);
      } catch { }
      return error(errMsg, res.status, durationMs);
    }

    const payload = await res.json();
    if (payload && payload.success === false) {
      const errMsg = payload.error || payload.response || "Failed to fetch cluster health";
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const clusterData = (payload && payload.success && payload.response) ? payload.response : payload;

    if (isJson) {
      return ok(clusterData, "json", durationMs);
    } else {
      return ok(formatClusterHealthTable(clusterData), "table", durationMs);
    }
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. Backend is offline or not running (${err.message || "Failed to fetch"}).`,
      503,
      durationMs
    );
  }
}

function formatShardsTable(data) {
  if (!Array.isArray(data)) return String(data);
  if (data.length === 0) return "No shards found.";

  // Columns for the _cat/shards endpoint
  const cols = ["index", "shard", "prirep", "state", "docs", "store", "ip", "node"];
  const widths = {};

  // Initialize widths with header lengths
  for (const col of cols) {
    widths[col] = col.length;
  }

  // Calculate max widths based on data
  for (const row of data) {
    for (const col of cols) {
      const valLen = String(row[col] || "-").length;
      if (valLen > widths[col]) {
        widths[col] = valLen;
      }
    }
  }

  // Generate header
  const header = cols.map(c => c.padEnd(widths[c])).join("  ");

  // Generate rows
  const rows = data.map(row => {
    return cols.map(c => String(row[c] || "-").padEnd(widths[c])).join("  ");
  });

  return [header, ...rows].join("\n");
}

async function fetchShardsList(parsed) {
  const startTime = performance.now();
  const rawUnassigned = String(parsed.argMap?.unassigned ?? parsed.argTokens?.[0] ?? "").toLowerCase().trim();
  const isUnassigned = rawUnassigned === "true" || rawUnassigned === "1" || rawUnassigned === "yes";

  // Json flag can be in named arg or 2nd positional token (or 1st if unassigned omitted)
  let isJson = false;
  if (parsed.argMap?.json !== undefined) {
    const val = String(parsed.argMap.json).toLowerCase().trim();
    isJson = val === "true" || val === "1" || val === "yes";
  } else if (parsed.argTokens?.length >= 2) {
    const val = String(parsed.argTokens[1]).toLowerCase().trim();
    isJson = val === "true" || val === "1" || val === "yes";
  }

  const rawAiArg = String(parsed.argMap?.ai_summarization ?? parsed.argMap?.ai_summary ?? parsed.argTokens?.[2] ?? "").toLowerCase().trim();
  const isAi = rawAiArg === "true" || rawAiArg === "1" || rawAiArg === "yes";

  try {
    const res = await fetch(`${API_BASE_URL}/v1/core/shards?unassigned=${isUnassigned}&ai_summarization=${isAi}`);
    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `API request failed with HTTP status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.detail?.error) errMsg = typeof errJson.detail.error === "string" ? errJson.detail.error : JSON.stringify(errJson.detail.error);
        else if (errJson?.detail) errMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        else if (errJson?.error) errMsg = typeof errJson.error === "string" ? errJson.error : JSON.stringify(errJson.error);
      } catch { }
      return error(errMsg, res.status, durationMs);
    }

    const payload = await res.json();
    if (payload && payload.success === false) {
      const errMsg = payload.error || payload.response || "Failed to fetch shards list";
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const shardsData = (payload && payload.success && payload.response) ? payload.response : payload;
    const aiResponse = (payload && payload.success && payload.ai_response) ? payload.ai_response : null;

    if (isJson) {
      return { ...ok(shardsData, "json", durationMs), aiResponse };
    } else {
      return { ...ok(formatShardsTable(shardsData), "table", durationMs), aiResponse };
    }
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. Backend is offline or not running (${err.message || "Failed to fetch"}).`,
      503,
      durationMs
    );
  }
}

function formatIndexTable(data) {
  if (!Array.isArray(data)) return String(data);
  if (data.length === 0) return "No indices found.";

  const cols = ["health", "status", "index", "uuid", "pri", "rep", "docs.count", "docs.deleted", "store.size"];
  const widths = {};

  for (const col of cols) {
    widths[col] = col.length;
  }

  for (const row of data) {
    for (const col of cols) {
      const valLen = String(row[col] || "-").length;
      if (valLen > widths[col]) {
        widths[col] = valLen;
      }
    }
  }

  const header = cols.map(c => c.padEnd(widths[c])).join("  ");

  const rows = data.map(row => {
    return cols.map(c => String(row[c] || "-").padEnd(widths[c])).join("  ");
  });

  return [header, ...rows].join("\n");
}

async function fetchIndexList(parsed) {
  const startTime = performance.now();
  const rawArg = String(parsed.argMap.json || "").toLowerCase().trim();
  const isJson = rawArg === "true" || rawArg === "1" || rawArg === "yes";
  const rawAiArg = String(parsed.argMap.ai_summary || "").toLowerCase().trim();
  const isAi = rawAiArg === "true" || rawAiArg === "1" || rawAiArg === "yes";

  try {
    const res = await fetch(`${API_BASE_URL}/v1/core/indices?ai_response=${isAi}`);
    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `API request failed with HTTP status ${res.status}`;
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
      const errMsg = payload.error || payload.response || "Failed to fetch index list";
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const indexData = (payload && payload.success && payload.response) ? payload.response : payload;
    const aiResponse = (payload && payload.success && payload.ai_response) ? payload.ai_response : null;

    if (isJson) {
      return { ...ok(indexData, "json", durationMs), aiResponse };
    } else {
      return { ...ok(formatIndexTable(indexData), "table", durationMs), aiResponse };
    }
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. Backend is offline or not running (${err.message || "Failed to fetch"}).`,
      503,
      durationMs
    );
  }
}

function formatNodesTable(data) {
  if (typeof data === "string") return data;
  if (!Array.isArray(data)) return String(data);
  if (data.length === 0) return "No nodes found.";

  const first = data[0] || {};
  const standardCols = ["ip", "heap.percent", "ram.percent", "cpu", "load_1m", "node.role", "master", "name"];
  let cols = standardCols.filter(col => col in first);

  if (cols.length === 0) {
    const altCols = ["ip", "heap.%", "ram.%", "cpu", "node.role", "master", "name"];
    cols = altCols.filter(col => col in first);
  }

  if (cols.length === 0) {
    cols = Object.keys(first);
  }

  const widths = {};
  for (const col of cols) {
    widths[col] = col.length;
  }

  for (const row of data) {
    for (const col of cols) {
      const valLen = String(row[col] ?? "-").length;
      if (valLen > widths[col]) {
        widths[col] = valLen;
      }
    }
  }

  const header = cols.map(c => c.padEnd(widths[c])).join("  ");
  const rows = data.map(row => {
    return cols.map(c => String(row[c] ?? "-").padEnd(widths[c])).join("  ");
  });

  return [header, ...rows].join("\n");
}

async function fetchNodesList(parsed) {
  const startTime = performance.now();
  const rawArg = String(parsed.argMap.json ?? parsed.argTokens[0] ?? "").toLowerCase().trim();
  const isJson = rawArg === "true" || rawArg === "1" || rawArg === "yes";
  const rawAiArg = String(parsed.argMap.ai_summarization ?? parsed.argMap.ai_summary ?? parsed.argTokens[1] ?? "").toLowerCase().trim();
  const isAi = rawAiArg === "true" || rawAiArg === "1" || rawAiArg === "yes";

  try {
    const res = await fetch(`${API_BASE_URL}/v1/core/nodes?ai_response=${isAi}`);
    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `API request failed with HTTP status ${res.status}`;
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
      const errMsg = payload.error || payload.response || "Failed to fetch nodes list";
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const nodesData = (payload && payload.success && payload.response !== undefined) ? payload.response : payload;
    const aiResponse = (payload && (payload.ai_response || payload.ai_summary)) ? (payload.ai_response || payload.ai_summary) : null;

    if (isJson) {
      return { ...ok(nodesData, "json", durationMs), aiResponse };
    } else {
      return { ...ok(formatNodesTable(nodesData), "table", durationMs), aiResponse };
    }
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. Backend is offline or not running (${err.message || "Failed to fetch"}).`,
      503,
      durationMs
    );
  }
}


function formatRowsToTable(rows, cols) {
  if (!rows || rows.length === 0) return null;
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

function formatIndexInspectTable(data, infoType) {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data)) {
    if (data.length === 0) return "No data found.";
    const cols = Object.keys(data[0] || {});
    if (cols.length > 0) return formatRowsToTable(data, cols);
    return null;
  }

  let targetObj = data;
  const topKeys = Object.keys(data);
  if (topKeys.length === 1 && typeof data[topKeys[0]] === "object" && data[topKeys[0]] !== null && !data[topKeys[0]]._shards && !data[topKeys[0]].error) {
    targetObj = data[topKeys[0]];
  }

  const normalizedType = (infoType || "").toLowerCase().trim();

  // 1. Specific mapping inspection: e.g. index:search <index> mapping
  if (normalizedType.includes("mapping")) {
    const mappings = targetObj.mappings || (targetObj.properties ? targetObj : null);
    const properties = mappings?.properties;
    if (properties && typeof properties === "object") {
      const rows = [];
      for (const [field, def] of Object.entries(properties)) {
        let details = "-";
        if (def?.fields) {
          details = Object.keys(def.fields).map(f => `${f} (${def.fields[f].type})`).join(", ");
        } else if (def?.analyzer) {
          details = `analyzer: ${def.analyzer}`;
        } else if (def?.format) {
          details = `format: ${def.format}`;
        }
        rows.push({
          field,
          type: def?.type || (def?.properties ? "object" : "unknown"),
          details,
        });
      }
      if (rows.length > 0) {
        return formatRowsToTable(rows, ["field", "type", "details"]);
      }
    }
  }

  // 2. Specific settings inspection: e.g. index:search <index> settings
  if (normalizedType.includes("setting")) {
    const settings = targetObj.settings?.index || targetObj.settings || targetObj;
    const rows = [];
    if (topKeys[0]) rows.push({ key: "Index Name", value: topKeys[0] });
    function flattenSettings(obj, prefix = "") {
      for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object" && !Array.isArray(v)) {
          flattenSettings(v, fullKey);
        } else {
          rows.push({ key: fullKey, value: String(v) });
        }
      }
    }
    flattenSettings(settings);
    if (rows.length > 0) {
      return formatRowsToTable(rows, ["key", "value"]);
    }
  }

  // 3. Specific stats inspection: e.g. index:search <index> stats
  if (normalizedType.includes("stat")) {
    const primaries = targetObj._all?.primaries || (topKeys[0] && targetObj.indices?.[topKeys[0]]?.primaries) || targetObj.primaries || targetObj;
    const rows = [];
    if (topKeys[0]) rows.push({ key: "Index Name", value: topKeys[0] });
    if (primaries.docs) {
      rows.push({ key: "docs.count", value: String(primaries.docs.count ?? "-") });
      rows.push({ key: "docs.deleted", value: String(primaries.docs.deleted ?? "-") });
    }
    if (primaries.store) {
      const bytes = Number(primaries.store.size_in_bytes ?? 0);
      const mb = bytes > 0 ? ` (${(bytes / (1024 * 1024)).toFixed(2)} MB)` : "";
      rows.push({ key: "store.size", value: `${bytes} bytes${mb}` });
    }
    if (primaries.indexing) {
      rows.push({ key: "indexing.index_total", value: String(primaries.indexing.index_total ?? "-") });
    }
    if (primaries.search) {
      rows.push({ key: "search.query_total", value: String(primaries.search.query_total ?? "-") });
    }
    if (rows.length > 0) {
      return formatRowsToTable(rows, ["key", "value"]);
    }
  }

  // 4. Specific aliases inspection: e.g. index:aliases <index>
  if (normalizedType.includes("alias")) {
    const aliases = targetObj.aliases || (topKeys[0] && targetObj[topKeys[0]]?.aliases) || {};
    const rows = [];
    if (topKeys[0]) rows.push({ key: "Index Name", value: topKeys[0] });
    const aliasNames = Object.keys(aliases);
    if (aliasNames.length === 0) {
      rows.push({ key: "Aliases", value: "No aliases configured" });
    } else {
      for (const a of aliasNames) {
        rows.push({ key: `Alias: ${a}`, value: "Active" });
      }
    }
    if (rows.length > 0) {
      return formatRowsToTable(rows, ["key", "value"]);
    }
  }

  // 5. Specific document count inspection: e.g. index:count <index>
  if (normalizedType.includes("count")) {
    const rows = [];
    if (topKeys[0] && targetObj !== data && !topKeys[0].startsWith("_")) {
      rows.push({ key: "Index Name", value: topKeys[0] });
    }
    if (targetObj.count !== undefined) {
      rows.push({ key: "Document Count", value: String(targetObj.count) });
    }
    if (targetObj._shards) {
      rows.push({ key: "shards.total", value: String(targetObj._shards.total ?? "-") });
      rows.push({ key: "shards.successful", value: String(targetObj._shards.successful ?? "-") });
      rows.push({ key: "shards.skipped", value: String(targetObj._shards.skipped ?? "-") });
      rows.push({ key: "shards.failed", value: String(targetObj._shards.failed ?? "-") });
    }
    if (rows.length > 0) {
      return formatRowsToTable(rows, ["key", "value"]);
    }
  }

  // 6. DEFAULT INSPECT RESPONSE (Comprehensive Index Overview)
  // Combines General Metadata, Aliases, Shard/Doc metrics, Schema Fields, and Index Settings!
  const rows = [];
  const resolvedName = topKeys[0] || targetObj.settings?.index?.provided_name || targetObj.name || "Target Index";
  rows.push({ key: "Index Name", value: resolvedName });

  // Status & Health
  const statusVal = targetObj.status || "open";
  rows.push({ key: "Status", value: statusVal });
  if (targetObj.health) {
    rows.push({ key: "Health", value: String(targetObj.health) });
  }

  // Settings Shards & Replicas
  const idxSettings = targetObj.settings?.index || targetObj.settings || {};
  const priShards = idxSettings.number_of_shards || "1";
  const repShards = idxSettings.number_of_replicas || "1";
  rows.push({ key: "Primary Shards", value: String(priShards) });
  rows.push({ key: "Replicas", value: String(repShards) });
  const numPri = parseInt(priShards, 10);
  const numRep = parseInt(repShards, 10);
  if (!isNaN(numPri) && !isNaN(numRep)) {
    rows.push({ key: "Total Shards", value: String(numPri * (1 + numRep)) });
  }

  // UUID & Version
  if (idxSettings.uuid) {
    rows.push({ key: "UUID", value: String(idxSettings.uuid) });
  }
  if (idxSettings.version?.created) {
    rows.push({ key: "Version Created", value: String(idxSettings.version.created) });
  }

  // Creation Date
  if (idxSettings.creation_date) {
    const rawTs = parseInt(idxSettings.creation_date, 10);
    if (!isNaN(rawTs) && rawTs > 0) {
      const dateStr = new Date(rawTs).toISOString().replace("T", " ").slice(0, 19) + " UTC";
      rows.push({ key: "Creation Date", value: dateStr });
    } else {
      rows.push({ key: "Creation Date", value: String(idxSettings.creation_date) });
    }
  }

  // Aliases
  if (targetObj.aliases) {
    const aliasNames = Object.keys(targetObj.aliases);
    rows.push({ key: "Aliases", value: aliasNames.length > 0 ? aliasNames.join(", ") : "none" });
  }

  // Document & Storage stats if available in payload
  const docs = targetObj.docs || targetObj.primaries?.docs || targetObj.indices?.[resolvedName]?.primaries?.docs;
  if (docs) {
    if (docs.count !== undefined) rows.push({ key: "Docs Count", value: String(docs.count) });
    if (docs.deleted !== undefined) rows.push({ key: "Deleted Docs", value: String(docs.deleted) });
  }
  const store = targetObj.store || targetObj.primaries?.store || targetObj.indices?.[resolvedName]?.primaries?.store;
  if (store?.size_in_bytes !== undefined) {
    const bytes = Number(store.size_in_bytes);
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    rows.push({ key: "Store Size", value: `${mb} MB (${bytes} bytes)` });
  }

  // Mappings Fields
  const mappings = targetObj.mappings || (targetObj.properties ? targetObj : null);
  const properties = mappings?.properties;
  if (properties && typeof properties === "object") {
    const fieldKeys = Object.keys(properties);
    rows.push({ key: "Total Fields", value: `${fieldKeys.length} mapped fields` });
    for (const field of fieldKeys) {
      const def = properties[field];
      let typeDesc = def?.type || (def?.properties ? "object" : "unknown");
      if (def?.fields) {
        typeDesc += ` (multi-field: ${Object.keys(def.fields).join(", ")})`;
      }
      if (def?.analyzer) {
        typeDesc += ` [analyzer: ${def.analyzer}]`;
      }
      rows.push({ key: `field.${field}`, value: typeDesc });
    }
  }

  // Flatten Detailed Settings
  function flattenSettingsObj(obj, prefix = "") {
    for (const [k, v] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        flattenSettingsObj(v, fullKey);
      } else {
        if (!["number_of_shards", "number_of_replicas", "uuid", "provided_name", "creation_date"].includes(fullKey) &&
          !["index.number_of_shards", "index.number_of_replicas", "index.uuid", "index.provided_name", "index.creation_date"].includes(fullKey)) {
          rows.push({ key: `setting.${fullKey}`, value: String(v) });
        }
      }
    }
  }
  if (idxSettings && typeof idxSettings === "object") {
    flattenSettingsObj(idxSettings);
  }

  if (rows.length > 0) {
    return formatRowsToTable(rows, ["key", "value"]);
  }

  return null;
}

function generateMockIndexInspectData(indexName, infoType) {
  const norm = (infoType || "").toLowerCase();
  const name = indexName || "orders";

  if (norm.includes("mapping")) {
    return {
      [name]: {
        mappings: {
          properties: {
            id: { type: "long" },
            order_number: { type: "keyword" },
            customer_id: { type: "keyword" },
            customer_name: { type: "text", fields: { keyword: { type: "keyword" } } },
            items: { type: "nested", properties: { item_id: { type: "long" }, qty: { type: "integer" }, price: { type: "double" } } },
            total_amount: { type: "double" },
            status: { type: "keyword" },
            shipping_address: { type: "text" },
            payment_method: { type: "keyword" },
            created_at: { type: "date" },
            updated_at: { type: "date" },
          },
        },
      },
    };
  }

  if (norm.includes("setting")) {
    return {
      [name]: {
        settings: {
          index: {
            number_of_shards: "2",
            number_of_replicas: "1",
            uuid: "xZQMq_XDR8ixbDhqbZ4-101",
            version: { created: "8130099" },
            provided_name: name,
            creation_date: "1714567890123",
            refresh_interval: "1s",
            max_result_window: "10000",
            routing: { allocation: { include: { _tier_preference: "data_content" } } },
          },
        },
      },
    };
  }

  if (norm.includes("stat")) {
    return {
      _shards: { total: 4, successful: 4, failed: 0 },
      _all: {
        primaries: {
          docs: { count: 320441, deleted: 4102 },
          store: { size_in_bytes: 220725248 },
          indexing: { index_total: 325810 },
          search: { query_total: 84210 },
        },
      },
      indices: {
        [name]: {
          primaries: {
            docs: { count: 320441, deleted: 4102 },
            store: { size_in_bytes: 220725248 },
            indexing: { index_total: 325810 },
            search: { query_total: 84210 },
          },
        },
      },
    };
  }

  // Comprehensive default index inspection response
  return {
    [name]: {
      status: "open",
      health: "green",
      aliases: { [`${name}_alias`]: {}, [`${name}_read`]: {} },
      mappings: {
        properties: {
          id: { type: "long" },
          order_number: { type: "keyword" },
          customer_id: { type: "keyword" },
          customer_name: { type: "text", fields: { keyword: { type: "keyword" } } },
          items: { type: "nested" },
          total_amount: { type: "double" },
          status: { type: "keyword" },
          shipping_address: { type: "text" },
          payment_method: { type: "keyword" },
          created_at: { type: "date" },
          updated_at: { type: "date" },
        },
      },
      settings: {
        index: {
          number_of_shards: "2",
          number_of_replicas: "1",
          uuid: "xZQMq_XDR8ixbDhqbZ4-101",
          version: { created: "8130099" },
          provided_name: name,
          creation_date: "1714567890123",
          refresh_interval: "1s",
          max_result_window: "10000",
          routing: { allocation: { include: { _tier_preference: "data_content" } } },
        },
      },
      docs: { count: 320441, deleted: 4102 },
      store: { size_in_bytes: 220725248 },
    },
  };
}

export async function fetchIndexInspect(parsed, info_type) {
  const startTime = performance.now();

  const indexName = parsed.argMap?.index || parsed.argMap?.index_name || parsed.argTokens?.[0] || "";

  if (!indexName) {
    return error("Missing required argument: <index>", 400, 0);
  }

  // Determine info_type from parameter or fallback to parsed command / args
  let effectiveInfoType = "";
  if (info_type !== undefined && info_type !== null && String(info_type).trim().length > 0) {
    effectiveInfoType = String(info_type).trim();
  } else if (parsed.commandName) {
    const cmd = parsed.commandName.toLowerCase();
    if (cmd === "index:stats" || cmd === "index:stat") effectiveInfoType = "stats";
    else if (cmd === "index:mappings" || cmd === "index:mapping") effectiveInfoType = "mapping";
    else if (cmd === "index:settings" || cmd === "index:setting") effectiveInfoType = "settings";
    else if (cmd === "index:aliases" || cmd === "index:alias") effectiveInfoType = "aliases";
    else if (cmd === "index:count") effectiveInfoType = "count";
    else effectiveInfoType = parsed.argMap?.info_type || "";
  } else {
    effectiveInfoType = parsed.argMap?.info_type || "";
  }

  // If info_type was still not determined and token 1 is not a boolean, treat token 1 as info_type
  let isJson = false;
  let isAi = false;

  const boolTokens = ["true", "false", "yes", "no", "1", "0"];
  if (!effectiveInfoType && parsed.argTokens?.[1] && !boolTokens.includes(String(parsed.argTokens[1]).toLowerCase())) {
    effectiveInfoType = parsed.argTokens[1];
    const rawJsonArg = String(parsed.argMap?.json ?? parsed.argTokens?.[2] ?? "").toLowerCase().trim();
    isJson = rawJsonArg === "true" || rawJsonArg === "1" || rawJsonArg === "yes" || rawJsonArg === "json";
    const rawAiArg = String(parsed.argMap?.ai_summarization ?? parsed.argMap?.ai_summarizatio ?? parsed.argMap?.ai_summary ?? parsed.argTokens?.[3] ?? "").toLowerCase().trim();
    isAi = rawAiArg === "true" || rawAiArg === "1" || rawAiArg === "yes";
  } else {
    const rawJsonArg = String(parsed.argMap?.json ?? parsed.argTokens?.[1] ?? "").toLowerCase().trim();
    isJson = rawJsonArg === "true" || rawJsonArg === "1" || rawJsonArg === "yes" || rawJsonArg === "json";
    const rawAiArg = String(parsed.argMap?.ai_summarization ?? parsed.argMap?.ai_summarizatio ?? parsed.argMap?.ai_summary ?? parsed.argTokens?.[2] ?? "").toLowerCase().trim();
    isAi = rawAiArg === "true" || rawAiArg === "1" || rawAiArg === "yes";
  }

  // Backend coreops.index_info strips leading slash from name and prefixes /_ to info_type:
  // f"/{index_name.strip('/')}/_{info_type}"
  const cleanInfoType = (effectiveInfoType || "").trim().replace(/^_/, "");
  const cleanIndexName = indexName.trim().replace(/^\/+/, "");

  try {
    const res = await fetch(`${API_BASE_URL}/v1/core/index_inspect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: cleanIndexName,
        info_type: cleanInfoType,
        ai_summarization: Boolean(isAi),
      }),
    });

    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `API request failed with HTTP status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.detail?.error) errMsg = typeof errJson.detail.error === "string" ? errJson.detail.error : JSON.stringify(errJson.detail.error);
        else if (errJson?.detail) errMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        else if (errJson?.error) errMsg = typeof errJson.error === "string" ? errJson.error : JSON.stringify(errJson.error);
      } catch { }
      return error(errMsg, res.status, durationMs);
    }

    const payload = await res.json();
    if (payload && payload.success === false) {
      return error(payload.error || payload.response || "Failed to inspect index", 400, durationMs);
    }

    const indexData = (payload && payload.response !== undefined) ? payload.response : payload;
    const aiResponse = (payload && (payload.ai_response || payload.ai_summary)) ? (payload.ai_response || payload.ai_summary) : null;

    if (isJson) {
      return { ...ok(indexData, "json", durationMs), aiResponse };
    } else {
      const formatted = formatIndexInspectTable(indexData, cleanInfoType);
      if (formatted) {
        return { ...ok(formatted, "table", durationMs), aiResponse };
      }
      return { ...ok(indexData, "json", durationMs), aiResponse };
    }
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. Backend is offline or not running (${err.message || "Failed to fetch"}).`,
      503,
      durationMs
    );
  }
}

function formatAllocationTable(data) {
  if (!Array.isArray(data)) return String(data);
  if (data.length === 0) return "No allocation data found.";

  const cols = ["shards", "disk.indices", "disk.used", "disk.avail", "disk.total", "disk.percent", "host", "ip", "node"];
  return formatRowsToTable(data, cols) || JSON.stringify(data, null, 2);
}

async function fetchAllocation(parsed) {
  const startTime = performance.now();
  const rawJson = String(parsed.argMap?.json ?? parsed.argTokens?.[0] ?? "").toLowerCase().trim();
  const isJson = rawJson === "true" || rawJson === "1" || rawJson === "yes";

  const rawAi = String(parsed.argMap?.ai_summarization ?? parsed.argTokens?.[1] ?? "").toLowerCase().trim();
  const isAi = rawAi === "true" || rawAi === "1" || rawAi === "yes";

  try {
    const res = await fetch(`${API_BASE_URL}/v1/core/allocation?ai_summarization=${isAi}`, {
      method: "POST",
    });
    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `API request failed with HTTP status ${res.status}`;
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
      const errMsg = payload.error || payload.response || "Failed to fetch disk allocation";
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const allocData = (payload && payload.success && payload.response !== undefined) ? payload.response : payload;
    const aiResponse = (payload && (payload.ai_response || payload.ai_summary)) ? (payload.ai_response || payload.ai_summary) : null;

    if (isJson) {
      return { ...ok(allocData, "json", durationMs), aiResponse };
    } else {
      return { ...ok(formatAllocationTable(allocData), "table", durationMs), aiResponse };
    }
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. Backend is offline or not running (${err.message || "Failed to fetch"}).`,
      503,
      durationMs
    );
  }
}

export function formatBytes(bytes) {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return "-";
  const num = Number(bytes);
  if (num === 0) return "0 B";
  if (num < 0) return `${num} B`;
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(num) / Math.log(k));
  if (i < 0) return `${num} B`;
  const idx = Math.min(i, sizes.length - 1);
  const val = (num / Math.pow(k, idx)).toFixed(2);
  return `${parseFloat(val)} ${sizes[idx]}`;
}

export function formatTimestamp(ms) {
  if (!ms || isNaN(ms)) return "-";
  try {
    const d = new Date(Number(ms));
    if (isNaN(d.getTime())) return String(ms);
    return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
  } catch {
    return String(ms);
  }
}

export function formatDuration(ms) {
  if (!ms || isNaN(ms)) return "-";
  const totalSeconds = Math.floor(Number(ms) / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 && days === 0) parts.push(`${seconds}s`);
  return parts.join(" ") || "0s";
}

function formatNodeInspectTable(data, infoType) {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return null;

  const cleanType = (infoType || "").toLowerCase().replace(/^_/, "").trim();

  if (data.nodes && typeof data.nodes === "object") {
    const nodeIds = Object.keys(data.nodes);
    if (nodeIds.length === 0) return "No node information found.";

    // Multi-node JVM comparison table
    if (nodeIds.length > 1 && cleanType === "jvm") {
      const rows = [];
      for (const nid of nodeIds) {
        const targetNode = data.nodes[nid];
        const jvm = targetNode.jvm || {};
        const heapMax = jvm.mem?.heap_max_in_bytes ? formatBytes(jvm.mem.heap_max_in_bytes) : "-";
        const heapInit = jvm.mem?.heap_init_in_bytes ? formatBytes(jvm.mem.heap_init_in_bytes) : "-";
        const gc = Array.isArray(jvm.gc_collectors) ? jvm.gc_collectors.join(", ") : String(jvm.gc_collectors || "-");
        const uptime = jvm.start_time_in_millis ? formatDuration(Date.now() - jvm.start_time_in_millis) : "-";

        rows.push({
          NODE: targetNode.name || nid,
          IP: targetNode.ip || "-",
          "JVM VERSION": jvm.version || "-",
          "VM NAME": jvm.vm_name || "-",
          "HEAP INIT": heapInit,
          "HEAP MAX": heapMax,
          "GC COLLECTORS": gc,
          UPTIME: uptime,
        });
      }
      return formatRowsToTable(rows, ["NODE", "IP", "JVM VERSION", "VM NAME", "HEAP INIT", "HEAP MAX", "GC COLLECTORS", "UPTIME"]);
    }

    // Single node or detailed inspection
    if (nodeIds.length === 1 || cleanType === "jvm") {
      const targetNode = data.nodes[nodeIds[0]];
      const rows = [];
      if (targetNode.name) rows.push({ PROPERTY: "Node Name", VALUE: String(targetNode.name) });
      if (targetNode.ip) rows.push({ PROPERTY: "IP Address", VALUE: String(targetNode.ip) });
      if (targetNode.roles) {
        rows.push({ PROPERTY: "Roles", VALUE: Array.isArray(targetNode.roles) ? targetNode.roles.join(", ") : String(targetNode.roles) });
      }

      if (cleanType === "jvm") {
        const jvm = targetNode.jvm || targetNode;
        if (jvm.pid) rows.push({ PROPERTY: "Process ID (PID)", VALUE: String(jvm.pid) });
        if (jvm.version) rows.push({ PROPERTY: "JVM Version", VALUE: String(jvm.version) });
        if (jvm.vm_name) rows.push({ PROPERTY: "VM Name", VALUE: String(jvm.vm_name) });
        if (jvm.vm_vendor) rows.push({ PROPERTY: "VM Vendor", VALUE: String(jvm.vm_vendor) });
        if (jvm.vm_version) rows.push({ PROPERTY: "VM Version", VALUE: String(jvm.vm_version) });
        if (jvm.start_time_in_millis) {
          rows.push({ PROPERTY: "Start Time", VALUE: formatTimestamp(jvm.start_time_in_millis) });
          rows.push({ PROPERTY: "Uptime", VALUE: formatDuration(Date.now() - jvm.start_time_in_millis) });
        }

        // Memory
        if (jvm.mem) {
          if (jvm.mem.heap_init_in_bytes !== undefined) rows.push({ PROPERTY: "Heap Initial", VALUE: formatBytes(jvm.mem.heap_init_in_bytes) });
          if (jvm.mem.heap_max_in_bytes !== undefined) rows.push({ PROPERTY: "Heap Max", VALUE: formatBytes(jvm.mem.heap_max_in_bytes) });
          if (jvm.mem.non_heap_init_in_bytes !== undefined) rows.push({ PROPERTY: "Non-Heap Initial", VALUE: formatBytes(jvm.mem.non_heap_init_in_bytes) });
          if (jvm.mem.non_heap_max_in_bytes !== undefined) rows.push({ PROPERTY: "Non-Heap Max", VALUE: formatBytes(jvm.mem.non_heap_max_in_bytes) });
          if (jvm.mem.direct_max_in_bytes !== undefined) rows.push({ PROPERTY: "Direct Max Memory", VALUE: formatBytes(jvm.mem.direct_max_in_bytes) });
        }

        // GC & Pools
        if (jvm.gc_collectors) {
          rows.push({ PROPERTY: "GC Collectors", VALUE: Array.isArray(jvm.gc_collectors) ? jvm.gc_collectors.join(", ") : String(jvm.gc_collectors) });
        }
        if (jvm.memory_pools) {
          rows.push({ PROPERTY: "Memory Pools", VALUE: Array.isArray(jvm.memory_pools) ? jvm.memory_pools.join(", ") : String(jvm.memory_pools) });
        }
        if (jvm.using_compressed_ordinary_object_pointers !== undefined) {
          rows.push({ PROPERTY: "Compressed OOPs", VALUE: String(jvm.using_compressed_ordinary_object_pointers) });
        }
        if (jvm.using_bundled_jdk !== undefined) {
          rows.push({ PROPERTY: "Bundled JDK", VALUE: String(jvm.using_bundled_jdk) });
        }

        // Configured Input Arguments
        if (Array.isArray(jvm.input_arguments) && jvm.input_arguments.length > 0) {
          rows.push({ PROPERTY: "Total JVM Arguments", VALUE: `${jvm.input_arguments.length} flags configured` });
          jvm.input_arguments.forEach((arg, i) => {
            rows.push({ PROPERTY: `JVM Arg [${i + 1}]`, VALUE: String(arg) });
          });
        }

        return formatRowsToTable(rows, ["PROPERTY", "VALUE"]);
      }

      // For other info types (settings, os, process, etc.)
      const infoSection = cleanType && targetNode[cleanType] !== undefined ? targetNode[cleanType] : targetNode;

      function flattenSingle(obj, prefix = "") {
        if (Array.isArray(obj)) {
          if (obj.length === 0) {
            rows.push({ PROPERTY: prefix || cleanType, VALUE: "None" });
          } else if (obj.every(x => typeof x !== "object" || x === null)) {
            rows.push({ PROPERTY: prefix || cleanType, VALUE: obj.join(", ") });
          } else {
            obj.forEach((item, idx) => {
              if (item && typeof item === "object") {
                const label = item.name ? `${prefix ? `${prefix}.` : ""}${item.name}` : `${prefix ? `${prefix}[${idx}]` : `[${idx}]`}`;
                const details = [
                  item.version ? `v${item.version}` : null,
                  item.description || null,
                  item.type || null,
                ].filter(Boolean).join(" - ") || JSON.stringify(item);
                rows.push({ PROPERTY: label, VALUE: details });
              } else {
                rows.push({ PROPERTY: `${prefix}[${idx}]`, VALUE: String(item ?? "-") });
              }
            });
          }
          return;
        }

        if (obj && typeof obj === "object") {
          for (const [k, v] of Object.entries(obj)) {
            if (k === "name" || k === "ip" || k === "roles") continue;
            const fullKey = prefix ? `${prefix}.${k}` : k;
            if (v && typeof v === "object" && !Array.isArray(v)) {
              flattenSingle(v, fullKey);
            } else if (Array.isArray(v)) {
              if (v.length === 0) {
                rows.push({ PROPERTY: fullKey, VALUE: "None" });
              } else if (v.every(x => typeof x !== "object" || x === null)) {
                rows.push({ PROPERTY: fullKey, VALUE: v.join(", ") });
              } else {
                v.forEach((item, idx) => {
                  if (item && typeof item === "object" && item.type) {
                    rows.push({ PROPERTY: `${fullKey}[${idx}]`, VALUE: item.type });
                  } else if (item && typeof item === "object" && item.name) {
                    rows.push({ PROPERTY: `${fullKey}.${item.name}`, VALUE: item.version ? `v${item.version}` : JSON.stringify(item) });
                  } else {
                    flattenSingle(item, `${fullKey}[${idx}]`);
                  }
                });
              }
            } else if (typeof v === "number" && (k.endsWith("_bytes") || k.endsWith("_in_bytes"))) {
              rows.push({ PROPERTY: fullKey.replace(/_in_bytes$/, "").replace(/_bytes$/, ""), VALUE: formatBytes(v) });
            } else if (typeof v === "number" && (k.endsWith("_millis") || k.endsWith("_in_millis"))) {
              if (k.includes("time") || k.includes("timestamp")) {
                rows.push({ PROPERTY: fullKey, VALUE: formatTimestamp(v) });
              } else {
                rows.push({ PROPERTY: fullKey, VALUE: `${v}ms` });
              }
            } else {
              rows.push({ PROPERTY: fullKey, VALUE: String(v ?? "-") });
            }
          }
        } else {
          rows.push({ PROPERTY: prefix || cleanType, VALUE: String(obj ?? "-") });
        }
      }

      flattenSingle(infoSection);
      if (rows.length > 0) return formatRowsToTable(rows, ["PROPERTY", "VALUE"]);
      return null;
    } else {
      // Multiple nodes for non-jvm types
      const rows = [];
      for (const nid of nodeIds) {
        const targetNode = data.nodes[nid];
        const nodeName = targetNode.name || nid;
        const infoSection = cleanType && targetNode[cleanType] !== undefined ? targetNode[cleanType] : targetNode;

        function flattenMulti(obj, prefix = "") {
          if (Array.isArray(obj)) {
            if (obj.length === 0) {
              rows.push({ NODE: nodeName, PROPERTY: prefix || cleanType, VALUE: "None" });
            } else if (obj.every(x => typeof x !== "object" || x === null)) {
              rows.push({ NODE: nodeName, PROPERTY: prefix || cleanType, VALUE: obj.join(", ") });
            } else {
              obj.forEach((item, idx) => {
                if (item && typeof item === "object") {
                  const label = item.name ? `${prefix ? `${prefix}.` : ""}${item.name}` : `${prefix ? `${prefix}[${idx}]` : `[${idx}]`}`;
                  const details = [
                    item.version ? `v${item.version}` : null,
                    item.description || null,
                    item.type || null,
                  ].filter(Boolean).join(" - ") || JSON.stringify(item);
                  rows.push({ NODE: nodeName, PROPERTY: label, VALUE: details });
                } else {
                  rows.push({ NODE: nodeName, PROPERTY: `${prefix}[${idx}]`, VALUE: String(item ?? "-") });
                }
              });
            }
            return;
          }

          if (obj && typeof obj === "object") {
            for (const [k, v] of Object.entries(obj)) {
              if (k === "name" || k === "ip" || k === "roles") continue;
              const fullKey = prefix ? `${prefix}.${k}` : k;
              if (v && typeof v === "object" && !Array.isArray(v)) {
                flattenMulti(v, fullKey);
              } else if (Array.isArray(v)) {
                if (v.length === 0) {
                  rows.push({ NODE: nodeName, PROPERTY: fullKey, VALUE: "None" });
                } else if (v.every(x => typeof x !== "object" || x === null)) {
                  rows.push({ NODE: nodeName, PROPERTY: fullKey, VALUE: v.join(", ") });
                } else {
                  v.forEach((item, idx) => {
                    if (item && typeof item === "object" && item.type) {
                      rows.push({ NODE: nodeName, PROPERTY: `${fullKey}[${idx}]`, VALUE: item.type });
                    } else if (item && typeof item === "object" && item.name) {
                      rows.push({ NODE: nodeName, PROPERTY: `${fullKey}.${item.name}`, VALUE: item.version ? `v${item.version}` : JSON.stringify(item) });
                    } else {
                      flattenMulti(item, `${fullKey}[${idx}]`);
                    }
                  });
                }
              } else if (typeof v === "number" && (k.endsWith("_bytes") || k.endsWith("_in_bytes"))) {
                rows.push({ NODE: nodeName, PROPERTY: fullKey.replace(/_in_bytes$/, "").replace(/_bytes$/, ""), VALUE: formatBytes(v) });
              } else if (typeof v === "number" && (k.endsWith("_millis") || k.endsWith("_in_millis"))) {
                if (k.includes("time") || k.includes("timestamp")) {
                  rows.push({ NODE: nodeName, PROPERTY: fullKey, VALUE: formatTimestamp(v) });
                } else {
                  rows.push({ NODE: nodeName, PROPERTY: fullKey, VALUE: `${v}ms` });
                }
              } else {
                rows.push({ NODE: nodeName, PROPERTY: fullKey, VALUE: String(v ?? "-") });
              }
            }
          } else {
            rows.push({ NODE: nodeName, PROPERTY: prefix || cleanType, VALUE: String(obj ?? "-") });
          }
        }

        flattenMulti(infoSection);
      }
      if (rows.length > 0) return formatRowsToTable(rows, ["NODE", "PROPERTY", "VALUE"]);
      return null;
    }
  }

  // Fallback for single targetNode object
  const rows = [];
  if (data.name) rows.push({ PROPERTY: "Node Name", VALUE: String(data.name) });
  if (data.ip) rows.push({ PROPERTY: "IP Address", VALUE: String(data.ip) });
  const infoSection = cleanType && data[cleanType] !== undefined ? data[cleanType] : data;

  function flattenDirect(obj, prefix = "") {
    for (const [k, v] of Object.entries(obj)) {
      if (k === "name" || k === "ip" || k === "roles") continue;
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        flattenDirect(v, fullKey);
      } else if (typeof v === "number" && (k.endsWith("_bytes") || k.endsWith("_in_bytes"))) {
        rows.push({ PROPERTY: fullKey, VALUE: formatBytes(v) });
      } else {
        rows.push({ PROPERTY: fullKey, VALUE: Array.isArray(v) ? v.join(", ") : String(v ?? "-") });
      }
    }
  }
  flattenDirect(infoSection);
  if (rows.length > 0) return formatRowsToTable(rows, ["PROPERTY", "VALUE"]);
  return null;
}

function formatNodeStatsTable(data, metricFilter = "") {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return null;

  if (data.nodes && typeof data.nodes === "object") {
    const nodeIds = Object.keys(data.nodes);
    if (nodeIds.length === 0) return "No node statistics found.";

    // Multi-node comparison table when no specific metric is filtered
    if (nodeIds.length > 1 && !metricFilter) {
      const rows = [];
      for (const nid of nodeIds) {
        const n = data.nodes[nid];
        const cpu = n.os?.cpu?.percent ?? n.process?.cpu?.percent ?? "-";
        const memPercent = n.os?.mem?.used_percent ?? "-";
        const heapUsedBytes = n.jvm?.mem?.heap_used_in_bytes;
        const heapMaxBytes = n.jvm?.mem?.heap_max_in_bytes;
        const heapPercent = n.jvm?.mem?.heap_used_percent ?? (heapUsedBytes && heapMaxBytes ? Math.round((heapUsedBytes / heapMaxBytes) * 100) : "-");
        const docs = n.indices?.docs?.count !== undefined ? Number(n.indices.docs.count).toLocaleString() : "-";
        const store = n.indices?.store?.size_in_bytes !== undefined ? formatBytes(n.indices.store.size_in_bytes) : "-";
        const httpOpen = n.http?.current_open ?? "-";

        rows.push({
          NODE: n.name || nid,
          IP: n.ip || n.host || "-",
          "CPU%": cpu !== "-" ? `${cpu}%` : "-",
          "RAM%": memPercent !== "-" ? `${memPercent}%` : "-",
          "HEAP%": heapPercent !== "-" ? `${heapPercent}%` : "-",
          "HEAP USED": heapUsedBytes !== undefined ? formatBytes(heapUsedBytes) : "-",
          DOCS: docs,
          "STORE SIZE": store,
          "HTTP OPEN": String(httpOpen),
        });
      }
      return formatRowsToTable(rows, ["NODE", "IP", "CPU%", "RAM%", "HEAP%", "HEAP USED", "DOCS", "STORE SIZE", "HTTP OPEN"]);
    }

    // Single node or detailed metric drilldown -> Key-Value table
    const targetNode = data.nodes[nodeIds[0]];
    const rows = [];
    const nodeName = targetNode.name || nodeIds[0];

    rows.push({ PROPERTY: "Node Name", VALUE: String(nodeName) });
    if (targetNode.ip) rows.push({ PROPERTY: "IP Address", VALUE: String(targetNode.ip) });
    if (targetNode.roles) {
      rows.push({ PROPERTY: "Roles", VALUE: Array.isArray(targetNode.roles) ? targetNode.roles.join(", ") : String(targetNode.roles) });
    }

    // Specific metric filter drilldown (e.g. metric="jvm")
    if (metricFilter) {
      const section = targetNode[metricFilter];
      if (section && typeof section === "object") {
        function flattenMetric(obj, prefix = "") {
          for (const [k, v] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${k}` : k;
            if (v && typeof v === "object" && !Array.isArray(v)) {
              flattenMetric(v, fullKey);
            } else if (Array.isArray(v)) {
              rows.push({ PROPERTY: fullKey, VALUE: v.map(x => typeof x === "object" ? JSON.stringify(x) : String(x)).join(", ") });
            } else if (typeof v === "number" && (k.endsWith("_bytes") || k.endsWith("_in_bytes"))) {
              rows.push({ PROPERTY: fullKey.replace(/_in_bytes$/, "").replace(/_bytes$/, ""), VALUE: formatBytes(v) });
            } else if (typeof v === "number" && (k.endsWith("_millis") || k.endsWith("_in_millis"))) {
              if (k.includes("time") || k.includes("timestamp")) {
                rows.push({ PROPERTY: fullKey, VALUE: formatTimestamp(v) });
              } else {
                rows.push({ PROPERTY: fullKey, VALUE: `${v}ms` });
              }
            } else {
              rows.push({ PROPERTY: fullKey, VALUE: String(v ?? "-") });
            }
          }
        }
        flattenMetric(section);
        return formatRowsToTable(rows, ["PROPERTY", "VALUE"]);
      }
    }

    // Default detailed summary
    // 1. Operating System
    if (targetNode.os) {
      if (targetNode.os.cpu?.percent !== undefined) rows.push({ PROPERTY: "OS CPU Usage", VALUE: `${targetNode.os.cpu.percent}%` });
      if (targetNode.os.cpu?.load_average?.["1m"] !== undefined) rows.push({ PROPERTY: "OS Load Average (1m)", VALUE: String(targetNode.os.cpu.load_average["1m"]) });
      if (targetNode.os.mem?.used_in_bytes && targetNode.os.mem?.total_in_bytes) {
        rows.push({
          PROPERTY: "OS Memory Used",
          VALUE: `${formatBytes(targetNode.os.mem.used_in_bytes)} / ${formatBytes(targetNode.os.mem.total_in_bytes)} (${targetNode.os.mem.used_percent ?? 0}%)`
        });
      }
      if (targetNode.os.mem?.free_in_bytes !== undefined) rows.push({ PROPERTY: "OS Memory Free", VALUE: formatBytes(targetNode.os.mem.free_in_bytes) });
    }

    // 2. Process
    if (targetNode.process) {
      if (targetNode.process.cpu?.percent !== undefined) rows.push({ PROPERTY: "Process CPU Usage", VALUE: `${targetNode.process.cpu.percent}%` });
      if (targetNode.process.open_file_descriptors !== undefined && targetNode.process.max_file_descriptors !== undefined) {
        rows.push({ PROPERTY: "Open File Descriptors", VALUE: `${targetNode.process.open_file_descriptors} / ${targetNode.process.max_file_descriptors}` });
      }
    }

    // 3. JVM
    if (targetNode.jvm) {
      if (targetNode.jvm.uptime_in_millis) rows.push({ PROPERTY: "JVM Uptime", VALUE: formatDuration(targetNode.jvm.uptime_in_millis) });
      if (targetNode.jvm.mem?.heap_used_in_bytes && targetNode.jvm.mem?.heap_max_in_bytes) {
        rows.push({
          PROPERTY: "JVM Heap Memory",
          VALUE: `${formatBytes(targetNode.jvm.mem.heap_used_in_bytes)} / ${formatBytes(targetNode.jvm.mem.heap_max_in_bytes)} (${targetNode.jvm.mem.heap_used_percent ?? 0}%)`
        });
      }
      if (targetNode.jvm.mem?.heap_committed_in_bytes !== undefined) rows.push({ PROPERTY: "JVM Heap Committed", VALUE: formatBytes(targetNode.jvm.mem.heap_committed_in_bytes) });
      if (targetNode.jvm.mem?.non_heap_used_in_bytes !== undefined) rows.push({ PROPERTY: "JVM Non-Heap Used", VALUE: formatBytes(targetNode.jvm.mem.non_heap_used_in_bytes) });
      if (targetNode.jvm.gc?.collectors?.young) {
        rows.push({
          PROPERTY: "JVM GC Young Gen",
          VALUE: `${Number(targetNode.jvm.gc.collectors.young.collection_count ?? 0).toLocaleString()} collections (${targetNode.jvm.gc.collectors.young.collection_time_in_millis ?? 0}ms)`
        });
      }
      if (targetNode.jvm.gc?.collectors?.old) {
        rows.push({
          PROPERTY: "JVM GC Old Gen",
          VALUE: `${Number(targetNode.jvm.gc.collectors.old.collection_count ?? 0).toLocaleString()} collections (${targetNode.jvm.gc.collectors.old.collection_time_in_millis ?? 0}ms)`
        });
      }
      if (targetNode.jvm.threads) {
        rows.push({ PROPERTY: "JVM Threads", VALUE: `${targetNode.jvm.threads.count ?? 0} active (Peak: ${targetNode.jvm.threads.peak_count ?? 0})` });
      }
    }

    // 4. Indices
    if (targetNode.indices) {
      if (targetNode.indices.docs?.count !== undefined) rows.push({ PROPERTY: "Indices Total Docs", VALUE: Number(targetNode.indices.docs.count).toLocaleString() });
      if (targetNode.indices.docs?.deleted !== undefined) rows.push({ PROPERTY: "Indices Deleted Docs", VALUE: Number(targetNode.indices.docs.deleted).toLocaleString() });
      if (targetNode.indices.store?.size_in_bytes !== undefined) rows.push({ PROPERTY: "Indices Store Size", VALUE: formatBytes(targetNode.indices.store.size_in_bytes) });
      if (targetNode.indices.indexing?.index_total !== undefined) rows.push({ PROPERTY: "Indexing Operations Total", VALUE: Number(targetNode.indices.indexing.index_total).toLocaleString() });
      if (targetNode.indices.search?.query_total !== undefined) rows.push({ PROPERTY: "Search Queries Total", VALUE: Number(targetNode.indices.search.query_total).toLocaleString() });
      if (targetNode.indices.query_cache) {
        rows.push({ PROPERTY: "Query Cache Hits / Misses", VALUE: `${Number(targetNode.indices.query_cache.hit_count ?? 0).toLocaleString()} / ${Number(targetNode.indices.query_cache.miss_count ?? 0).toLocaleString()}` });
      }
      if (targetNode.indices.fielddata?.memory_size_in_bytes !== undefined) rows.push({ PROPERTY: "Fielddata Memory", VALUE: formatBytes(targetNode.indices.fielddata.memory_size_in_bytes) });
      if (targetNode.indices.segments?.count !== undefined) rows.push({ PROPERTY: "Lucene Segments Count", VALUE: String(targetNode.indices.segments.count) });
    }

    // 5. File System
    if (targetNode.fs?.total) {
      const fsTotal = targetNode.fs.total.total_in_bytes;
      const fsAvail = targetNode.fs.total.available_in_bytes;
      if (fsTotal && fsAvail) {
        const pctFree = Math.round((fsAvail / fsTotal) * 100);
        rows.push({ PROPERTY: "Disk Storage (FS)", VALUE: `${formatBytes(fsAvail)} available of ${formatBytes(fsTotal)} (${pctFree}% free)` });
      }
    }

    // 6. HTTP & Transport
    if (targetNode.http) {
      rows.push({ PROPERTY: "HTTP Current Connections", VALUE: String(targetNode.http.current_open ?? 0) });
      rows.push({ PROPERTY: "HTTP Total Connections Opened", VALUE: Number(targetNode.http.total_opened ?? 0).toLocaleString() });
    }
    if (targetNode.transport) {
      if (targetNode.transport.rx_count !== undefined) rows.push({ PROPERTY: "Transport Packets Rx / Tx", VALUE: `${Number(targetNode.transport.rx_count).toLocaleString()} / ${Number(targetNode.transport.tx_count ?? 0).toLocaleString()}` });
      if (targetNode.transport.rx_size_in_bytes !== undefined) rows.push({ PROPERTY: "Transport Data Rx / Tx", VALUE: `${formatBytes(targetNode.transport.rx_size_in_bytes)} / ${formatBytes(targetNode.transport.tx_size_in_bytes ?? 0)}` });
    }

    return formatRowsToTable(rows, ["PROPERTY", "VALUE"]);
  }

  return null;
}

export async function fetchNodeInspect(parsed, defaultInfoType) {
  const startTime = performance.now();
  const boolTokens = ["true", "false", "yes", "no", "1", "0"];

  let rawNode = parsed.argMap?.node || parsed.argMap?.id_or_name || parsed.argMap?.name || "";
  let rawInfoType = defaultInfoType || parsed.argMap?.info_type || "";
  let rawAi = parsed.argMap?.ai_summarization ?? parsed.argMap?.ai_summarizatio ?? parsed.argMap?.ai_summary;
  let rawJson = parsed.argMap?.json;

  // Handle positional tokens if not provided as named args
  if (!rawNode && parsed.argTokens?.[0]) {
    const tok0 = String(parsed.argTokens[0]).toLowerCase();
    if (boolTokens.includes(tok0)) {
      if (rawJson === undefined) rawJson = tok0;
    } else {
      rawNode = parsed.argTokens[0];
    }
  }

  if (rawJson === undefined && parsed.argTokens?.[1]) {
    const tok1 = String(parsed.argTokens[1]).toLowerCase();
    if (boolTokens.includes(tok1)) {
      rawJson = tok1;
    }
  }

  if (rawAi === undefined && parsed.argTokens?.[2]) {
    const tok2 = String(parsed.argTokens[2]).toLowerCase();
    if (boolTokens.includes(tok2)) {
      rawAi = tok2;
    }
  }

  // Infer info_type from commandName if still not set
  if (!rawInfoType && parsed.commandName && parsed.commandName.startsWith("node:")) {
    rawInfoType = parsed.commandName.slice(5);
  }

  const cleanInfoType = (rawInfoType || "").trim().replace(/^_/, "");
  const cleanNode = String(rawNode || "").trim();

  const isAi = String(rawAi ?? "").toLowerCase() === "true" || String(rawAi ?? "") === "1" || String(rawAi ?? "").toLowerCase() === "yes";
  const isJson = String(rawJson ?? "").toLowerCase() === "true" || String(rawJson ?? "") === "1" || String(rawJson ?? "").toLowerCase() === "yes" || String(rawJson ?? "").toLowerCase() === "json";

  if (!cleanInfoType) {
    return error("Missing required parameter: info_type", 400, 0);
  }

  try {
    const params = new URLSearchParams();
    if (cleanNode) {
      params.append("id_or_name", cleanNode);
    }
    params.append("info_type", cleanInfoType);
    params.append("ai_summarization", String(isAi));

    const url = `${API_BASE_URL}/v1/core/inspect_node?${params.toString()}`;
    const res = await fetch(url, { method: "GET" });
    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `API request failed with HTTP status ${res.status}`;
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
      const errMsg = payload.error || payload.response || "Failed to inspect node";
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const nodeData = (payload && payload.success && payload.response !== undefined) ? payload.response : payload;
    const aiResponse = (payload && (payload.ai_response || payload.ai_summary)) ? (payload.ai_response || payload.ai_summary) : null;

    if (isJson) {
      return { ...ok(nodeData, "json", durationMs), aiResponse };
    } else {
      const formatted = formatNodeInspectTable(nodeData, cleanInfoType);
      if (formatted) {
        return { ...ok(formatted, "table", durationMs), aiResponse };
      }
      return { ...ok(nodeData, "json", durationMs), aiResponse };
    }
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. Backend is offline or not running (${err.message || "Failed to fetch"}).`,
      503,
      durationMs
    );
  }
}

export async function fetchNodeStats(parsed) {
  const startTime = performance.now();
  const boolTokens = ["true", "false", "yes", "no", "1", "0"];

  let rawNode = parsed.argMap?.node || parsed.argMap?.id_or_name || parsed.argMap?.name || "";
  let rawMetric = parsed.argMap?.metric || "";
  let rawAi = parsed.argMap?.ai_summarization ?? parsed.argMap?.ai_summarizatio ?? parsed.argMap?.ai_summary;
  let rawJson = parsed.argMap?.json;

  // Positional arguments: node:stats [node] [metric] [json] [ai_summarization]
  if (!rawNode && parsed.argTokens?.[0]) {
    const tok0 = String(parsed.argTokens[0]).toLowerCase();
    if (boolTokens.includes(tok0)) {
      if (rawJson === undefined) rawJson = tok0;
    } else {
      rawNode = parsed.argTokens[0];
    }
  }

  if (!rawMetric && parsed.argTokens?.[1]) {
    const tok1 = String(parsed.argTokens[1]).toLowerCase();
    if (boolTokens.includes(tok1)) {
      if (rawJson === undefined) rawJson = tok1;
    } else {
      rawMetric = parsed.argTokens[1];
    }
  }

  if (rawJson === undefined && parsed.argTokens?.[2]) {
    const tok2 = String(parsed.argTokens[2]).toLowerCase();
    if (boolTokens.includes(tok2)) {
      rawJson = tok2;
    }
  }

  if (rawAi === undefined && parsed.argTokens?.[3]) {
    const tok3 = String(parsed.argTokens[3]).toLowerCase();
    if (boolTokens.includes(tok3)) {
      rawAi = tok3;
    }
  }

  const cleanNode = String(rawNode || "").trim();
  const cleanMetric = String(rawMetric || "").trim().toLowerCase();
  const isAi = String(rawAi ?? "").toLowerCase() === "true" || String(rawAi ?? "") === "1" || String(rawAi ?? "").toLowerCase() === "yes";
  const isJson = String(rawJson ?? "").toLowerCase() === "true" || String(rawJson ?? "") === "1" || String(rawJson ?? "").toLowerCase() === "yes" || String(rawJson ?? "").toLowerCase() === "json";

  try {
    const params = new URLSearchParams();
    if (cleanNode) {
      params.append("id_or_name", cleanNode);
    }
    // Backend inspect_node route handles info_type="stats" by calling ES /_nodes/stats or /_nodes/{id}/stats
    params.append("info_type", "stats");
    params.append("ai_summarization", String(isAi));

    const url = `${API_BASE_URL}/v1/core/inspect_node?${params.toString()}`;
    const res = await fetch(url, { method: "GET" });
    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `API request failed with HTTP status ${res.status}`;
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
      const errMsg = payload.error || payload.response || "Failed to inspect node statistics";
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const nodeData = (payload && payload.success && payload.response !== undefined) ? payload.response : payload;
    const aiResponse = (payload && (payload.ai_response || payload.ai_summary)) ? (payload.ai_response || payload.ai_summary) : null;

    if (isJson) {
      return { ...ok(nodeData, "json", durationMs), aiResponse };
    } else {
      const formatted = formatNodeStatsTable(nodeData, cleanMetric);
      if (formatted) {
        return { ...ok(formatted, "table", durationMs), aiResponse };
      }
      return { ...ok(nodeData, "json", durationMs), aiResponse };
    }
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. Backend is offline or not running (${err.message || "Failed to fetch"}).`,
      503,
      durationMs
    );
  }
}

export async function fetchIndexCreate(indexName, withMapping = false, mapping = {}) {
  const startTime = performance.now();
  const cleanName = String(indexName || "").trim().replace(/^\/+/, "");
  if (!cleanName) {
    return error("Index name is required to create an index.", 400, 0);
  }

  // Ensure leading slash for backend client URL concatenation: base_url + endpoint
  const targetName = `/${cleanName}`;

  try {
    const res = await fetch(`${API_BASE_URL}/v1/crud/create_index`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        index_name: targetName,
        with_mapping: Boolean(withMapping),
        mapping: mapping && typeof mapping === "object" ? mapping : {},
      }),
    });

    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `Failed to create index with HTTP ${res.status}`;
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
      const errMsg = payload.error || payload.response || `Failed to create index '${cleanName}'`;
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const data = (payload && payload.response !== undefined) ? payload.response : payload;
    return ok(data, "json", durationMs);
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. (${err.message || "Failed to create index"})`,
      503,
      durationMs
    );
  }
}

export async function fetchIndexDelete(indexName) {
  const startTime = performance.now();
  const cleanName = String(indexName || "").trim().replace(/^\/+/, "");
  if (!cleanName) {
    return error("Index name is required to delete an index.", 400, 0);
  }

  // Ensure leading slash for backend client URL concatenation: base_url + endpoint
  const targetName = `/${cleanName}`;

  try {
    const res = await fetch(`${API_BASE_URL}/v1/crud/delete_index?name=${encodeURIComponent(targetName)}`, {
      method: "DELETE",
    });

    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `Failed to delete index with HTTP ${res.status}`;
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
      const errMsg = payload.error || payload.response || `Failed to delete index '${cleanName}'`;
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const data = (payload && payload.response !== undefined) ? payload.response : payload;
    return ok(data, "json", durationMs);
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. (${err.message || "Failed to delete index"})`,
      503,
      durationMs
    );
  }
}

function formatIndexDataTable(data, indexName) {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return null;

  const hits = data?.hits?.hits;
  if (!Array.isArray(hits)) {
    if (Array.isArray(data) && data.length > 0) {
      return formatRowsToTable(data, Object.keys(data[0] || {}));
    }
    return null;
  }

  if (hits.length === 0) {
    const total = typeof data?.hits?.total === "object" ? data.hits.total.value : (data?.hits?.total ?? 0);
    return `No documents found in index '${indexName}' (total hits: ${total}).`;
  }

  const fieldSet = new Set();
  for (const hit of hits) {
    if (hit._source && typeof hit._source === "object") {
      for (const k of Object.keys(hit._source)) {
        fieldSet.add(k);
      }
    }
  }

  const sourceFields = Array.from(fieldSet);
  const cols = ["_id", ...sourceFields];

  const rows = hits.map(hit => {
    const row = { _id: hit._id || "-" };
    const src = hit._source || {};
    for (const f of sourceFields) {
      const val = src[f];
      if (val === undefined || val === null) {
        row[f] = "-";
      } else if (typeof val === "object") {
        row[f] = JSON.stringify(val);
      } else {
        row[f] = String(val);
      }
    }
    return row;
  });

  return formatRowsToTable(rows, cols);
}

export async function fetchIndexData(parsed) {
  const startTime = performance.now();
  const rawIndexName = parsed.argMap?.index || parsed.argMap?.index_name || parsed.argTokens?.[0] || "";
  const cleanIndexName = String(rawIndexName).trim().replace(/^\/+/, "");

  if (!cleanIndexName) {
    return error("Missing required argument: <index>", 400, 0);
  }

  // Parse size parameter (default: "100")
  let size = "100";
  const rawSize = parsed.argMap?.size !== undefined ? String(parsed.argMap.size).trim() : "";
  if (rawSize && !isNaN(Number(rawSize)) && Number(rawSize) > 0) {
    size = String(parseInt(rawSize, 10));
  } else if (parsed.argTokens?.[1] && !isNaN(Number(parsed.argTokens[1])) && Number(parsed.argTokens[1]) > 0) {
    size = String(parseInt(parsed.argTokens[1], 10));
  }

  // Parse json flag
  const rawJsonArg = String(parsed.argMap?.json ?? "").toLowerCase().trim();
  let isJson = rawJsonArg === "true" || rawJsonArg === "1" || rawJsonArg === "yes";
  if (!isJson) {
    for (const token of (parsed.argTokens || [])) {
      const t = String(token).toLowerCase().trim();
      if (t === "json" || t === "json=true" || (t === "true" && token !== parsed.argTokens[0] && isNaN(Number(token)))) {
        isJson = true;
        break;
      }
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/v1/crud/index_data_inspect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        index_name: cleanIndexName,
        size: String(size),
      }),
    });

    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      let errMsg = `Failed to inspect index data with HTTP ${res.status}`;
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
      const errMsg = payload.error || payload.response || `Failed to inspect index data for '${cleanIndexName}'`;
      return error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg), 400, durationMs);
    }

    const data = (payload && payload.response !== undefined) ? payload.response : payload;

    if (isJson) {
      return ok(data, "json", durationMs);
    } else {
      const formatted = formatIndexDataTable(data, cleanIndexName);
      if (typeof formatted === "string") {
        if (Array.isArray(data?.hits?.hits) && data.hits.hits.length === 0) {
          return ok(formatted, "text", durationMs);
        }
        return ok(formatted, "table", durationMs);
      }
      return ok(data, "json", durationMs);
    }
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    return error(
      `Cannot connect to backend server at ${API_BASE_URL}. (${err.message || "Failed to inspect index data"})`,
      503,
      durationMs
    );
  }
}

let lastBackendCheck = 0;
let lastBackendStatus = false;

/**
 * Checks whether the backend server is reachable, with 3-second caching.
 */
async function checkBackendOnline() {
  const now = Date.now();
  if (now - lastBackendCheck < 3000) {
    return lastBackendStatus;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/v1/core/latency`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    lastBackendStatus = res.ok || res.status < 500;
  } catch {
    lastBackendStatus = false;
  }
  lastBackendCheck = now;
  return lastBackendStatus;
}

/**
 * Execute a parsed command and return a result.
 * This is the ONLY function you need to replace when connecting real API.
 *
 * @param {ParsedCommand} parsed
 * @returns {Promise<ExecutionResult>}
 */
export async function executeCommand(parsed) {
  const latency = fakeLatency();

  const name = parsed.commandName;
  const args = parsed.argMap;

  try {
    switch (name) {
      case "cluster:health":
        return fetchClusterHealth(parsed);

      case "cluster:nodes":
      case "nodes:list":
      case "node:list":
        return fetchNodesList(parsed);

      case "node:settings":
        return fetchNodeInspect(parsed, "settings");

      case "node:os":
        return fetchNodeInspect(parsed, "os");

      case "node:process":
        return fetchNodeInspect(parsed, "process");

      case "node:jvm":
        return fetchNodeInspect(parsed, "jvm");

      case "node:plugins":
        return fetchNodeInspect(parsed, "plugins");

      case "node:http":
        return fetchNodeInspect(parsed, "http");

      case "node:ingest":
        return fetchNodeInspect(parsed, "ingest");

      case "node:remote_cluster_server":
        return fetchNodeInspect(parsed, "remote_cluster_server");

      case "node:usage":
        return fetchNodeInspect(parsed, "usage");

      case "node:transport":
        return fetchNodeInspect(parsed, "transport");

      case "node:stats":
        return fetchNodeStats(parsed);

      case "allocation:list":
      case "node:allocation":
        return fetchAllocation(parsed);

      case "shards:list":
        return fetchShardsList(parsed);

      case "index:list":
        return fetchIndexList(parsed);

      case "index:get":
      case "index:data":
      case "index:data_inspect":
      case "index:data-inspect":
        return fetchIndexData(parsed);

      case "index:stats":
      case "index:stat":
        return fetchIndexInspect(parsed, "stats");

      case "index:mappings":
      case "index:mapping":
        return fetchIndexInspect(parsed, "mapping");

      case "index:settings":
      case "index:setting":
        return fetchIndexInspect(parsed, "settings");

      case "index:aliases":
      case "index:alias":
        return fetchIndexInspect(parsed, "_alias");

      case "index:count":
        return fetchIndexInspect(parsed, "count");

      case "index:search":
        return fetchIndexInspect(parsed, parsed.argMap?.info_type || parsed.argTokens?.[1] || "");

      case "index:create": {
        const indexName = parsed.argMap.index_name || parsed.argMap.index || parsed.argTokens[0];
        const withMappingRaw = String(parsed.argMap.with_mapping ?? parsed.argTokens[1] ?? "").toLowerCase().trim();
        const withMapping = withMappingRaw === "true" || withMappingRaw === "1" || withMappingRaw === "yes";
        return fetchIndexCreate(indexName, withMapping, {});
      }

      case "index:delete": {
        const indexName = parsed.argMap.index || parsed.argTokens[0];
        return fetchIndexDelete(indexName);
      }

      case "document:get":
      case "document:inspect":
      case "doc:get":
      case "doc:inspect": {
        const indexName = (parsed.argMap?.index || parsed.argTokens?.[0] || "").replace(/^index=/, "");
        const docId = (parsed.argMap?.id || parsed.argMap?.doc_id || parsed.argTokens?.[1] || "").replace(/^id=/, "");
        if (!indexName) return error("Missing required argument: <index>", 400, 0);
        if (!docId) return error("Missing required argument: <id>", 400, 0);
        const isJson = String(parsed.argMap?.json || "").toLowerCase() === "true";
        return await fetchDocumentGet(indexName, docId, isJson);
      }

      case "document:insert":
      case "doc:insert": {
        const indexName = (parsed.argMap?.index || parsed.argTokens?.[0] || "").replace(/^index=/, "");
        const docId = (parsed.argMap?.id || parsed.argTokens?.[1] || "").replace(/^id=/, "");
        if (!indexName) return error("Missing required argument: <index>", 400, 0);
        return await fetchDocumentInsert(indexName, docId, {});
      }

      case "document:update":
      case "doc:update": {
        const indexName = (parsed.argMap?.index || parsed.argTokens?.[0] || "").replace(/^index=/, "");
        const docId = (parsed.argMap?.id || parsed.argTokens?.[1] || "").replace(/^id=/, "");
        if (!indexName) return error("Missing required argument: <index>", 400, 0);
        if (!docId) return error("Missing required argument: <id>", 400, 0);
        return await fetchDocumentUpdate(indexName, docId, {});
      }

      case "document:delete":
      case "doc:delete": {
        const indexName = (parsed.argMap?.index || parsed.argTokens?.[0] || "").replace(/^index=/, "");
        const docId = (parsed.argMap?.id || parsed.argTokens?.[1] || "").replace(/^id=/, "");
        if (!indexName) return error("Missing required argument: <index>", 400, 0);
        if (!docId) return error("Missing required argument: <id>", 400, 0);
        return await fetchDocumentDelete(indexName, docId);
      }

      case "bulk:insert":
      case "document:bulk-insert":
      case "document:bulk_insert":
      case "document:bulk:insert": {
        const indexName = (parsed.argMap?.index || parsed.argTokens?.[0] || "").replace(/^index=/, "");
        const fileArg = parsed.argMap?.file || parsed.argMap?.data || parsed.argTokens?.[1] || "";
        if (!indexName) return error("Missing required argument: <index>", 400, 0);
        if (!fileArg) {
          return error("Missing required argument: <file>. Please select or specify a .json file. Usage: bulk:insert <index> <file.json> [json=false]", 400, 0);
        }
        const isJson = String(parsed.argMap?.json || "").toLowerCase() === "true";
        return await fetchBulkInsert(indexName, fileArg, isJson);
      }

      case "bulk:update":
      case "document:bulk-update":
      case "document:bulk_update":
      case "document:bulk:update": {
        const indexName = (parsed.argMap?.index || parsed.argTokens?.[0] || "").replace(/^index=/, "");
        const fileArg = parsed.argMap?.file || parsed.argMap?.data || parsed.argTokens?.[1] || "";
        if (!indexName) return error("Missing required argument: <index>", 400, 0);
        if (!fileArg) {
          return error("Missing required argument: <file>. Please select or specify a .json file. Usage: bulk:update <index> <file.json> [json=false]", 400, 0);
        }
        const isJson = String(parsed.argMap?.json || "").toLowerCase() === "true";
        return await fetchBulkUpdate(indexName, fileArg, isJson);
      }

      case "bulk:delete":
      case "document:bulk-delete":
      case "document:bulk_delete":
      case "document:bulk:delete": {
        const indexName = (parsed.argMap?.index || parsed.argTokens?.[0] || "").replace(/^index=/, "");
        const fileArg = parsed.argMap?.file || parsed.argMap?.ids || parsed.argTokens?.[1] || "";
        if (!indexName) return error("Missing required argument: <index>", 400, 0);
        if (!fileArg) {
          return error("Missing required argument: <file>. Please select or specify a .json file. Usage: bulk:delete <index> <file.json> [json=false]", 400, 0);
        }
        const isJson = String(parsed.argMap?.json || "").toLowerCase() === "true";
        return await fetchBulkDelete(indexName, fileArg, isJson);
      }

      default: {
        // Before returning any mock-supported commands, verify the backend is online.
        const isOnline = await checkBackendOnline();
        if (!isOnline) {
          return error(
            `Cannot connect to backend server at ${API_BASE_URL}. Backend is offline or not running.`,
            503,
            latency
          );
        }
        break;
      }
    }

    switch (name) {
      case "cluster:stats":
        return ok(MOCK_CLUSTER_STATS, "json", latency);

      case "cluster:settings":
        return ok({
          persistent: { "cluster.routing.allocation.enable": "all" },
          transient: {},
          defaults: { "cluster.routing.allocation.type": "balanced" },
        }, "json", latency);

      case "cluster:pending-tasks":
        return ok({ tasks: [] }, "json", latency);

      case "index:refresh":
        return ok({ _shards: { total: 2, successful: 2, failed: 0 } }, "json", latency);

      case "index:flush":
        return fetchIndexInspect(parsed, "_flush");

      case "node:info":
        return ok({
          _nodes: { total: 3, successful: 3, failed: 0 },
          cluster_name: "elasticease-production",
          nodes: MOCK_CLUSTER_NODES.nodes,
        }, "json", latency);

      case "node:hot-threads":
        return ok("::: {node-primary-01}{...}\nHotThreads:\n  10.0% [cpu] - waiting", "text", latency);

      case "search":
        return ok(mockSearchResult(args.index, args.query), "json", latency);

      case "search:count":
        return ok({ count: Math.floor(Math.random() * 50000), _shards: { total: 2, successful: 2, failed: 0 } }, "json", latency);

      case "shards:unassigned":
        return ok(`index   shard  prirep  state        reason
orders  0      r       UNASSIGNED   NODE_LEFT[node-data-03]`, "table", latency);

      case "alias:list":
        return ok({
          users: { aliases: { current_users: {} } },
          products: { aliases: { live_catalog: {}, catalog_v2: {} } },
        }, "json", latency);

      case "alias:get":
        return ok({ [args.index]: { aliases: { [`${args.index}_alias`]: {} } } }, "json", latency);

      case "template:list":
        return ok({
          index_templates: [
            { name: "logs-template", index_template: { index_patterns: ["logs-*"] } },
            { name: "metrics-template", index_template: { index_patterns: ["metrics-*"] } },
          ],
        }, "json", latency);

      case "template:get":
        return ok({ index_templates: [{ name: args.name, index_template: { index_patterns: [`${args.name}-*`], priority: 100 } }] }, "json", latency);

      case "tasks:list":
        return ok({
          nodes: {
            "node-primary-01": {
              tasks: {
                "oTUltX4IQMOUUVeiohTt8A:124": {
                  node: "node-primary-01",
                  id: 124,
                  type: "transport",
                  action: "indices:data/read/search",
                  running_time_in_nanos: 5821,
                  cancellable: true,
                },
              },
            },
          },
        }, "json", latency);

      default:
        return error(`Unknown command: ${name}`, 400, latency);
    }
  } catch (e) {
    return error(e.message || "Internal executor error", 500, latency);
  }
}

function ok(data, format, durationMs) {
  return { status: "ok", statusCode: 200, durationMs, format, data };
}

function error(message, statusCode, durationMs) {
  return {
    status: "error",
    statusCode,
    durationMs,
    format: "json",
    data: { error: { reason: message, status: statusCode } },
  };
}
