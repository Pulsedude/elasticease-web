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
    arg => arg.required && parsed.argMap[arg.name] === undefined
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

  return { valid: true };
}
