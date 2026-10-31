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
    description: "Retrieve and inspect stored documents from an index via /v1/crud/index_data_inspect",
    category: "Index",
    arguments: [
      { name: "index", required: true, type: "index", description: "Index name to inspect" },
      {
        name: "size",
        required: false,
        type: "number",
        description: "Number of documents to retrieve (default: 100)",
      },
      {
        name: "json",
        required: false,
        type: "boolean",
        description: "Return raw JSON if true, formatted table if false (default: false)",
        options: ["true", "false"],
      },
    ],
  },
  {
    name: "index:data",
    description: "Retrieve and inspect stored documents from an index via /v1/crud/index_data_inspect",
    category: "Index",
    arguments: [
      { name: "index", required: true, type: "index", description: "Index name to inspect" },
      {
        name: "size",
        required: false,
        type: "number",
        description: "Number of documents to retrieve (default: 100)",
      },
      {
        name: "json",
        required: false,
        type: "boolean",
        description: "Return raw JSON if true, formatted table if false (default: false)",
        options: ["true", "false"],
      },
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
    name: "index:count",
    description: "Get document count for an index",
    category: "Index",
    arguments: [
      { name: "index", required: true, type: "index", description: "Index name" },
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

  // ── DOCUMENT ──────────────────────────────────────────────
  {
    name: "document:get",
    aliases: ["document:inspect", "doc:get", "doc:inspect"],
    description: "Retrieve and inspect a single document by ID from an index",
    category: "Document",
    arguments: [
      {
        name: "index",
        type: "index",
        description: "Target index name",
        required: true,
      },
      {
        name: "id",
        type: "string",
        description: "Document ID to inspect",
        required: true,
      },
      {
        name: "json",
        type: "boolean",
        description: "Return raw JSON if true, formatted view if false (default: false)",
        required: false,
        options: ["true", "false"],
      },
    ],
  },
  {
    name: "document:insert",
    aliases: ["doc:insert"],
    description: "Insert a new document into an index with interactive fields or JSON prompt",
    category: "Document",
    arguments: [
      {
        name: "index",
        type: "index",
        description: "Target index name",
        required: true,
      },
      {
        name: "id",
        type: "string",
        description: "Optional document ID (auto-generated by Elasticsearch if omitted)",
        required: false,
      },
    ],
  },
  {
    name: "document:update",
    aliases: ["doc:update"],
    description: "Update fields of an existing document by its ID",
    category: "Document",
    arguments: [
      {
        name: "index",
        type: "index",
        description: "Target index name",
        required: true,
      },
      {
        name: "id",
        type: "string",
        description: "Document ID to update",
        required: true,
      },
    ],
  },
  {
    name: "document:delete",
    aliases: ["doc:delete"],
    description: "Delete an existing document permanently by its ID",
    category: "Document",
    arguments: [
      {
        name: "index",
        type: "index",
        description: "Target index name",
        required: true,
      },
      {
        name: "id",
        type: "string",
        description: "Document ID to delete",
        required: true,
      },
    ],
  },

  // ── BULK ──────────────────────────────────────────────────
  {
    name: "bulk:insert",
    aliases: ["document:bulk-insert", "document:bulk_insert", "document:bulk:insert"],
    description: "Bulk insert multiple documents from a JSON file into an index",
    category: "Bulk",
    arguments: [
      {
        name: "index",
        type: "index",
        description: "Target index name",
        required: true,
      },
      {
        name: "file",
        type: "file",
        description: "JSON file with documents to insert (click Browse to select)",
        required: true,
      },
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
    name: "bulk:update",
    aliases: ["document:bulk-update", "document:bulk_update", "document:bulk:update"],
    description: "Bulk update multiple documents from a JSON file in an index",
    category: "Bulk",
    arguments: [
      {
        name: "index",
        type: "index",
        description: "Target index name",
        required: true,
      },
      {
        name: "file",
        type: "file",
        description: "JSON file with document updates (click Browse to select)",
        required: true,
      },
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
    name: "bulk:delete",
    aliases: ["document:bulk-delete", "document:bulk_delete", "document:bulk:delete"],
    description: "Bulk delete multiple documents from a JSON file or ID list from an index",
    category: "Bulk",
    arguments: [
      {
        name: "index",
        type: "index",
        description: "Target index name",
        required: true,
      },
      {
        name: "file",
        type: "file",
        description: "JSON file with document IDs to delete (click Browse to select)",
        required: true,
      },
      {
        name: "json",
        type: "boolean",
        description: "Return raw JSON if true, formatted table if false (default: false)",
        required: false,
        options: ["true", "false"],
      },
    ],
  },

  // ── NODE ──────────────────────────────────────────────────
  {
    name: "node:settings",
    description: "Retrieve settings and configuration for active node(s)",
    category: "Node",
    arguments: [
      {
        name: "node",
        type: "node",
        description: "Node name or node ID to inspect (optional, defaults to all nodes)",
        required: false,
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
    name: "node:os",
    description: "Retrieve operating system information for active node(s)",
    category: "Node",
    arguments: [
      {
        name: "node",
        type: "node",
        description: "Node name or node ID to inspect (optional, defaults to all nodes)",
        required: false,
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
    name: "node:process",
    description: "Retrieve process and runtime information for active node(s)",
    category: "Node",
    arguments: [
      {
        name: "node",
        type: "node",
        description: "Node name or node ID to inspect (optional, defaults to all nodes)",
        required: false,
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
    name: "node:jvm",
    description: "Retrieve JVM metrics and memory information for active node(s)",
    category: "Node",
    arguments: [
      {
        name: "node",
        type: "node",
        description: "Node name or node ID to inspect (optional, defaults to all nodes)",
        required: false,
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
    name: "node:plugins",
    description: "Retrieve installed plugins and modules for active node(s)",
    category: "Node",
    arguments: [
      {
        name: "node",
        type: "node",
        description: "Node name or node ID to inspect (optional, defaults to all nodes)",
        required: false,
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
    name: "node:http",
    description: "Retrieve HTTP connection settings and metrics for active node(s)",
    category: "Node",
    arguments: [
      {
        name: "node",
        type: "node",
        description: "Node name or node ID to inspect (optional, defaults to all nodes)",
        required: false,
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
    name: "node:ingest",
    description: "Retrieve ingest pipeline settings and processor statistics for active node(s)",
    category: "Node",
    arguments: [
      {
        name: "node",
        type: "node",
        description: "Node name or node ID to inspect (optional, defaults to all nodes)",
        required: false,
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
    name: "node:remote_cluster_server",
    description: "Retrieve remote cluster server connection details for active node(s)",
    category: "Node",
    arguments: [
      {
        name: "node",
        type: "node",
        description: "Node name or node ID to inspect (optional, defaults to all nodes)",
        required: false,
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
    name: "node:usage",
    description: "Retrieve feature usage metrics and statistics for active node(s)",
    category: "Node",
    arguments: [
      {
        name: "node",
        type: "node",
        description: "Node name or node ID to inspect (optional, defaults to all nodes)",
        required: false,
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
    name: "node:transport",
    description: "Retrieve transport communication metrics and settings for active node(s)",
    category: "Node",
    arguments: [
      {
        name: "node",
        type: "node",
        description: "Node name or node ID to inspect (optional, defaults to all nodes)",
        required: false,
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
    description: "Get comprehensive statistics (CPU, memory, JVM, indexing, docs) for Elasticsearch nodes",
    category: "Node",
    arguments: [
      {
        name: "node",
        type: "node",
        description: "Node ID or name (optional: inspect specific node or all)",
        required: false,
      },
      {
        name: "metric",
        type: "string",
        description: "Filter stats by metric category (e.g. jvm, os, process, indices, fs, http)",
        required: false,
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

/** Get a command definition by exact name or alias. */
export function getCommand(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  return COMMAND_REGISTRY.find(c =>
    c.name.toLowerCase() === lower ||
    (c.aliases && c.aliases.some(a => a.toLowerCase() === lower))
  );
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
