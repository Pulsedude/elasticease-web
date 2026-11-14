import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  SearchIcon,
  TerminalIcon,
  BookOpenIcon,
  CopyIcon,
  CheckIcon,
  ActivityIcon,
  DatabaseIcon,
  ServerIcon,
  LayersIcon,
  SparklesIcon,
} from "./Icons";
import BackButton from "./BackButton";
import { COMMAND_REGISTRY, getCategories } from "../console/commandRegistry.js";

// Helper to get an appropriate example value for an argument
function getArgExampleValue(arg) {
  if (
    arg.type === "boolean" ||
    (arg.options && arg.options.includes("false") && arg.options.includes("true"))
  ) {
    return "false";
  }
  if (arg.options && arg.options.length > 0) {
    return arg.options[0];
  }
  if (arg.type === "index" || arg.name === "index") {
    return "my_index";
  }
  if (arg.name === "index_name") {
    return "new_index";
  }
  if (arg.type === "file" || arg.name === "file") {
    return "documents.json";
  }
  if (arg.name === "id") {
    return "doc_101";
  }
  if (arg.type === "node" || arg.name === "node") {
    return "node-1";
  }
  if (arg.type === "number" || arg.name === "size") {
    return "100";
  }
  if (arg.name === "metric") {
    return "jvm";
  }
  return arg.name;
}

// Helper to generate canonical syntax string
function getCommandSyntax(cmd) {
  const reqArgs = (cmd.arguments || [])
    .filter((a) => a.required)
    .map((a) => `<${a.name}>`);

  const optArgs = (cmd.arguments || [])
    .filter((a) => !a.required)
    .map((a) => {
      if (a.options && a.options.length > 0 && a.options.length <= 3) {
        return `[${a.name}=${a.options.join("|")}]`;
      }
      return `[${a.name}]`;
    });

  return [cmd.name, ...reqArgs, ...optArgs].join(" ");
}

// Helper to generate an executable example command
function getCommandExample(cmd) {
  const parts = [cmd.name];
  for (const arg of (cmd.arguments || [])) {
    parts.push(getArgExampleValue(arg));
  }
  return parts.join(" ");
}

// Category badges style mapping
const CATEGORY_STYLES = {
  Cluster: {
    badge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    icon: ActivityIcon,
    color: "#6366f1",
  },
  Index: {
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: LayersIcon,
    color: "#3b82f6",
  },
  Document: {
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: DatabaseIcon,
    color: "#10b981",
  },
  Bulk: {
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: SparklesIcon,
    color: "#f59e0b",
  },
  Node: {
    badge: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon: ServerIcon,
    color: "#a855f7",
  },
  Shards: {
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    icon: LayersIcon,
    color: "#f43f5e",
  },
};

