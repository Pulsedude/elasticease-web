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
        name: "json = true | false",
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
  {
    name: "cluster:pending-tasks",
    description: "List pending cluster tasks",
    category: "Cluster",
    arguments: [],
  },

  // ── INDEX ─────────────────────────────────────────────────
  {
    name: "index:list",
    description: "List all indices with health, status, and doc count",
    category: "Index",
    arguments: [],
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
    description: "Create a new index",
    category: "Index",
    arguments: [
      { name: "index", required: true, type: "string", description: "Index name to create" },
    ],
  },
  {
    name: "index:delete",
    description: "Delete an index permanently",
    category: "Index",
    arguments: [
      { name: "index", required: true, type: "index", description: "Index name to delete" },
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
    name: "node:list",
    description: "List all nodes with roles, IP, and load",
    category: "Node",
    arguments: [],
  },
  {
    name: "node:stats",
    description: "Get statistics for all nodes",
    category: "Node",
    arguments: [],
  },
  {
    name: "node:info",
    description: "Get detailed node information",
    category: "Node",
    arguments: [
      { name: "node", required: false, type: "node", description: "Node name (omit for all)" },
    ],
  },
  {
    name: "node:hot-threads",
    description: "Get hot threads report for nodes",
    category: "Node",
    arguments: [],
  },

  // ── SEARCH ────────────────────────────────────────────────
  {
    name: "search",
    description: "Search documents in an index",
    category: "Search",
    arguments: [
      { name: "index", required: true, type: "index", description: "Index to search" },
      { name: "query", required: false, type: "query", description: "Search query string" },
    ],
  },
  {
    name: "search:count",
    description: "Count documents matching a query",
    category: "Search",
    arguments: [
      { name: "index", required: true, type: "index", description: "Index to count in" },
    ],
  },

  // ── SHARDS ────────────────────────────────────────────────
  {
    name: "shards:list",
    description: "List all shards with state and size",
    category: "Shards",
    arguments: [],
  },
  {
    name: "shards:unassigned",
    description: "List unassigned shards with reasons",
    category: "Shards",
    arguments: [],
  },

  // ── ALIASES ───────────────────────────────────────────────
  {
    name: "alias:list",
    description: "List all index aliases",
    category: "Aliases",
    arguments: [],
  },
  {
    name: "alias:get",
    description: "Get aliases for a specific index",
    category: "Aliases",
    arguments: [
      { name: "index", required: true, type: "index", description: "Index name" },
    ],
  },

  // ── TEMPLATES ─────────────────────────────────────────────
  {
    name: "template:list",
    description: "List all index templates",
    category: "Templates",
    arguments: [],
  },
  {
    name: "template:get",
    description: "Get a specific index template",
    category: "Templates",
    arguments: [
      { name: "name", required: true, type: "string", description: "Template name" },
    ],
  },

  // ── TASKS ─────────────────────────────────────────────────
  {
    name: "tasks:list",
    description: "List currently running cluster tasks",
    category: "Tasks",
    arguments: [],
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
