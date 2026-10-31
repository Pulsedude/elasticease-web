import React from "react";

/**
 * QuickCommands — the top toolbar with one-click command inserts.
 * Clicking inserts the command into the input WITHOUT executing it,
 * keeping the entire experience consistent.
 *
 * Props:
 *   onInsert  (commandName: string) => void
 */

const QUICK_COMMANDS = [
  { label: "cluster:health", command: "cluster:health" },
  { label: "index:list",     command: "index:list"     },
  { label: "index:get",      command: "index:get "     },
  { label: "index:count",    command: "index:count "   },
  { label: "index:data",     command: "index:data "    },
  { label: "document:get",   command: "document:get "  },
  { label: "document:insert",command: "document:insert "},
  { label: "bulk:insert",    command: "bulk:insert "   },
  { label: "bulk:update",    command: "bulk:update "   },
  { label: "bulk:delete",    command: "bulk:delete "   },
  { label: "node:stats",     command: "node:stats"     },
  { label: "node:jvm",       command: "node:jvm"       },
  { label: "node:os",        command: "node:os"        },
  { label: "node:settings",  command: "node:settings"  },
  { label: "allocation:list",command: "allocation:list"},
  { label: "shards:list",    command: "shards:list"    },
];

export default function QuickCommands({ onInsert }) {
  return (
    <div className="quick-commands" role="toolbar" aria-label="Quick commands">
      <span className="quick-commands-label" aria-hidden="true">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
        Quick
      </span>
      {QUICK_COMMANDS.map(qc => (
        <button
          key={qc.command}
          className="quick-cmd-btn"
          onClick={() => onInsert(qc.command)}
          type="button"
          title={`Insert: ${qc.command}`}
          aria-label={`Insert command ${qc.command}`}
        >
          {qc.label}
        </button>
      ))}
    </div>
  );
}