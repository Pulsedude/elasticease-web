/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  ELASTICEASE COMMAND REGISTRY                           ║
 * ║  All commands defined here — completely separate from   ║
 * ║  the UI. Add / remove commands without touching any     ║
 * ║  component code.                                        ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Argument types supported:
 *   string  — free-form text
 *   number  — numeric value
 *   boolean — true / false
 *   index   — Elasticsearch index name (dynamic suggestions later)
 *   field   — document field name
 *   node    — cluster node name
 *   shard   — shard id
 *   query   — search query string
 *   enum    — one of a fixed set (provide `options` array)
 */

/** @type {CommandDefinition[]} */
export const COMMAND_REGISTRY = [
  // ── CLUSTER ──────────────────────────────────────────────
  {
    name: "cluster:health",
    description: "Get current cluster health status",
    category: "Cluster",
    arguments: [
      {
        name: "json",
        type: "boolean",
        description: "Return raw JSON if true, formatted table if false (default: false)",
        required: false,
        options: ["true", "false"],
      },
    ],
  },
  {
    name: "cluster:stats",
    description: "Get detailed cluster statistics",
    category: "Cluster",
    arguments: [],
  },
  {
    name: "cluster:nodes",
    description: "List all nodes in the cluster",
    category: "Cluster",
    arguments: [],
  },
  {
    name: "cluster:settings",
    description: "Get current cluster settings",
    category: "Cluster",
    arguments: [],
  },

  // ── INDEX ─────────────────────────────────────────────────
  {
    name: "index:list",
    description: "List all indices with health, status, and doc count",
    category: "Index",
    arguments: [
      {
        name: "json",
        type: "boolean",
        description: "Return raw JSON if true, formatted table if false (default: false)",
        required: false,
        options: ["true", "false"],
      },
      {
        name: "ai_summarization",
        type: "boolean",
        description: "Get AI powered summary (default: false)",
        required: false,
        options: ["true", "false"],
      },
    ],
  },
  {
    name: "index:inspect",
    description: "Inspect specific index details, mappings, settings, or stats",
    category: "Index",
    arguments: [
      {
        name: "index",
        type: "index",
        description: "Index name to inspect",
        required: true,
      },
      {
        name: "info_type",
        type: "string",
        description: "Type of information to inspect (e.g. mapping, settings, stats, aliases)",
        required: true,
        options: ["mapping", "settings", "stats", "aliases"],
      },
      {
        name: "ai_summarization",
        type: "boolean",
        description: "Get AI powered summary (default: false)",
        required: false,
        options: ["true", "false"],
      },
      {
        name: "json",
        type: "boolean",
        description: "Return raw JSON if true, formatted output if false (default: false)",
        required: false,
        options: ["true", "false"],
      },
    ],
  },
  {
    name: "index:search",
    description: "Inspect specific index details, mappings, settings, or stats",
    category: "Index",
    arguments: [
      {
        name: "index_name",
        type: "index",
        description: "Index name to inspect",
        required: true,
      },
      {
        name: "info_type",
        type: "string",
        description: "Type of information (e.g. mapping, settings, stats)",
        required: false,
        options: ["mapping", "settings", "stats", "aliases"],
      },
      {
        name: "json",
        type: "boolean",
        description: "Return raw JSON if true, formatted output if false (default: false)",
        required: false,
        options: ["true", "false"],
      },
      {
        name: "ai_summarization",
        type: "boolean",
        description: "Get AI powered summary (default: false)",
        required: false,
        options: ["true", "false"],
      },
    ],
  },
  {
    name: "index:get",
    description: "Get information about a specific index",
    category: "Index",
    arguments: [
      { name: "index", required: true, type: "index", description: "Index name" },
    ],
  },
  {
    name: "index:create",
    description: "Create a new index with optional custom schema mapping",
    category: "Index",
    arguments: [
      { name: "index_name", required: true, type: "string", description: "Index name to create" },
      {
        name: "with_mapping",
        required: false,
        type: "boolean",
        description: "Define custom field schema mappings (default: false)",
        options: ["false", "true"],
      },
    ],
  },
  {
    name: "index:delete",
    description: "Delete an existing index and its data permanently",
    category: "Index",
    arguments: [
      { name: "index", required: true, type: "index", description: "Index name to delete" },
      {
        name: "confirm",
        required: false,
        type: "boolean",
        description: "Bypass confirmation prompt (default: false)",
        options: ["true", "false"],
      },
    ],
  },
  {
    name: "index:mappings",
    description: "Get field mappings for an index",
    category: "Index",
    arguments: [
      { name: "index", required: true, type: "index", description: "Index name" },
    ],
  },
  {
    name: "index:settings",
    description: "Get settings for an index",
    category: "Index",
    arguments: [
      { name: "index", required: true, type: "index", description: "Index name" },
    ],
  },
  {
    name: "index:stats",
    description: "Get statistics for an index",
    category: "Index",
    arguments: [
      { name: "index", required: true, type: "index", description: "Index name" },
    ],
  },
  {
    name: "index:refresh",
    description: "Refresh an index to make documents searchable",
    category: "Index",
    arguments: [
      { name: "index", required: true, type: "index", description: "Index name" },
    ],
  },
  {
    name: "index:flush",
    description: "Flush an index to persist data to disk",
    category: "Index",
    arguments: [
      { name: "index", required: true, type: "index", description: "Index name" },
    ],
  },

  // ── NODE ──────────────────────────────────────────────────
  {
    name: "node:inspect",
    description: "Inspect specific details of an active node (e.g. os, process, jvm, thread_pool)",
    category: "Node",
    arguments: [
      {
        name: "node",
        type: "node",
        description: "Node name or node ID to inspect",
        required: true,
      },
      {
        name: "info_type",
        type: "string",
        description: "Type of information (e.g. os, process, jvm, thread_pool, transport, http, plugins, ingest, indices)",
        required: true,
        options: ["os", "process", "jvm", "thread_pool", "transport", "http", "plugins", "ingest", "indices"],
      },
      {
        name: "ai_summarization",
        type: "boolean",
        description: "Get AI powered summary (default: false)",
        required: false,
        options: ["true", "false"],
      },
      {
        name: "json",
        type: "boolean",
        description: "Return raw JSON if true, formatted output if false (default: false)",
        required: false,
        options: ["true", "false"],
      },
    ],
  },
  {
    name: "allocation:list",
    description: "View disk space utilization and shard allocation across active nodes",
    category: "Node",
    arguments: [
      {
        name: "json",
        type: "boolean",
        description: "Return raw JSON if true, formatted table if false (default: false)",
        required: false,
        options: ["true", "false"],
      },
      {
        name: "ai_summarization",
        type: "boolean",
        description: "Get AI powered summary (default: false)",
        required: false,
        options: ["true", "false"],
      },
    ],
  },
  {
    name: "node:allocation",
    description: "View disk space utilization and shard allocation across active nodes",
    category: "Node",
    arguments: [
      {
        name: "json",
        type: "boolean",
        description: "Return raw JSON if true, formatted table if false (default: false)",
        required: false,
        options: ["true", "false"],
      },
      {
        name: "ai_summarization",
        type: "boolean",
        description: "Get AI powered summary (default: false)",
        required: false,
        options: ["true", "false"],
      },
    ],
  },
  {
    name: "nodes:list",
    description: "List all nodes with roles, IP, and load",
    category: "Node",
    arguments: [
      {
        name: "json",
        type: "boolean",
        description: "Return raw JSON if true, formatted table if false (default: false)",
        required: false,
        options: ["true", "false"],
      },
      {
        name: "ai_summarization",
        type: "boolean",
        description: "Get AI powered summary (default: false)",
        required: false,
        options: ["true", "false"],
      },
    ],
  },
  {
    name: "node:list",
    description: "List all nodes with roles, IP, and load",
    category: "Node",
    arguments: [
      {
        name: "json",
        type: "boolean",
        description: "Return raw JSON if true, formatted table if false (default: false)",
        required: false,
        options: ["true", "false"],
      },
      {
        name: "ai_summarization",
        type: "boolean",
        description: "Get AI powered summary (default: false)",
        required: false,
        options: ["true", "false"],
      },
    ],
  },
  {
    name: "node:stats",
    description: "Get statistics for all nodes",
    category: "Node",
    arguments: [],
  },

  // ── SHARDS ────────────────────────────────────────────────
  {
    name: "shards:list",
    description: "List all shards with state and size (supports unassigned filter)",
    category: "Shards",
    arguments: [
      {
        name: "unassigned",
        type: "boolean",
        description: "Filter only unassigned shards (default: false)",
        required: false,
        options: ["false", "true"],
      },
      {
        name: "json",
        type: "boolean",
        description: "Return raw JSON if true, formatted table if false (default: false)",
        required: false,
        options: ["true", "false"],
      },
      {
        name: "ai_summarization",
        type: "boolean",
        description: "Get AI powered summary (default: false)",
        required: false,
        options: ["true", "false"],
      },
    ],
  },
];

/** Get a command definition by exact name. */
export function getCommand(name) {
  return COMMAND_REGISTRY.find(c => c.name === name);
}

/** Get all unique categories in registry order. */
export function getCategories() {
  const seen = new Set();
  const cats = [];
  for (const cmd of COMMAND_REGISTRY) {
    if (!seen.has(cmd.category)) {
      seen.add(cmd.category);
      cats.push(cmd.category);
    }
  }
  return cats;
}

/** Get commands grouped by category. */
export function getCommandsByCategory() {
  const map = {};
  for (const cmd of COMMAND_REGISTRY) {
    if (!map[cmd.category]) map[cmd.category] = [];
    map[cmd.category].push(cmd);
  }
  return map;
}
