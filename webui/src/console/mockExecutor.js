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

const MOCK_INDEX_LIST_TABLE = `health status  index              uuid                   pri rep docs.count store.size
green  open    users              xZQMq_XDR8ix-01        2   1  12,453     8.2mb
green  open    user_sessions      xZQMq_XDR8ix-02        1   1  89,201     24.1mb
green  open    products           xZQMq_XDR8ix-03        5   1  4,102,005  1.24gb
green  open    product_catalog    xZQMq_XDR8ix-04        3   1  58,892     112.3mb
yellow open    orders             xZQMq_XDR8ix-05        2   1  320,441    210.5mb
green  open    order_items        xZQMq_XDR8ix-06        3   1  980,112    488.6mb
green  open    logs               xZQMq_XDR8ix-07        5   1  1,420,891  842.0mb
green  open    app_logs           xZQMq_XDR8ix-08        3   1  280,440    156.2mb
green  open    error_logs         xZQMq_XDR8ix-09        1   1  24,110     18.9mb
green  open    metrics            xZQMq_XDR8ix-10        5   1  2,401,003  1.82gb
green  open    analytics          xZQMq_XDR8ix-11        3   1  850,210    310.0mb`;

const MOCK_NODE_LIST_TABLE = `ip           heap.%  ram.%  cpu  node.role           master  name
10.0.0.12    42      78     4    cdfhilmrstw         *       node-primary-01
10.0.0.13    38      74     2    cdfhilmrstw         -       node-data-02
10.0.0.14    45      81     5    cdfhilmrstw         -       node-data-03`;

const MOCK_SHARDS_TABLE = `index           shard  prirep  state       docs    store    ip           node
users           0      p       STARTED     6228    4.1mb    10.0.0.12    node-primary-01
users           0      r       STARTED     6228    4.1mb    10.0.0.13    node-data-02
products        0      p       STARTED     820401  248mb    10.0.0.14    node-data-03
products        0      r       STARTED     820401  248mb    10.0.0.12    node-primary-01
orders          0      p       STARTED     160220  105mb    10.0.0.13    node-data-02
orders          0      r       UNASSIGNED  -       -        -            -`;

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

  // 4. DEFAULT INSPECT RESPONSE (Comprehensive Index Overview)
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

async function fetchIndexInspect(parsed) {
  const startTime = performance.now();

  const indexName = parsed.argMap.index || parsed.argMap.index_name || parsed.argTokens[0] || "";

  let infoType = "";
  let isJson = false;
  let isAi = false;

  const rawArg1 = parsed.argTokens[1] ? String(parsed.argTokens[1]).toLowerCase().trim() : "";
  if (parsed.argTokens.length >= 2 && (rawArg1 === "true" || rawArg1 === "false")) {
    infoType = "";
    isJson = rawArg1 === "true";
    const rawAi = parsed.argTokens[2] ? String(parsed.argTokens[2]).toLowerCase().trim() : "";
    isAi = rawAi === "true" || rawAi === "1" || rawAi === "yes";
  } else {
    infoType = parsed.argMap.info_type || parsed.argTokens[1] || "";
    const rawJsonArg = String(parsed.argMap.json ?? parsed.argTokens[3] ?? "").toLowerCase().trim();
    isJson = rawJsonArg === "true" || rawJsonArg === "1" || rawJsonArg === "yes";
    const rawAiArg = String(parsed.argMap.ai_summarization ?? parsed.argTokens[2] ?? "").toLowerCase().trim();
    isAi = rawAiArg === "true" || rawAiArg === "1" || rawAiArg === "yes";
  }

  if (!indexName) {
    return error("Missing required argument: <index>", 400, 0);
  }

  // Backend coreops.index_info strips leading slash from name and prefixes /_ to info_type:
  // f"/{index_name.strip('/')}/_{info_type}"
  const cleanInfoType = (infoType || "").trim().replace(/^_/, "");
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

function formatNodeInspectTable(data, infoType) {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return null;

  let targetNode = data;
  if (data.nodes && typeof data.nodes === "object") {
    const nodeIds = Object.keys(data.nodes);
    if (nodeIds.length > 0) {
      targetNode = data.nodes[nodeIds[0]];
    }
  }

  const rows = [];
  if (targetNode.name) rows.push({ key: "Node Name", value: String(targetNode.name) });
  if (targetNode.ip) rows.push({ key: "IP Address", value: String(targetNode.ip) });
  if (targetNode.roles) {
    rows.push({ key: "Roles", value: Array.isArray(targetNode.roles) ? targetNode.roles.join(", ") : String(targetNode.roles) });
  }

  const cleanType = (infoType || "").toLowerCase().replace(/^_/, "").trim();
  const infoSection = cleanType && targetNode[cleanType] ? targetNode[cleanType] : targetNode;

  function flattenNodeObj(obj, prefix = "") {
    for (const [k, v] of Object.entries(obj)) {
      if (k === "name" || k === "ip" || k === "roles") continue;
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        flattenNodeObj(v, fullKey);
      } else {
        rows.push({ key: fullKey, value: Array.isArray(v) ? v.join(", ") : String(v ?? "-") });
      }
    }
  }

  flattenNodeObj(infoSection);

  if (rows.length > 0) {
    return formatRowsToTable(rows, ["key", "value"]);
  }
  return null;
}

