import React from 'react';
import { TerminalIcon, CheckIcon } from './Icons';
import ConsoleTerminal from './ConsoleTerminal';

export default function ConsoleAppPage({ theme }) {
  const isDark = theme === 'dark';

  const features = [
    { title: 'Syntax Highlighting',   icon: CheckIcon, desc: 'Formatted JSON outputs with auto-indent and clean color coding.' },
    { title: 'Fast Command Presets',  icon: CheckIcon, desc: 'One-click execution for cat indices, health stats, and searches.' },
    { title: 'Async Python Proxy',    icon: CheckIcon, desc: 'Requests pass through your Python backend for secure cluster auth.' },
  ];

  return (
    <div className="page-stack">
      <div className={`section-heading border-b pb-5 mb-7 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-500 uppercase tracking-[0.08em] mb-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25">
          <TerminalIcon className="w-3.5 h-3.5" /> Interactive CLI Environment
        </div>
        <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          Élasticease Console App
        </h1>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Full command-line power in your browser. Execute REST commands, inspect mappings, and check node telemetry in real-time.
        </p>
      </div>

      <ConsoleTerminal theme={theme} />

      <div className="feature-grid feature-grid-3 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className={`feature-card rounded-[18px] p-5 border ${
              isDark
                ? 'bg-[#0d0d0d] border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className={`text-[13px] font-bold flex items-center gap-2 mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                <Icon className="w-4 h-4 text-emerald-500" /> {f.title}
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{f.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