export default function CommandsGuidePage({ theme }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedCmd, setCopiedCmd] = useState(null);

  const categories = useMemo(() => ["All", ...getCategories()], []);

  // Filter commands by search and category
  const filteredCommands = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return COMMAND_REGISTRY.filter((cmd) => {
      // Category filter
      if (selectedCategory !== "All" && cmd.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (!q) return true;

      const nameMatch = cmd.name.toLowerCase().includes(q);
      const aliasMatch = (cmd.aliases || []).some((a) => a.toLowerCase().includes(q));
      const descMatch = (cmd.description || "").toLowerCase().includes(q);
      const catMatch = (cmd.category || "").toLowerCase().includes(q);
      const argMatch = (cmd.arguments || []).some(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.description || "").toLowerCase().includes(q) ||
          (a.options || []).some((opt) => opt.toLowerCase().includes(q))
      );

      return nameMatch || aliasMatch || descMatch || catMatch || argMatch;
    });
  }, [searchQuery, selectedCategory]);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleRunInConsole = (cmdStr) => {
    navigate("/console", { state: { cmd: cmdStr } });
  };

  return (
    <div className="page-stack max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="page-heading mb-6">
        <div className="page-heading-nav mb-3 flex items-center justify-between">
          <BackButton />
          <button
            type="button"
            onClick={() => navigate("/console")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isDark
                ? "bg-indigo-500/10 border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/20"
                : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            Open Interactive Console
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))",
                  border: "1px solid rgba(99,102,241,0.3)",
                }}
              >
                <BookOpenIcon className="w-4 h-4 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-primary m-0">
                Commands Guide &amp; CLI Reference
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
                {COMMAND_REGISTRY.length} commands
              </span>
            </div>
            <p className="text-sm mt-1 text-secondary">
              Complete command documentation, syntax breakdowns, parameter references, and working examples for Elasticease CLI.
            </p>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────────── */}
      <div className="bg-surface border border-base rounded-xl p-4 sm:p-5 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by command name, alias, flag, parameter, or description..."
              className={`w-full h-10 pl-10 pr-10 text-sm rounded-lg border outline-none transition-colors ${
                isDark
                  ? "bg-[#0d0f17] border-[#1e2130] text-slate-100 placeholder-slate-500 focus:border-indigo-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-primary px-1.5 py-0.5 rounded cursor-pointer"
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs text-secondary self-end md:self-center">
            <span>Showing <strong className="text-primary">{filteredCommands.length}</strong> of {COMMAND_REGISTRY.length} commands</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap mt-4 pt-3 border-t border-base">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted mr-1">
            Category:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === "All"
                ? COMMAND_REGISTRY.length
                : COMMAND_REGISTRY.filter((c) => c.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? isDark
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                      : "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : isDark
                    ? "bg-[#111116] border-[#1e2130] text-slate-400 hover:bg-[#1a1c26] hover:text-slate-200"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : isDark
                    ? "bg-[#1e2130] text-slate-400"
                    : "bg-slate-200 text-slate-600"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Empty State ────────────────────────────────────────── */}
      {filteredCommands.length === 0 && (
        <div className="bg-surface border border-base rounded-xl p-12 text-center my-6">
          <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center bg-indigo-500/10 text-indigo-400 mb-3">
            <SearchIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-primary">No commands found</h3>
          <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
            No command matched your query "{searchQuery}". Try searching by another keyword or reset the category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* ── Command Cards Grid ─────────────────────────────────── */}
      <div className="commands-guide-grid flex flex-col gap-7 sm:gap-8">
        {filteredCommands.map((cmd) => {
          const catStyle = CATEGORY_STYLES[cmd.category] || CATEGORY_STYLES.Cluster;
          const CategoryIcon = catStyle.icon;
          const syntax = getCommandSyntax(cmd);
          const example = getCommandExample(cmd);

          const requiredArgs = (cmd.arguments || []).filter((a) => a.required);
          const optionalArgs = (cmd.arguments || []).filter((a) => !a.required);
          const totalArgs = (cmd.arguments || []).length;

          return (
            <div
              key={cmd.name}
              id={`cmd-${cmd.name}`}
              className="bg-surface border border-base rounded-2xl overflow-hidden shadow-sm hover:border-indigo-500/40 transition-colors"
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 border-b border-base bg-surface">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-base font-bold text-primary px-2.5 py-1 rounded-md bg-raised border border-base">
                      {cmd.name}
                    </span>

                    {/* Category pill */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catStyle.badge}`}
                    >
                      <CategoryIcon className="w-3 h-3" />
                      {cmd.category}
                    </span>

                    {/* Aliases badge */}
                    {cmd.aliases && cmd.aliases.length > 0 && (
                      <span className="text-xs text-muted flex items-center gap-1">
                        <span>alias:</span>
                        {cmd.aliases.map((al) => (
                          <code key={al} className="font-mono text-[11px] bg-raised px-1.5 py-0.5 rounded border border-base text-secondary">
                            {al}
                          </code>
                        ))}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleCopy(cmd.name, `name-${cmd.name}`)}
                      title="Copy command name"
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        copiedCmd === `name-${cmd.name}`
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          : isDark
                          ? "bg-[#111116] border-[#1e2130] text-slate-300 hover:bg-[#1a1c26]"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {copiedCmd === `name-${cmd.name}` ? (
                        <>
                          <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunInConsole(example)}
                      title="Run this command in Console"
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-transparent bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <TerminalIcon className="w-3.5 h-3.5" />
                      <span>Try in Console</span>
                    </button>
                  </div>
                </div>

                {/* Working Description */}
                <div className="mt-2.5">
                  <p className="text-sm text-secondary leading-relaxed">
                    {cmd.description}
                  </p>
                </div>
              </div>

              {/* Usage Syntax Box */}
              <div className="px-4 sm:px-5 py-3.5 bg-raised border-b border-base">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Usage Syntax
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopy(syntax, `syntax-${cmd.name}`)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border-0 outline-none transition-all cursor-pointer flex items-center gap-1.5 ${
                        copiedCmd === `syntax-${cmd.name}`
                          ? isDark
                            ? "bg-emerald-500/15 text-emerald-400 font-semibold"
                            : "bg-emerald-50 text-emerald-700 font-semibold"
                          : isDark
                          ? "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200"
                          : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800"
                      }`}
                    >
                      {copiedCmd === `syntax-${cmd.name}` ? (
                        <>
                          <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Syntax Copied</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Copy Syntax</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(example, `example-${cmd.name}`)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border-0 outline-none transition-all cursor-pointer flex items-center gap-1.5 ${
                        copiedCmd === `example-${cmd.name}`
                          ? isDark
                            ? "bg-emerald-500/15 text-emerald-400 font-semibold"
                            : "bg-emerald-50 text-emerald-700 font-semibold"
                          : isDark
                          ? "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200"
                          : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800"
                      }`}
                    >
                      {copiedCmd === `example-${cmd.name}` ? (
                        <>
                          <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Example Copied</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Copy Example</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Code display */}
                <div className="relative group">
                  <pre className={`p-3 rounded-lg text-xs font-mono overflow-x-auto border ${
                    isDark ? "bg-[#090a0f] border-[#1e2130] text-indigo-300" : "bg-white border-slate-200 text-indigo-700"
                  }`}>
                    <code>{syntax}</code>
                  </pre>
                </div>
              </div>

              {/* Arguments Section */}
              <div className="p-4 sm:p-5">
                {totalArgs === 0 ? (
                  <div className="text-xs text-muted italic flex items-center gap-1.5">
                    <span>No arguments required. This command executes standalone.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Required Arguments */}
                    {requiredArgs.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
                            Required Arguments ({requiredArgs.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {requiredArgs.map((arg) => (
                            <div
                              key={arg.name}
                              className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-start justify-between gap-2.5 ${
                                isDark
                                  ? "bg-[#0d0f17]/60 border-rose-500/20"
                                  : "bg-rose-50/40 border-rose-200"
                              }`}
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-bold text-primary">
                                    &lt;{arg.name}&gt;
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase font-mono bg-rose-500/10 text-rose-400 border border-rose-500/25">
                                    {arg.type}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500 text-white">
                                    REQUIRED
                                  </span>
                                </div>
                                <p className="text-xs text-secondary">
                                  {arg.description}
                                </p>
                              </div>

                              {arg.options && arg.options.length > 0 && (
                                <div className="flex flex-col md:items-end gap-1 flex-shrink-0">
                                  <span className="text-[10px] uppercase font-bold text-muted">
                                    Allowed Values
                                  </span>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {arg.options.map((opt) => (
                                      <code
                                        key={opt}
                                        className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-raised border border-base text-primary font-semibold"
                                      >
                                        {opt}
                                      </code>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Optional Arguments */}
                    {optionalArgs.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                            Optional Arguments &amp; Flags ({optionalArgs.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {optionalArgs.map((arg) => (
                            <div
                              key={arg.name}
                              className="p-3 rounded-lg border border-base bg-raised flex flex-col md:flex-row md:items-start justify-between gap-2.5"
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-semibold text-primary">
                                    [{arg.name}]
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    {arg.type}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-500/10 text-muted border border-slate-500/20">
                                    OPTIONAL
                                  </span>
                                </div>
                                <p className="text-xs text-secondary">
                                  {arg.description}
                                </p>
                              </div>

                              {arg.options && arg.options.length > 0 && (
                                <div className="flex flex-col md:items-end gap-1 flex-shrink-0">
                                  <span className="text-[10px] uppercase font-bold text-muted">
                                    Options
                                  </span>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {arg.options.map((opt) => (
                                      <code
                                        key={opt}
                                        className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface border border-base text-secondary"
                                      >
                                        {opt}
                                      </code>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
