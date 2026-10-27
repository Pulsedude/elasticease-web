/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  SUGGESTION ENGINE                                      ║
 * ║  Completely decoupled from UI.                          ║
 * ║  Returns suggestion arrays — UI decides how to render.  ║
 * ╚══════════════════════════════════════════════════════════╝
 */

import { COMMAND_REGISTRY } from "./commandRegistry.js";

// ─── Mock index list (replace with API call later) ────────
const MOCK_INDICES = [
  "users",
  "user_sessions",
  "user_events",
  "products",
  "product_catalog",
  "orders",
  "order_items",
  "logs",
  "app_logs",
  "error_logs",
  "metrics",
  "analytics",
];

// ─── Mock node list ────────────────────────────────────────
const MOCK_NODES = [
  "node-primary-01",
  "node-data-02",
  "node-data-03",
];

/**
 * Simple fuzzy match: every character in `query` appears in
 * `target` in order (case-insensitive).
 */
function fuzzyMatch(target, query) {
  if (!query) return true;
  const t = target.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

/**
 * Score a match — lower is better.
 * Prefix matches score 0, contains-exact scores 1, fuzzy scores 2+.
 */
function matchScore(target, query) {
  const t = target.toLowerCase();
  const q = query.toLowerCase();
  if (t.startsWith(q)) return 0;
  if (t.includes(q)) return 1;
  return 2;
}

/**
 * Get command suggestions for the current input.
 *
 * @param {string} input — the raw text in the command input
 * @returns {CommandSuggestion[]}
 *   { command: CommandDefinition, matchedSegments: MatchedSegment[] }
 */
export function getCommandSuggestions(input) {
  const query = input.trim().toLowerCase();
  if (!query) return [];

  const matched = COMMAND_REGISTRY.filter(cmd => fuzzyMatch(cmd.name, query))
    .sort((a, b) => matchScore(a.name, query) - matchScore(b.name, query))
    .slice(0, 12);

  return matched.map(cmd => ({
    command: cmd,
    matchedSegments: buildHighlightSegments(cmd.name, query),
  }));
}

/**
 * Build highlight segments showing which characters matched.
 * Returns array of { text, highlighted }.
 */
function buildHighlightSegments(target, query) {
  const t = target;
  const q = query.toLowerCase();

  // Build a boolean array of which positions in target are matched
  const matched = new Array(t.length).fill(false);
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti].toLowerCase() === q[qi]) {
      matched[ti] = true;
      qi++;
    }
  }

  // Group consecutive same-highlight chars into segments
  const segments = [];
  let i = 0;
  while (i < t.length) {
    let j = i;
    while (j < t.length && matched[j] === matched[i]) j++;
    segments.push({ text: t.slice(i, j), highlighted: matched[i] });
    i = j;
  }
  return segments;
}

/**
 * Get argument suggestions for a specific argument position.
 *
 * @param {string} commandName  — e.g. "index:get"
 * @param {string} argName      — e.g. "index"
 * @param {string} argType      — e.g. "index"
 * @param {string} partialInput — what the user has typed so far
 * @returns {string[]}
 *
 * NOTE: Replace this implementation later with real API calls.
 * The interface (inputs / outputs) should remain stable.
 */
export function getArgumentSuggestions(commandName, argName, argType, partialInput) {
  const q = (partialInput || "").toLowerCase();

  let candidates = [];

  if (argType === "index") {
    candidates = MOCK_INDICES;
  } else if (argType === "node") {
    candidates = MOCK_NODES;
  } else if (argName === "info_type") {
    if (commandName === "node:inspect") {
      candidates = ["os", "process", "jvm", "thread_pool", "transport", "http", "plugins", "ingest", "indices"];
    } else {
      candidates = ["mapping", "settings", "stats", "aliases"];
    }
  } else if (argType === "enum") {
    // Handled by caller who has the options array
    return [];
  } else {
    return [];
  }

  return candidates
    .filter(c => fuzzyMatch(c, q))
    .sort((a, b) => matchScore(a, q) - matchScore(b, q))
    .slice(0, 10);
}
