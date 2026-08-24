import React from "react";
import { TerminalIcon, CheckIcon } from "./Icons";
import ConsoleTerminal from "./ConsoleTerminal";

export default function ConsoleAppPage({ theme }) {
  const isDark = theme === "dark";

  const features = [
    { title: "Syntax Highlighting",   desc: "Formatted JSON outputs with auto-indent and color-coded keys, values, and types." },
    { title: "Fast Command Presets",  desc: "One-click execution for cat indices, health stats, node info, and searches." },
    { title: "Async Python Proxy",    desc: "Requests pass through your Python backend for secure cluster authentication." },
  ];

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-500 uppercase tracking-[0.08em] mb-3 px-2.5 py-1 rounded-md ${
          isDark ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-indigo-50 border border-indigo-200"
        }`}>
          <TerminalIcon className="w-3 h-3" /> Interactive CLI
        </div>
        <h1>Elasticease Console</h1>
        <p>Full command-line power in your browser. Execute REST commands, inspect mappings, and check node telemetry in real-time.</p>
      </div>

      <ConsoleTerminal theme={theme} />

      <div className="feature-grid feature-grid-3 mt-5">
        {features.map((f, i) => (
          <div key={i} className={`feature-card ${isDark ? "bg-[#0c0c10] border-[#1e2130]" : "bg-white border-slate-200 shadow-sm"}`}>
            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
              <CheckIcon className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h3 className={`text-[13px] font-semibold mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}>{f.title}</h3>
              <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
