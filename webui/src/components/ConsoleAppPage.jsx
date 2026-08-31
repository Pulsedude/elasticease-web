import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";

// ── Console sub-components (stay in console/ directory) ──
import ConsoleHistoryCmp from "../console/components/ConsoleHistory.jsx";
import CommandSuggestionPanel from "../console/components/CommandSuggestionPanel.jsx";
import CommandInput from "../console/components/CommandInput.jsx";
import CommandPalette from "../console/components/CommandPalette.jsx";
import QuickCommands from "../console/components/QuickCommands.jsx";

// ── Logic modules ──
import { parseInput, hasTrailingSpace, currentArgIndex } from "../console/commandParser.js";
import { validateCommand } from "../console/commandValidator.js";
import { getCommandSuggestions, getArgumentSuggestions } from "../console/suggestionEngine.js";
import { createHistoryManager } from "../console/historyManager.js";
import { executeCommand } from "../console/mockExecutor.js";
import { getCommand } from "../console/commandRegistry.js";

// Persistent across re-renders
const historyManager = createHistoryManager();
let nextEntryId = 1;

/**
 * ConsoleAppPage — the full command-driven Elasticease console.
 *
 * This component is the single entry point for /console.
 * All business logic (parsing, suggestion, execution, history) lives
 * in the ../console/ modules. The real API executor can be swapped
 * by replacing mockExecutor.js without touching this file.
 */