async function fetchNodeInspect(parsed) {
  const startTime = performance.now();
  const node = parsed.argMap?.node || parsed.argTokens?.[0] || "";
  const infoType = parsed.argMap?.info_type || parsed.argTokens?.[1] || "";
  
  const rawAi = String(parsed.argMap?.ai_summarization ?? parsed.argTokens?.[2] ?? "").toLowerCase().trim();
  const isAi = rawAi === "true" || rawAi === "1" || rawAi === "yes";

  const rawJson = String(parsed.argMap?.json ?? parsed.argTokens?.[3] ?? "").toLowerCase().trim();
  const isJson = rawJson === "true" || rawJson === "1" || rawJson === "yes";

  if (!node) {
    return error("Missing required argument: <node> (name or ID)", 400, 0);
  }
  if (!infoType) {
    return error("Missing required argument: <info_type> (e.g. os, process, jvm, thread_pool, transport, http, plugins)", 400, 0);
  }

  const cleanInfoType = infoType.replace(/^_/, "");

  try {
    const url = `${API_BASE_URL}/v1/core/inspect_node?id_or_name=${encodeURIComponent(node)}&info_type=${encodeURIComponent(cleanInfoType)}&ai_summarization=${isAi}`;
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

      case "node:inspect":
        return fetchNodeInspect(parsed);

      case "allocation:list":
      case "node:allocation":
        return fetchAllocation(parsed);

      case "shards:list":
        return fetchShardsList(parsed);

      case "index:list":
        return fetchIndexList(parsed);

      case "index:inspect":
      case "index:search":
        return fetchIndexInspect(parsed);

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

      case "index:get":
        return ok(mockIndexInfo(args.index || "unknown"), "json", latency);

      case "index:mappings":
        return ok({
          [args.index]: {
            mappings: {
              properties: {
                id: { type: "long" },
                name: { type: "text", fields: { keyword: { type: "keyword" } } },
                created_at: { type: "date" },
                status: { type: "keyword" },
              },
            },
          },
        }, "json", latency);

      case "index:settings":
        return ok(mockIndexInfo(args.index).settings, "json", latency);

      case "index:stats":
        return ok({
          _shards: { total: 2, successful: 2, failed: 0 },
          _all: {
            primaries: { docs: { count: 12453, deleted: 0 }, store: { size_in_bytes: 8601600 } },
          },
          indices: { [args.index]: { primaries: { docs: { count: 12453 } } } },
        }, "json", latency);

      case "index:refresh":
        return ok({ _shards: { total: 2, successful: 2, failed: 0 } }, "json", latency);

      case "index:flush":
        return ok({ _shards: { total: 2, successful: 2, failed: 0 } }, "json", latency);

      case "node:stats":
        return ok({
          _nodes: { total: 3, successful: 3, failed: 0 },
          nodes: {
            "node-1-id": { name: "node-primary-01", jvm: { heap_used_percent: 42 }, os: { cpu: { percent: 4 } } },
            "node-2-id": { name: "node-data-02", jvm: { heap_used_percent: 38 }, os: { cpu: { percent: 2 } } },
            "node-3-id": { name: "node-data-03", jvm: { heap_used_percent: 45 }, os: { cpu: { percent: 5 } } },
          },
        }, "json", latency);

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
