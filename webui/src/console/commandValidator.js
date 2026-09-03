/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  COMMAND VALIDATOR                                      ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Validates a ParsedCommand before execution.
 *
 * ValidationResult:
 *   { valid: true }
 *   { valid: false, errorType: string, message: string, missingArg?: string }
 */

/**
 * @param {ParsedCommand} parsed
 * @returns {ValidationResult}
 */
export function validateCommand(parsed) {
  if (!parsed.commandName) {
    return { valid: false, errorType: "empty", message: "Type a command to get started." };
  }

  if (!parsed.definition) {
    return {
      valid: false,
      errorType: "unknown",
      message: `Unknown command: ${parsed.commandName}`,
    };
  }

  const missingArgs = parsed.definition.arguments.filter(
    arg => arg.required && (parsed.argMap[arg.name] === undefined || String(parsed.argMap[arg.name]).trim() === "")
  );

  if (missingArgs.length > 0) {
    const arg = missingArgs[0];
    return {
      valid: false,
      errorType: "missing_arg",
      message: `Missing required argument: <${arg.name}>`,
      missingArg: arg.name,
      missingArgDef: arg,
    };
  }

  for (const argDef of parsed.definition.arguments) {
    let val = parsed.argMap[argDef.name];
    if (val !== undefined && String(val).trim() !== "" && argDef.options && argDef.options.length > 0) {
      val = String(val).trim();
      if (!argDef.options.includes(val.toLowerCase())) {
        return {
          valid: false,
          errorType: "invalid_option",
          message: `Invalid value "${val}" for argument [${argDef.name}]. Allowed values: ${argDef.options.join(", ")}`,
        };
      }
    }
  }

  return { valid: true };
}
