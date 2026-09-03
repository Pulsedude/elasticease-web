import React, { useRef, useEffect, useLayoutEffect, useImperativeHandle, forwardRef, useCallback, useState } from "react";

/**
 * CommandInput — bottom fixed input bar with interactive inline argument chips.
 * Converts custom CSS to Tailwind classes only where direct equivalents exist,
 * strictly preserving visual design, spacing, typography, positioning, colors,
 * and component structure.
 */
const CommandInput = forwardRef(function CommandInput(
  {
    value,
    parsed,
    onChange,
    onSubmit,
    onArrowUp,
    onArrowDown,
    onEscape,
    onTab,
    validationError,
    disabled,
    placeholder = "Type a command…",
    onArgFocusChange,
  },
  ref
) {
  const mainInputRef = useRef(null);
  const argInputRefs = useRef([]);
  const noArgInputRef = useRef(null);
  const [focusedArgIndex, setFocusedArgIndex] = useState(-1);

  const commandDef = parsed?.definition || null;
  const hasCommand = Boolean(commandDef);
  const argDefs = commandDef?.arguments || [];

  // Expose focus() to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (hasCommand && argDefs.length > 0) {
        const idx = focusedArgIndex >= 0 && focusedArgIndex < argDefs.length ? focusedArgIndex : 0;
        argInputRefs.current[idx]?.focus();
      } else if (hasCommand && argDefs.length === 0) {
        noArgInputRef.current?.focus();
      } else {
        mainInputRef.current?.focus();
      }
    },
  }));

  // Synchronously focus first argument when a command is entered, or main input when cleared
  useLayoutEffect(() => {
    if (hasCommand && argDefs.length > 0) {
      setFocusedArgIndex(0);
      if (onArgFocusChange) onArgFocusChange(0);
      argInputRefs.current[0]?.focus();
    } else if (hasCommand && argDefs.length === 0) {
      setFocusedArgIndex(-1);
      if (onArgFocusChange) onArgFocusChange(-1);
      noArgInputRef.current?.focus();
    } else {
      setFocusedArgIndex(-1);
      if (onArgFocusChange) onArgFocusChange(-1);
      mainInputRef.current?.focus();
    }
  }, [hasCommand, commandDef?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleArgFocus = (index) => {
    setFocusedArgIndex(index);
    if (onArgFocusChange) onArgFocusChange(index);
  };

  const handleArgInputChange = (index, newVal) => {
    if (!parsed?.commandName) return;

    const maxLen = Math.max(argDefs.length, (parsed?.argTokens || []).length, index + 1);
    const tokens = [];
    for (let i = 0; i < maxLen; i++) {
      tokens.push(parsed?.argTokens?.[i] ?? "");
    }
    tokens[index] = newVal;

    let lastNonEmptyIdx = -1;
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (tokens[i] !== undefined && String(tokens[i]).trim() !== "") {
        lastNonEmptyIdx = i;
        break;
      }
    }

    const cmdName = parsed.commandName;

    if (lastNonEmptyIdx === -1) {
      onChange(`${cmdName} `);
      return;
    }

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

    const newFullString = `${cmdName} ${formattedTokens.join(" ")}`;
    onChange(newFullString);
  };

  const handleClearCommand = useCallback(() => {
    setFocusedArgIndex(-1);
    if (onArgFocusChange) onArgFocusChange(-1);
    onChange("");
    setTimeout(() => mainInputRef.current?.focus(), 0);
  }, [onChange, onArgFocusChange]);

  const handleMainKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case "Enter":
          e.preventDefault();
          onSubmit();
          break;
        case "ArrowUp":
          e.preventDefault();
          onArrowUp();
          break;
        case "ArrowDown":
          e.preventDefault();
          onArrowDown();
          break;
        case "Escape":
          e.preventDefault();
          onEscape();
          break;
        case "Tab":
          e.preventDefault();
          onTab();
          break;
        default:
          break;
      }
    },
    [onSubmit, onArrowUp, onArrowDown, onEscape, onTab]
  );

  const handleArgKeyDown = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onArrowUp();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onArrowDown();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onEscape();
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        if (index > 0) {
          argInputRefs.current[index - 1]?.focus();
        } else {
          handleClearCommand();
        }
      } else {
        if (index < argDefs.length - 1) {
          argInputRefs.current[index + 1]?.focus();
        } else {
          onTab();
        }
      }
    } else if (e.key === "Backspace") {
      const currentVal = parsed?.argTokens?.[index] || "";
      if (!currentVal) {
        if (index > 0) {
          e.preventDefault();
          argInputRefs.current[index - 1]?.focus();
        } else if (index === 0) {
          e.preventDefault();
          handleClearCommand();
        }
      }
    }
  };

  return (
    <div className="console-input-area">
      {validationError && (
        <div className="console-validation-error" role="alert" aria-live="assertive">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{validationError}</span>
        </div>
      )}

      <div className="console-input-row">
        <span className="console-input-prompt" aria-hidden="true">›</span>

        {!hasCommand ? (
          <input
            ref={mainInputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleMainKeyDown}
            placeholder={placeholder}
            className="console-input"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            disabled={disabled}
            aria-label="Command input"
            aria-autocomplete="list"
            aria-haspopup="listbox"
          />
        ) : (
          <div className="flex items-center gap-[10px] flex-1 min-w-0 overflow-x-auto py-[4px]">
            {/* Command Pill */}
            <div className="inline-flex items-center gap-[6px] px-[10px] py-[4px] bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.3)] rounded-[6px] font-mono text-[13px] font-semibold text-[#818cf8] select-none shrink-0">
              <span>{parsed.commandName}</span>
              <button
                type="button"
                className="w-[16px] h-[16px] rounded-full inline-flex items-center justify-center bg-[rgba(99,102,241,0.2)] text-[#c7d2fe] text-[10px] hover:bg-[rgba(239,68,68,0.4)] hover:text-white transition-colors cursor-pointer border-0"
                onClick={handleClearCommand}
                aria-label="Clear command name"
                disabled={disabled}
              >
                ✕
              </button>
            </div>

            {/* Inline Argument Chips */}
            {argDefs.length > 0 ? (
              <div className="flex items-center gap-[8px] flex-1 min-w-0">
                {argDefs.map((argDef, i) => {
                  const val = parsed?.argTokens?.[i] ?? "";
                  const isFocused = focusedArgIndex === i;
                  const isMissing = validationError && argDef.required && !val.trim();

                  let chipClasses = "inline-flex items-center gap-[6px] px-[8px] py-[3px] rounded-[8px] border font-mono text-[12px] transition-all cursor-text shrink-0 ";
                  if (isMissing) {
                    chipClasses += "border-[#ef4444] bg-[rgba(239,68,68,0.1)] text-[#fca5a5] ring-2 ring-[rgba(239,68,68,0.25)] animate-shake";
                  } else if (isFocused) {
                    chipClasses += "border-[#6366f1] bg-[#16182a] ring-2 ring-[rgba(99,102,241,0.22)]";
                  } else {
                    chipClasses += "border-[#23273e] bg-[#11121c] hover:border-[#373b5a] hover:bg-[#151726]";
                  }

                  const inputCharWidth = Math.max(val.length, (argDef.description || argDef.name).length + 2, 10);

                  return (
                    <div
                      key={argDef.name}
                      className={chipClasses}
                      onClick={() => {
                        handleArgFocus(i);
                        argInputRefs.current[i]?.focus();
                      }}
                    >
                      {/* Argument Tag Badge */}
                      <span className={`text-[9.5px] font-semibold px-[5px] py-[1px] rounded uppercase tracking-[0.03em] ${
                        argDef.required
                          ? "bg-[rgba(239,68,68,0.15)] text-[#fca5a5] border border-[rgba(239,68,68,0.25)]"
                          : "bg-[rgba(148,163,184,0.1)] text-[#94a3b8] border border-[rgba(148,163,184,0.18)]"
                      }`}>
                        {argDef.required ? `<${argDef.name}>` : `[${argDef.name}]`}
                      </span>

                      {/* Input Space inside Chip */}
                      <input
                        ref={(el) => (argInputRefs.current[i] = el)}
                        type="text"
                        className="console-input"
                        style={{ width: `${inputCharWidth}ch`, height: 24 }}
                        value={val}
                        onChange={(e) => handleArgInputChange(i, e.target.value)}
                        onFocus={() => handleArgFocus(i)}
                        onKeyDown={(e) => handleArgKeyDown(e, i)}
                        placeholder={argDef.description || `enter ${argDef.name}`}
                        spellCheck={false}
                        autoComplete="off"
                        autoFocus={hasCommand && i === 0}
                        disabled={disabled}
                        aria-label={`Argument ${argDef.name}`}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-[8px] flex-1">
                <span className="text-[12px] text-[#64748b] italic select-none">
                  (No arguments required)
                </span>
                <input
                  ref={noArgInputRef}
                  type="text"
                  className="w-0 h-0 opacity-0 border-0 p-0 m-0 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (!disabled && onSubmit) onSubmit();
                    } else if (e.key === "Backspace") {
                      e.preventDefault();
                      handleClearCommand();
                    }
                  }}
                  disabled={disabled}
                  aria-label="No arguments input"
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default CommandInput;