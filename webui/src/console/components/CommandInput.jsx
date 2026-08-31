import React, { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";

/**
 * CommandInput — the bottom fixed input bar.
 *
 * Props:
 *   value              string
 *   onChange           (val: string) => void
 *   onSubmit           () => void
 *   onArrowUp          () => void
 *   onArrowDown        () => void
 *   onEscape           () => void
 *   onTab              () => void
 *   validationError    string | null
 *   disabled           boolean
 *   placeholder        string
 */
const CommandInput = forwardRef(function CommandInput(
  {
    value,
    onChange,
    onSubmit,
    onArrowUp,
    onArrowDown,
    onEscape,
    onTab,
    validationError,
    disabled,
    placeholder = "Type a command…",
  },
  ref
) {
  const inputRef = useRef(null);

  // Expose focus() to parent
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
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

  return (
    <div className="console-input-area">
      {validationError && (
        <div className="console-validation-error" role="alert" aria-live="assertive">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{validationError}</span>
        </div>
      )}
      <div className="console-input-row">
        <span className="console-input-prompt" aria-hidden="true">›</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
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
      </div>
    </div>
  );
});

export default CommandInput;