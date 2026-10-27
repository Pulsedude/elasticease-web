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
import { executeCommand, fetchIndexCreate, fetchIndexDelete } from "../console/mockExecutor.js";
import { getCommand } from "../console/commandRegistry.js";
import { buildMappingDocument } from "../console/mappingBuilder.js";

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
  const [pendingPrompt,        setPendingPrompt]        = useState(null);

  const [activeArgIndex,       setActiveArgIndex]       = useState(-1);

  const inputRef = useRef(null);

  // ── Derived: parse + suggestions ────────────────────────
  const parsed = useMemo(() => parseInput(inputValue), [inputValue]);

  const { commandSuggestions, argSuggestions, suggestionMode, argHint } = useMemo(() => {
    if (!showSuggestions || !inputValue.trim() || pendingPrompt) {
      return { commandSuggestions: [], argSuggestions: [], suggestionMode: "command", argHint: null };
    }

    if (parsed.definition) {
      const calcIdx = currentArgIndex(parsed, inputValue);
      const argIdx = activeArgIndex >= 0 ? activeArgIndex : calcIdx;
      if (argIdx >= 0 && argIdx < parsed.definition.arguments.length) {
        const argDef = parsed.definition.arguments[argIdx];
        const partial = parsed.argTokens[argIdx] ?? "";

        const argSugg = (argDef.type === "enum" || (argDef.options && argDef.options.length > 0))
          ? (argDef.options ?? []).filter(o => o.toLowerCase().includes(partial.toLowerCase()))
          : getArgumentSuggestions(parsed.commandName, argDef.name, argDef.type, partial);

        return {
          commandSuggestions: [],
          argSuggestions: argSugg,
          suggestionMode: "argument",
          argHint: argDef.required ? `<${argDef.name}> (Required)` : `[${argDef.name}] (Optional)`,
        };
      }
      return { commandSuggestions: [], argSuggestions: [], suggestionMode: "command", argHint: null };
    }

    const cmdSugg = getCommandSuggestions(inputValue);
    return { commandSuggestions: cmdSugg, argSuggestions: [], suggestionMode: "command", argHint: null };
  }, [inputValue, parsed, showSuggestions, activeArgIndex, pendingPrompt]);

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
      setActiveArgIndex(0);
    } else {
      const targetIdx = activeArgIndex >= 0 ? activeArgIndex : Math.max(0, currentArgIndex(parsed, inputValue));
      const maxLen = Math.max(parsed.definition?.arguments?.length || 0, (parsed?.argTokens || []).length, targetIdx + 1);
      const tokens = [];
      for (let i = 0; i < maxLen; i++) {
        tokens.push(parsed?.argTokens?.[i] ?? "");
      }
      tokens[targetIdx] = value;

      let lastNonEmptyIdx = -1;
      for (let i = tokens.length - 1; i >= 0; i--) {
        if (tokens[i] !== undefined && String(tokens[i]).trim() !== "") {
          lastNonEmptyIdx = i;
          break;
        }
      }

      const cmdName = parsed.commandName;
      if (lastNonEmptyIdx === -1) {
        setInputValue(`${cmdName} `);
      } else {
        const formattedTokens = [];
        for (let i = 0; i <= lastNonEmptyIdx; i++) {
          const t = String(tokens[i] ?? "");
          if (t === "") {
            formattedTokens.push('""');
          } else if (t.includes(" ") && !t.startsWith('"')) {
            formattedTokens.push(`"${t}"`);
          } else {
            formattedTokens.push(t);
          }
        }
        setInputValue(`${cmdName} ${formattedTokens.join(" ")}`);
      }
    }
    setSuggestionActiveIndex(-1);
    setShowSuggestions(true);
    setValidationError(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [suggestionMode, commandSuggestions, parsed, inputValue, activeArgIndex]);

  const handleConfirmDelete = useCallback(async (indexName) => {
    setLoadingCommand(`Deleting index '${indexName}'...`);
    try {
      const res = await fetchIndexDelete(indexName);
      setHistoryEntries(prev => [...prev, { id: nextEntryId++, command: `delete: ${indexName}`, result: res }]);
    } catch (err) {
      setHistoryEntries(prev => [...prev, {
        id: nextEntryId++,
        command: `delete: ${indexName}`,
        result: {
          status: "error", statusCode: 500, durationMs: 0, format: "json",
          data: { error: { reason: err.message || "Failed to delete index", status: 500 } },
        },
      }]);
    } finally {
      setLoadingCommand(null);
      setPendingPrompt(null);
      setInputValue("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, []);

  const handleCancelPrompt = useCallback(() => {
    if (pendingPrompt) {
      const msg = pendingPrompt.type === "confirm_delete"
        ? `Index deletion cancelled for index '${pendingPrompt.indexName}'. No data was deleted.`
        : `Index creation cancelled for index '${pendingPrompt.indexName}'.`;
      setHistoryEntries(prev => [...prev, {
        id: nextEntryId++,
        command: "cancel",
        result: { status: "ok", statusCode: 200, durationMs: 0, format: "text", data: msg },
      }]);
      setPendingPrompt(null);
      setInputValue("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [pendingPrompt]);

  const handleSubmit = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // ── Handle Pending Interactive Prompts ──
    if (pendingPrompt) {
      setShowSuggestions(false);
      setValidationError(null);
      const inputStr = trimmed;
      const prompt = pendingPrompt;
      setInputValue("");

      if (prompt.type === "confirm_delete") {
        const lower = inputStr.toLowerCase();
        if (lower === "yes" || lower === "y" || lower === "true" || lower === "confirm") {
          setLoadingCommand(`Deleting index '${prompt.indexName}'...`);
          try {
            const res = await fetchIndexDelete(prompt.indexName);
            setHistoryEntries(prev => [...prev, { id: nextEntryId++, command: inputStr, result: res }]);
          } catch (err) {
            setHistoryEntries(prev => [...prev, {
              id: nextEntryId++,
              command: inputStr,
              result: {
                status: "error", statusCode: 500, durationMs: 0, format: "json",
                data: { error: { reason: err.message || "Failed to delete index", status: 500 } },
              },
            }]);
          } finally {
            setLoadingCommand(null);
            setPendingPrompt(null);
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        } else {
          setHistoryEntries(prev => [...prev, {
            id: nextEntryId++,
            command: inputStr,
            result: {
              status: "ok",
              statusCode: 200,
              durationMs: 0,
              format: "text",
              data: `Index deletion cancelled for index '${prompt.indexName}'. No data was deleted.`,
            },
          }]);
          setPendingPrompt(null);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        return;
      }

      if (prompt.type === "input_mapping") {
        const lower = inputStr.toLowerCase();
        if (lower === "cancel" || lower === "abort" || lower === "exit") {
          setHistoryEntries(prev => [...prev, {
            id: nextEntryId++,
            command: inputStr,
            result: {
              status: "ok",
              statusCode: 200,
              durationMs: 0,
              format: "text",
              data: `Index creation cancelled for index '${prompt.indexName}'.`,
            },
          }]);
          setPendingPrompt(null);
          setTimeout(() => inputRef.current?.focus(), 0);
          return;
        }

        const mappingResult = buildMappingDocument(inputStr);
        if (!mappingResult.valid) {
          setHistoryEntries(prev => [...prev, {
            id: nextEntryId++,
            command: inputStr,
            result: {
              status: "error",
              statusCode: 400,
              durationMs: 0,
              format: "text",
              data: `Invalid field mappings: ${mappingResult.error}\n\nPlease try again (e.g. name=text, age=integer, email=keyword) or type 'cancel' to abort.`,
            },
          }]);
          setTimeout(() => inputRef.current?.focus(), 0);
          return;
        }

        setLoadingCommand(`Creating index '${prompt.indexName}' with custom schema mappings...`);
        try {
          const res = await fetchIndexCreate(prompt.indexName, true, mappingResult.mapping);
          const displayData = res.status === "ok" && typeof res.data === "object"
            ? { ...res.data, applied_mapping: mappingResult.mapping, schema_summary: mappingResult.summary }
            : res.data;
          setHistoryEntries(prev => [...prev, {
            id: nextEntryId++,
            command: `schema: ${inputStr}`,
            result: { ...res, data: displayData },
          }]);
        } catch (err) {
          setHistoryEntries(prev => [...prev, {
            id: nextEntryId++,
            command: `schema: ${inputStr}`,
            result: {
              status: "error", statusCode: 500, durationMs: 0, format: "json",
              data: { error: { reason: err.message || "Failed to create index", status: 500 } },
            },
          }]);
        } finally {
          setLoadingCommand(null);
          setPendingPrompt(null);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        return;
      }
    }

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

    // Interactive command interception
    if (parsed.commandName === "index:delete") {
      const indexName = parsed.argMap.index || parsed.argTokens[0] || "";
      const isConfirm = String(parsed.argMap.confirm ?? parsed.argTokens[1] ?? "").toLowerCase().trim() === "true";
      if (!isConfirm) {
        historyManager.push(trimmed);
        setHistoryEntries(prev => [...prev, {
          id: nextEntryId++,
          command: trimmed,
          result: {
            status: "ok",
            statusCode: 200,
            durationMs: 0,
            format: "text",
            data: `⚠️ Confirmation required: Are you sure you want to permanently delete index '${indexName}' and ALL its data?\nType 'yes' or 'y' to confirm, or 'no' to abort.`,
          },
        }]);
        setPendingPrompt({ type: "confirm_delete", indexName });
        setInputValue("");
        setActiveArgIndex(-1);
        setTimeout(() => inputRef.current?.focus(), 0);
        return;
      }
    }

    if (parsed.commandName === "index:create") {
      const indexName = parsed.argMap.index_name || parsed.argMap.index || parsed.argTokens[0] || "";
      const withMappingRaw = String(parsed.argMap.with_mapping ?? parsed.argTokens[1] ?? "").toLowerCase().trim();
      const withMapping = withMappingRaw === "true" || withMappingRaw === "1" || withMappingRaw === "yes";

      if (withMapping) {
        historyManager.push(trimmed);
        setHistoryEntries(prev => [...prev, {
          id: nextEntryId++,
          command: trimmed,
          result: {
            status: "ok",
            statusCode: 200,
            durationMs: 0,
            format: "text",
            data: `📋 Custom schema mapping requested for index '${indexName}'.\nPlease enter the field definitions below.\nExample: name=text, age=integer, email=keyword, created_at=date\n(Or paste a JSON mapping document, or type 'cancel' to abort)`,
          },
        }]);
        setPendingPrompt({ type: "input_mapping", indexName });
        setInputValue("");
        setActiveArgIndex(-1);
        setTimeout(() => inputRef.current?.focus(), 0);
        return;
      }
    }

    // Execute standard command
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
      setActiveArgIndex(-1);
      setSuggestionActiveIndex(-1);
      setShowSuggestions(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [inputValue, parsed, hasSuggestions, suggestionActiveIndex, suggestionMode, commandSuggestions, argSuggestions, applySuggestion, pendingPrompt]);

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
    setActiveArgIndex(0);
    setShowSuggestions(true);
    setSuggestionActiveIndex(-1);
    setValidationError(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handlePaletteSelect = useCallback((cmdName) => {
    const d = getCommand(cmdName);
    const suffix = d && d.arguments.length > 0 ? " " : "";
    setInputValue(cmdName + suffix);
    setActiveArgIndex(0);
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

      {/* ── Interactive Prompt Banner (for confirm_delete or input_mapping) ── */}
      {pendingPrompt && (
        <div className="mx-4 mb-2 p-3 rounded-lg border flex items-center justify-between text-xs font-mono shadow-sm bg-[rgba(99,102,241,0.08)] border-[rgba(99,102,241,0.25)] text-[#c7d2fe]">
          <div className="flex items-center gap-2">
            <span className="text-[#818cf8] font-semibold">
              {pendingPrompt.type === "confirm_delete" ? "⚠️ Delete Confirmation:" : "📋 Schema Mapping:"}
            </span>
            <span>
              {pendingPrompt.type === "confirm_delete"
                ? `Delete index '${pendingPrompt.indexName}'? Type 'yes' or click Confirm.`
                : `Enter field definitions for '${pendingPrompt.indexName}' (e.g. name=text, age=integer) below.`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {pendingPrompt.type === "confirm_delete" && (
              <button
                type="button"
                onClick={() => handleConfirmDelete(pendingPrompt.indexName)}
                className="px-2.5 py-1 rounded bg-[#ef4444] hover:bg-[#dc2626] text-white text-[11px] font-medium transition cursor-pointer"
              >
                Confirm Delete
              </button>
            )}
            <button
              type="button"
              onClick={handleCancelPrompt}
              className="px-2.5 py-1 rounded bg-[rgba(148,163,184,0.15)] hover:bg-[rgba(148,163,184,0.25)] text-[#cbd5e1] text-[11px] font-medium transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Fixed bottom input ── */}
      <CommandInput
        ref={inputRef}
        value={inputValue}
        parsed={parsed}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        onArrowUp={handleArrowUp}
        onArrowDown={handleArrowDown}
        onEscape={handleEscape}
        onTab={handleTab}
        validationError={validationError}
        disabled={Boolean(loadingCommand)}
        onArgFocusChange={setActiveArgIndex}
        placeholder={
          pendingPrompt?.type === "confirm_delete"
            ? "Type 'yes' to confirm or 'no' to cancel..."
            : pendingPrompt?.type === "input_mapping"
            ? "Enter fields (e.g. name=text, age=integer) or 'cancel'..."
            : "Type a command…"
        }
      />

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={handlePaletteSelect}
      />
    </div>
  );
}