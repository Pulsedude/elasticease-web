/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  COMMAND PARSER                                         ║
 * ║  Transforms raw input string into a structured          ║
 * ║  ParsedCommand object. Completely UI-agnostic.          ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Supports:
 *   command:name arg1 "arg with spaces" arg3
 *
 * ParsedCommand shape:
 *   {
 *     raw:         string,           // original input
 *     commandName: string | null,    // e.g. "index:get"
 *     argTokens:   string[],         // positional arg values
 *     isComplete:  boolean,          // name resolved to a registry cmd
 *   }
 */

import { getCommand } from "./commandRegistry.js";

/**
 * Tokenise the raw input respecting quoted strings.
 * @param {string} input
 * @returns {string[]}
 */
export function tokenise(input) {
  const tokens = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuote) {
      if (ch === quoteChar) { inQuote = false; }
      else { current += ch; }
    } else if (ch === '"' || ch === "'") {
      inQuote = true;
      quoteChar = ch;
    } else if (ch === " " || ch === "\t") {
      if (current.length > 0) { tokens.push(current); current = ""; }
    } else {
      current += ch;
    }
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

/**
 * Parse a raw input string into a structured ParsedCommand.
 * @param {string} raw
 * @returns {ParsedCommand}
 */
export function parseInput(raw) {
  const trimmed = raw.trim();
  const tokens = tokenise(trimmed);

  if (tokens.length === 0) {
    return { raw, commandName: null, argTokens: [], argMap: {}, definition: null, isComplete: false };
  }

  const commandName = tokens[0].toLowerCase();
  const argTokens = tokens.slice(1);
  const definition = getCommand(commandName) || null;

  // Build named arg map from positional tokens + definition
  const argMap = {};
  if (definition) {
    definition.arguments.forEach((argDef, i) => {
      if (argTokens[i] !== undefined) {
        argMap[argDef.name] = argTokens[i];
      }
    });
  }

  return {
    raw,
    commandName,
    argTokens,
    argMap,
    definition,
    isComplete: Boolean(definition),
  };
}

/**
 * True if the input ends with a trailing space (user is starting
 * to enter the next argument).
 * @param {string} raw
 */
export function hasTrailingSpace(raw) {
  return raw.length > 0 && raw[raw.length - 1] === " ";
}

/**
 * Return the index of the argument the user is currently typing.
 * Returns -1 if they haven't started any args yet.
 * @param {ParsedCommand} parsed
 * @param {string} raw
 */
export function currentArgIndex(parsed, raw) {
  if (parsed.argTokens.length === 0 && !hasTrailingSpace(raw)) return -1;
  if (hasTrailingSpace(raw)) return parsed.argTokens.length;
  return Math.max(0, parsed.argTokens.length - 1);
}
