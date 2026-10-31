import React, { useState, useRef, useEffect, useCallback } from "react";
import { getCommandsByCategory, COMMAND_REGISTRY } from "../commandRegistry.js";

/**
 * CommandPalette — triggered by Ctrl/Cmd+K.
 * Shows all commands grouped by category with live search.
 *
 * Props:
 *   isOpen        boolean
 *   onClose       () => void
 *   onSelect      (commandName: string) => void
 */
export default function CommandPalette({ isOpen, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  // Filter commands
  const filteredCommands = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return COMMAND_REGISTRY;
    return COMMAND_REGISTRY.filter(
      cmd =>
        cmd.name.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        (cmd.aliases && cmd.aliases.some(a => a.toLowerCase().includes(q)))
    );
  }, [query]);

  // Group filtered commands by category
  const grouped = React.useMemo(() => {
    const map = {};
    for (const cmd of filteredCommands) {
      if (!map[cmd.category]) map[cmd.category] = [];
      map[cmd.category].push(cmd);
    }
    return map;
  }, [filteredCommands]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filteredCommands[activeIndex];
        if (cmd) { onSelect(cmd.name); onClose(); }
      }
    },
    [filteredCommands, activeIndex, onSelect, onClose]
  );

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector("[data-active='true']");
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Close on overlay click
  const handleOverlayClick = useCallback(
    (e) => { if (e.target === e.currentTarget) onClose(); },
    [onClose]
  );

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div className="palette-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Command Palette">
      <div className="palette-panel dropdown-enter">
        {/* Search */}
        <div className="palette-search-row">
          <div className="palette-search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="palette-search-icon" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search commands…"
              className="palette-input"
              spellCheck={false}
              autoComplete="off"
              aria-label="Search commands"
            />
            <kbd className="palette-esc-hint">esc</kbd>
          </div>
        </div>

        {/* Command list */}
        <div className="palette-list" ref={listRef} role="listbox">
          {filteredCommands.length === 0 && (
            <div className="palette-empty">No commands match "{query}"</div>
          )}
          {Object.entries(grouped).map(([category, cmds]) => (
            <div key={category} className="palette-group">
              <div className="palette-category-label">{category}</div>
              {cmds.map(cmd => {
                const idx = flatIndex++;
                const isActive = idx === activeIndex;
                const argHints = cmd.arguments
                  .map(a => (a.required ? `<${a.name}>` : `[${a.name}]`))
                  .join(" ");
                return (
                  <div
                    key={cmd.name}
                    className={`palette-row ${isActive ? "palette-row--active" : ""}`}
                    role="option"
                    aria-selected={isActive}
                    data-active={isActive ? "true" : "false"}
                    onClick={() => { onSelect(cmd.name); onClose(); }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span className="palette-row-name">{cmd.name}</span>
                    {argHints && <span className="palette-row-args">{argHints}</span>}
                    <span className="palette-row-desc">{cmd.description}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="palette-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}