export default function ConsoleAppPage({ theme }) {
  // ── State ────────────────────────────────────────────────
  const [inputValue,           setInputValue]           = useState("");
  const [historyEntries,       setHistoryEntries]       = useState([]);
  const [loadingCommand,       setLoadingCommand]       = useState(null);
  const [paletteOpen,          setPaletteOpen]          = useState(false);
  const [suggestionActiveIndex,setSuggestionActiveIndex]= useState(-1);
  const [showSuggestions,      setShowSuggestions]      = useState(true);
  const [validationError,      setValidationError]      = useState(null);

  const inputRef = useRef(null);

  // ── Derived: parse + suggestions ────────────────────────
  const parsed = useMemo(() => parseInput(inputValue), [inputValue]);

  const { commandSuggestions, argSuggestions, suggestionMode, argHint } = useMemo(() => {
    if (!showSuggestions || !inputValue.trim()) {
      return { commandSuggestions: [], argSuggestions: [], suggestionMode: "command", argHint: null };
    }

    if (parsed.definition) {
      const argIdx = currentArgIndex(parsed, inputValue);
      if (argIdx >= 0 && argIdx < parsed.definition.arguments.length) {
        const argDef = parsed.definition.arguments[argIdx];
        const partial = hasTrailingSpace(inputValue)
          ? ""
          : parsed.argTokens[argIdx] ?? "";

        const argSugg = argDef.type === "enum"
          ? (argDef.options ?? []).filter(o => o.toLowerCase().includes(partial.toLowerCase()))
          : getArgumentSuggestions(parsed.commandName, argDef.name, argDef.type, partial);

        return {
          commandSuggestions: [],
          argSuggestions: argSugg,
          suggestionMode: "argument",
          argHint: argDef.required ? `<${argDef.name}>` : `[${argDef.name}]`,
        };
      }
      return { commandSuggestions: [], argSuggestions: [], suggestionMode: "command", argHint: null };
    }

    const cmdSugg = getCommandSuggestions(inputValue);
    return { commandSuggestions: cmdSugg, argSuggestions: [], suggestionMode: "command", argHint: null };
  }, [inputValue, parsed, showSuggestions]);

  const hasSuggestions   = commandSuggestions.length > 0 || argSuggestions.length > 0;
  const totalSuggestions = suggestionMode === "command" ? commandSuggestions.length : argSuggestions.length;

  // ── Handlers ─────────────────────────────────────────────
  const handleInputChange = useCallback((val) => {
    setInputValue(val);
    setSuggestionActiveIndex(-1);
    setShowSuggestions(true);
    setValidationError(null);
    historyManager.resetCursor();
  }, []);

  const applySuggestion = useCallback((value) => {
    if (suggestionMode === "command") {
      const def = commandSuggestions.find(s => s.command.name === value)?.command;
      const suffix = def && def.arguments.length > 0 ? " " : "";
      setInputValue(value + suffix);
    } else {
      const tokens = [...parsed.argTokens];
      const targetIdx = hasTrailingSpace(inputValue) ? tokens.length : Math.max(0, tokens.length - 1);
      tokens[targetIdx] = value;
      setInputValue(`${parsed.commandName} ${tokens.join(" ")} `);
    }
    setSuggestionActiveIndex(-1);
    setShowSuggestions(true);
    setValidationError(null);
    inputRef.current?.focus();
  }, [suggestionMode, commandSuggestions, parsed, inputValue]);

  const handleSubmit = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // If a suggestion is highlighted, select it
    if (hasSuggestions && suggestionActiveIndex >= 0) {
      const val = suggestionMode === "command"
        ? commandSuggestions[suggestionActiveIndex]?.command.name
        : argSuggestions[suggestionActiveIndex];
      if (val) { applySuggestion(val); return; }
    }

    // Validate
    const validation = validateCommand(parsed);
    if (!validation.valid) {
      if (validation.errorType !== "empty") setValidationError(validation.message);
      return;
    }

    // Execute
    setShowSuggestions(false);
    setValidationError(null);
    setLoadingCommand(trimmed);
    historyManager.push(trimmed);

    try {
      const result = await executeCommand(parsed);
      setHistoryEntries(prev => [...prev, { id: nextEntryId++, command: trimmed, result }]);
    } catch (err) {
      setHistoryEntries(prev => [...prev, {
        id: nextEntryId++,
        command: trimmed,
        result: {
          status: "error", statusCode: 500, durationMs: 0, format: "json",
          data: { error: { reason: err.message || "Unexpected error", status: 500 } },
        },
      }]);
    } finally {
      setLoadingCommand(null);
      setInputValue("");
      setSuggestionActiveIndex(-1);
      setShowSuggestions(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [inputValue, parsed, hasSuggestions, suggestionActiveIndex, suggestionMode, commandSuggestions, argSuggestions, applySuggestion]);

  const handleArrowUp = useCallback(() => {
    if (hasSuggestions && showSuggestions) {
      setSuggestionActiveIndex(i => i <= 0 ? totalSuggestions - 1 : i - 1);
    } else {
      const prev = historyManager.navigateUp();
      if (prev !== null) { setInputValue(prev); setSuggestionActiveIndex(-1); setShowSuggestions(false); }
    }
  }, [hasSuggestions, showSuggestions, totalSuggestions]);

  const handleArrowDown = useCallback(() => {
    if (hasSuggestions && showSuggestions) {
      setSuggestionActiveIndex(i => i >= totalSuggestions - 1 ? -1 : i + 1);
    } else {
      const next = historyManager.navigateDown();
      setInputValue(next);
      setSuggestionActiveIndex(-1);
      setShowSuggestions(next.length > 0);
    }
  }, [hasSuggestions, showSuggestions, totalSuggestions]);

  const handleEscape = useCallback(() => {
    if (showSuggestions && hasSuggestions) {
      setShowSuggestions(false);
      setSuggestionActiveIndex(-1);
    } else {
      setShowSuggestions(true);
      setSuggestionActiveIndex(-1);
    }
    setValidationError(null);
  }, [showSuggestions, hasSuggestions]);

  const handleTab = useCallback(() => {
    const idx = suggestionActiveIndex >= 0 ? suggestionActiveIndex : 0;
    const val = suggestionMode === "command"
      ? commandSuggestions[idx]?.command.name
      : argSuggestions[idx];
    if (val) applySuggestion(val);
  }, [suggestionActiveIndex, suggestionMode, commandSuggestions, argSuggestions, applySuggestion]);

  const handleQuickInsert = useCallback((cmd) => {
    setInputValue(cmd + " ");
    setShowSuggestions(true);
    setSuggestionActiveIndex(-1);
    setValidationError(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handlePaletteSelect = useCallback((cmdName) => {
    const d = getCommand(cmdName);
    const suffix = d && d.arguments.length > 0 ? " " : "";
    setInputValue(cmdName + suffix);
    setShowSuggestions(true);
    setSuggestionActiveIndex(-1);
    setValidationError(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  // Ctrl/Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="console-page" aria-label="Elasticease Console">

      {/* ── Console toolbar: quick commands + Ctrl+K hint ── */}
      <div className="console-top-bar">
        <QuickCommands onInsert={handleQuickInsert} />
        <button
          className="console-palette-hint"
          onClick={() => setPaletteOpen(true)}
          title="Open command palette (Ctrl+K)"
          aria-label="Open command palette"
          type="button"
        >
          <kbd>Ctrl</kbd><span>+</span><kbd>K</kbd>
          <span className="console-palette-hint-label">Palette</span>
        </button>
      </div>

      {/* ── Scrollable history ── */}
      <ConsoleHistoryCmp
        entries={historyEntries}
        loadingCommand={loadingCommand}
      />

      {/* ── Suggestion panel above input ── */}
      {showSuggestions && hasSuggestions && (
        <CommandSuggestionPanel
          suggestions={commandSuggestions}
          argSuggestions={argSuggestions}
          activeIndex={suggestionActiveIndex}
          onSelect={applySuggestion}
          mode={suggestionMode}
          argHint={argHint}
        />
      )}

      {/* ── Fixed bottom input ── */}
      <CommandInput
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        onArrowUp={handleArrowUp}
        onArrowDown={handleArrowDown}
        onEscape={handleEscape}
        onTab={handleTab}
        validationError={validationError}
        disabled={Boolean(loadingCommand)}
      />

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={handlePaletteSelect}
      />
    </div>
  );
}