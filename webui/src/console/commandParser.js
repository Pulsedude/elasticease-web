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
  let hasToken = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuote) {
      if (ch === quoteChar) {
        inQuote = false;
        hasToken = true;
      } else {
        current += ch;
        hasToken = true;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = true;
      quoteChar = ch;
      hasToken = true;
    } else if (ch === " " || ch === "\t") {
      if (hasToken || current.length > 0) {
        tokens.push(current);
        current = "";
        hasToken = false;
      }
    } else {
      current += ch;
      hasToken = true;
    }
  }
  if (hasToken || current.length > 0) tokens.push(current);
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
  const rawArgTokens = tokens.slice(1);
  const definition = getCommand(commandName) || null;

  // Build named arg map from positional tokens + definition
  const argMap = {};
  const normalizedArgTokens = [...rawArgTokens];

  if (definition) {
    const positionalTokens = [];
    const definedNames = new Set(definition.arguments.map(a => a.name.toLowerCase()));

    for (let i = 0; i < rawArgTokens.length; i++) {
      const token = rawArgTokens[i];
      const eqIdx = token.indexOf("=");
      if (eqIdx > 0) {
        const rawKey = token.slice(0, eqIdx).toLowerCase();
        const potentialKey = rawKey.replace(/^--?/, "");
        const potentialVal = token.slice(eqIdx + 1);
        if (definedNames.has(potentialKey)) {
          const matchedDef = definition.arguments.find(a => a.name.toLowerCase() === potentialKey);
          argMap[matchedDef.name] = potentialVal;
          normalizedArgTokens[i] = potentialVal;
          continue;
        }
      } else if (token.startsWith("--")) {
        normalizedArgTokens[i] = token.replace(/^--?/, "");
      }
      positionalTokens.push(normalizedArgTokens[i]);
    }

    let posIdx = 0;
    for (const argDef of definition.arguments) {
      if (argMap[argDef.name] === undefined && posIdx < positionalTokens.length) {
        argMap[argDef.name] = positionalTokens[posIdx];
        posIdx++;
      }
    }
  }

  return {
    raw,
    commandName,
    argTokens: normalizedArgTokens,
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
