/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  MAPPING BUILDER                                         ║
 * ║  Converts user field definitions into a valid            ║
 * ║  Elasticsearch schema mapping JSON document.             ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Handles:
 * - Key-value pairs: "name=text, age=keyword, email=keyword"
 * - Colon separator: "name: text, age: integer"
 * - Space separator: "name text, age integer"
 * - Multi-line definitions
 * - Common type aliases (int -> integer, string -> text, bool -> boolean, etc.)
 * - Direct JSON input (passes through or wraps in { mappings: { properties } })
 */

const TYPE_ALIASES = {
  string: "text",
  str: "text",
  int: "integer",
  number: "integer",
  bigint: "long",
  float32: "float",
  float64: "double",
  dec: "double",
  decimal: "double",
  bool: "boolean",
  datetime: "date",
  timestamp: "date",
  time: "date",
  array: "keyword",
  tag: "keyword",
  tags: "keyword",
};

const VALID_ES_TYPES = new Set([
  "text",
  "keyword",
  "constant_keyword",
  "wildcard",
  "long",
  "integer",
  "short",
  "byte",
  "double",
  "float",
  "half_float",
  "scaled_float",
  "unsigned_long",
  "date",
  "date_nanos",
  "boolean",
  "binary",
  "integer_range",
  "float_range",
  "long_range",
  "double_range",
  "date_range",
  "ip_range",
  "object",
  "nested",
  "flattened",
  "geo_point",
  "geo_shape",
  "point",
  "shape",
  "ip",
  "version",
  "murmur3",
  "token_count",
  "dense_vector",
  "search_as_you_type",
  "completion",
]);

/**
 * Normalizes a raw data type string to a valid Elasticsearch field type.
 * @param {string} rawType
 * @returns {string}
 */
export function normalizeFieldType(rawType) {
  if (!rawType || typeof rawType !== "string") return "text";
  const clean = rawType.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
  if (TYPE_ALIASES[clean]) {
    return TYPE_ALIASES[clean];
  }
  if (VALID_ES_TYPES.has(clean)) {
    return clean;
  }
  return clean || "text";
}

/**
 * Parses user input into a valid Elasticsearch mapping object:
 * {
 *   mappings: {
 *     properties: {
 *       fieldName: { type: "text" | "keyword" | ... }
 *     }
 *   }
 * }
 *
 * @param {string|object} input
 * @returns {{ valid: boolean, mapping?: object, summary?: string, fieldCount?: number, error?: string }}
 */
export function buildMappingDocument(input) {
  if (!input || (typeof input === "string" && !input.trim())) {
    return {
      valid: false,
      error: "No field definitions provided. Please specify at least one field (e.g. name=text, age=integer).",
    };
  }

  // Check if input is a JSON string or object
  if (typeof input === "object" && input !== null) {
    if (input.mappings && input.mappings.properties) {
      const keys = Object.keys(input.mappings.properties);
      return {
        valid: true,
        mapping: input,
        summary: `Valid JSON mapping with ${keys.length} field(s): ${keys.join(", ")}`,
        fieldCount: keys.length,
      };
    }
    if (input.properties) {
      const keys = Object.keys(input.properties);
      return {
        valid: true,
        mapping: { mappings: input },
        summary: `Valid JSON properties with ${keys.length} field(s): ${keys.join(", ")}`,
        fieldCount: keys.length,
      };
    }
  }

  if (typeof input === "string" && (input.trim().startsWith("{") || input.trim().startsWith("["))) {
    try {
      const parsedJson = JSON.parse(input.trim());
      if (parsedJson && typeof parsedJson === "object") {
        if (parsedJson.mappings && parsedJson.mappings.properties) {
          const keys = Object.keys(parsedJson.mappings.properties);
          return {
            valid: true,
            mapping: parsedJson,
            summary: `Valid JSON mapping with ${keys.length} field(s): ${keys.join(", ")}`,
            fieldCount: keys.length,
          };
        }
        if (parsedJson.properties) {
          const keys = Object.keys(parsedJson.properties);
          return {
            valid: true,
            mapping: { mappings: parsedJson },
            summary: `Valid JSON properties with ${keys.length} field(s): ${keys.join(", ")}`,
            fieldCount: keys.length,
          };
        }
        // Direct key-value mapping like {"name": "text", "age": "keyword"}
        const properties = {};
        for (const [k, v] of Object.entries(parsedJson)) {
          if (typeof v === "string") {
            properties[k] = { type: normalizeFieldType(v) };
          } else if (v && typeof v === "object") {
            properties[k] = v;
          }
        }
        const keys = Object.keys(properties);
        if (keys.length > 0) {
          return {
            valid: true,
            mapping: { mappings: { properties } },
            summary: `Mapped ${keys.length} field(s): ${keys.map(k => `${k} (${properties[k].type || "object"})`).join(", ")}`,
            fieldCount: keys.length,
          };
        }
      }
    } catch {
      // Not valid JSON, continue with text parsing
    }
  }

  // Parse text definition: e.g. "name=text, age=integer" or multi-line
  const text = String(input);
  const rawPairs = text
    .split(/[\n,;]+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (rawPairs.length === 0) {
    return {
      valid: false,
      error: "Could not parse any field definitions. Use format: fieldName=type, e.g. name=text, age=integer",
    };
  }

  const properties = {};
  const parsedFields = [];

  for (const pair of rawPairs) {
    let field = "";
    let rawType = "text";

    if (pair.includes("=")) {
      const parts = pair.split("=");
      field = parts[0].trim();
      rawType = parts.slice(1).join("=").trim();
    } else if (pair.includes(":")) {
      const parts = pair.split(":");
      field = parts[0].trim();
      rawType = parts.slice(1).join(":").trim();
    } else {
      // Space separated e.g. "name text"
      const parts = pair.trim().split(/\s+/);
      field = parts[0].trim();
      rawType = parts[1] ? parts[1].trim() : "text";
    }

    // Clean field name (remove quotes, brackets)
    field = field.replace(/['"`[\]]/g, "").trim();
    if (!field) continue;

    const normalizedType = normalizeFieldType(rawType);
    properties[field] = { type: normalizedType };
    parsedFields.push(`${field} (${normalizedType})`);
  }

  if (Object.keys(properties).length === 0) {
    return {
      valid: false,
      error: "No valid field names found. Example: name=text, age=integer, email=keyword",
    };
  }

  return {
    valid: true,
    mapping: {
      mappings: {
        properties,
      },
    },
    summary: `Mapped ${parsedFields.length} field(s): ${parsedFields.join(", ")}`,
    fieldCount: parsedFields.length,
  };
}
