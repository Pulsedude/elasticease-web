/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  COMMAND HISTORY MANAGER                                ║
 * ║  Manages typed-command history (up/down navigation).    ║
 * ║  Persisted in localStorage.                             ║
 * ╚══════════════════════════════════════════════════════════╝
 */

const STORAGE_KEY = "elasticease_console_cmd_history";
const MAX_HISTORY = 200;

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveToStorage(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch { /* quota exceeded — silently skip */ }
}

/**
 * Create a history manager instance.
 * The manager is stateful: it tracks the current navigation cursor.
 */
export function createHistoryManager() {
  let history = loadFromStorage();
  let cursor = history.length; // points past the end = "current" position

  return {
    /** Push a successfully-executed command string. */
    push(cmd) {
      if (!cmd || !cmd.trim()) return;
      // Remove duplicate if it was the last entry
      if (history[history.length - 1] === cmd.trim()) {
        cursor = history.length;
        return;
      }
      history = [...history, cmd.trim()].slice(-MAX_HISTORY);
      cursor = history.length;
      saveToStorage(history);
    },

    /**
     * Navigate backward (↑). Returns the previous command, or null
     * if already at the beginning.
     */
    navigateUp() {
      if (history.length === 0) return null;
      cursor = Math.max(0, cursor - 1);
      return history[cursor] ?? null;
    },

    /**
     * Navigate forward (↓). Returns the next command, or empty string
     * when returning past the last entry (i.e., back to blank input).
     */
    navigateDown() {
      if (history.length === 0) return "";
      cursor = Math.min(history.length, cursor + 1);
      if (cursor === history.length) return "";
      return history[cursor] ?? "";
    },

    /** Reset cursor to the "current" (past-end) position. */
    resetCursor() {
      cursor = history.length;
    },

    /** Return a snapshot of all stored commands. */
    getAll() {
      return [...history];
    },

    /** Clear stored history. */
    clear() {
      history = [];
      cursor = 0;
      localStorage.removeItem(STORAGE_KEY);
    },
  };
}
