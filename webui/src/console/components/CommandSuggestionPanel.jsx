import React from "react";

/**
 * CommandSuggestionPanel
 * Renders above the command input. Shows filtered commands or
 * argument suggestions with theme support and Tailwind styling.
 *
 * Props:
 *   suggestions       — CommandSuggestion[] (command mode)
 *   argSuggestions    — string[]            (argument mode)
 *   activeIndex       — number              (highlighted row index)
 *   onSelect          — (value: string) => void
 *   mode              — "command" | "argument"
 *   argHint           — string | null       (e.g. "<index>")
 */
export default function CommandSuggestionPanel({
  suggestions,
  argSuggestions,
  activeIndex,
  onSelect,
  mode,
  argHint,
}) {
  const hasItems =
    (mode === "command" && suggestions.length > 0) ||
    (mode === "argument" && argSuggestions.length > 0);

  if (!hasItems) return null;

  return (
    <div className="suggestion-panel" role="listbox" aria-label="Command suggestions">
      {mode === "command" && (
        <>
          {argHint && (
            <div className="suggestion-arg-hint flex items-center gap-2 px-5 py-1.5">
              <span className="suggestion-arg-hint-text text-xs font-mono font-medium">{argHint}</span>
            </div>
          )}
          {suggestions.map((s, i) => (
            <SuggestionRow
              key={s.command.name}
              command={s.command}
              segments={s.matchedSegments}
              isActive={i === activeIndex}
              onSelect={() => onSelect(s.command.name)}
            />
          ))}
        </>
      )}

      {mode === "argument" && (
        <>
          {argHint && (
            <div className="suggestion-arg-hint flex items-center gap-2 px-5 py-1.5">
              <span className="suggestion-arg-hint-label text-[10px] font-bold uppercase tracking-wider">Argument</span>
              <span className="suggestion-arg-hint-text text-xs font-mono font-medium">{argHint}</span>
            </div>
          )}
          {argSuggestions.map((val, i) => (
            <ArgSuggestionRow
              key={val}
              value={val}
              isActive={i === activeIndex}
              onSelect={() => onSelect(val)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function SuggestionRow({ command, segments, isActive, onSelect }) {
  const argHints = command.arguments
    .map(a => (a.required ? `<${a.name}>` : `[${a.name}]`))
    .join(" ");

  return (
    <div
      className={`suggestion-row ${isActive ? "suggestion-row--active" : ""}`}
      role="option"
      aria-selected={isActive}
      onClick={onSelect}
      onMouseDown={e => e.preventDefault()}
    >
      <div className="suggestion-row-main flex items-center gap-2 font-mono">
        <span className="suggestion-name text-xs font-semibold">
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
          <span className="suggestion-args text-xs">{argHints}</span>
        )}
      </div>
      <div className="suggestion-desc text-xs leading-snug">{command.description}</div>
    </div>
  );
}

function ArgSuggestionRow({ value, isActive, onSelect }) {
  return (
    <div
      className={`suggestion-row suggestion-row--arg ${isActive ? "suggestion-row--active" : ""}`}
      role="option"
      aria-selected={isActive}
      onClick={onSelect}
      onMouseDown={e => e.preventDefault()}
    >
      <span className="suggestion-arg-value text-xs font-mono font-semibold">{value}</span>
    </div>
  );
}