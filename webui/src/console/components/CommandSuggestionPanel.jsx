import React, { useRef, useEffect } from "react";

/**
 * CommandSuggestionPanel
 * Renders above the command input. Shows filtered commands or
 * argument suggestions with theme support, active item highlighting,
 * and automatic keyboard-driven scrolling.
 *
 * Props:
 *   suggestions       — CommandSuggestion[] (command mode)
 *   argSuggestions    — string[]            (argument mode)
 *   activeIndex       — number              (highlighted row index)
 *   onSelect          — (value: string) => void
 *   onHighlight       — (index: number) => void
 *   mode              — "command" | "argument"
 *   argHint           — string | null       (e.g. "<index>")
 */
export default function CommandSuggestionPanel({
  suggestions,
  argSuggestions,
  activeIndex,
  onSelect,
  onHighlight,
  mode,
  argHint,
}) {
  const panelRef = useRef(null);

  const hasItems =
    (mode === "command" && suggestions.length > 0) ||
    (mode === "argument" && argSuggestions.length > 0);

  // Reset scroll to top whenever the suggestions list or mode changes
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [suggestions, argSuggestions, mode]);

  // Keep active suggestion item scrolled into view when navigating with ArrowDown / ArrowUp
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (activeIndex <= 0) {
      panel.scrollTop = 0;
      return;
    }

    const activeEl = panel.querySelector("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
    }
  }, [activeIndex]);

  if (!hasItems) return null;

  return (
    <div
      ref={panelRef}
      className="suggestion-panel"
      role="listbox"
      aria-label="Command suggestions"
      tabIndex={-1}
    >
      {mode === "command" && (
        <>
          {argHint && (
            <div className="suggestion-arg-hint">
              <span className="suggestion-arg-hint-text">{argHint}</span>
            </div>
          )}
          {suggestions.map((s, i) => (
            <SuggestionRow
              key={s.command.name}
              command={s.command}
              segments={s.matchedSegments}
              isActive={i === activeIndex}
              onSelect={() => onSelect(s.command.name)}
              onHighlight={() => onHighlight && onHighlight(i)}
            />
          ))}
        </>
      )}

      {mode === "argument" && (
        <>
          {argHint && (
            <div className="suggestion-arg-hint">
              <span className="suggestion-arg-hint-label">Argument</span>
              <span className="suggestion-arg-hint-text">{argHint}</span>
            </div>
          )}
          {argSuggestions.map((val, i) => (
            <ArgSuggestionRow
              key={val}
              value={val}
              isActive={i === activeIndex}
              onSelect={() => onSelect(val)}
              onHighlight={() => onHighlight && onHighlight(i)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function SuggestionRow({ command, segments, isActive, onSelect, onHighlight }) {
  const argHints = command.arguments
    .map(a => (a.required ? `<${a.name}>` : `[${a.name}]`))
    .join(" ");

  return (
    <div
      className={`suggestion-row ${isActive ? "suggestion-row--active" : ""}`}
      data-active={isActive ? "true" : undefined}
      role="option"
      aria-selected={isActive}
      onClick={onSelect}
      onMouseMove={() => {
        if (!isActive && onHighlight) onHighlight();
      }}
      onMouseDown={e => e.preventDefault()}
    >
      <div className="suggestion-row-main">
        <span className="suggestion-name">
          {segments
            ? segments.map((seg, i) => (
                <span
                  key={i}
                  className={seg.highlighted ? "suggestion-match" : "suggestion-plain"}
                >
                  {seg.text}
                </span>
              ))
            : command.name}
        </span>
        {argHints && (
          <span className="suggestion-args">{argHints}</span>
        )}
      </div>
      <div className="suggestion-desc">{command.description}</div>
    </div>
  );
}

function ArgSuggestionRow({ value, isActive, onSelect, onHighlight }) {
  return (
    <div
      className={`suggestion-row suggestion-row--arg ${isActive ? "suggestion-row--active" : ""}`}
      data-active={isActive ? "true" : undefined}
      role="option"
      aria-selected={isActive}
      onClick={onSelect}
      onMouseMove={() => {
        if (!isActive && onHighlight) onHighlight();
      }}
      onMouseDown={e => e.preventDefault()}
    >
      <span className="suggestion-arg-value">{value}</span>
    </div>
  );
}
