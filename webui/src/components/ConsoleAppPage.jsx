import React from 'react';
import { TerminalIcon, CheckIcon, LayersIcon, CpuIcon } from './Icons';
import ConsoleTerminal from './ConsoleTerminal';

export default function ConsoleAppPage({ theme }) {
  const isDark = theme === 'dark';
  const textPri = isDark ? '#f1f5f9' : '#0f172a';
  const textSec = isDark ? '#94a3b8' : '#475569';
  const cardBg  = isDark ? '#0f1629' : '#fff';
  const cardBdr = isDark ? '#1e293b' : '#e2e8f0';
  const shadow  = isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)';

  const features = [
    { title: 'Syntax Highlighting',   icon: CheckIcon, desc: 'Formatted JSON outputs with auto-indent and clean color coding.' },
    { title: 'Fast Command Presets',  icon: CheckIcon, desc: 'One-click execution for cat indices, health stats, and searches.' },
    { title: 'Async Python Proxy',    icon: CheckIcon, desc: 'Requests pass through your Python backend for secure cluster auth.' },
  ];

  return (
    <div>
      {/* Page header */}
      <div style={{ borderBottom: `1px solid ${cardBdr}`, paddingBottom: 20, marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '5px 12px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
          <TerminalIcon className="w-3.5 h-3.5" /> Interactive CLI Environment
        </div>
        <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: textPri, letterSpacing: '-0.5px', marginBottom: 8 }}>
          Élasticease Console App
        </h1>
        <p style={{ fontSize: 14, color: textSec, lineHeight: 1.65 }}>
          Full command-line power in your browser. Execute REST commands, inspect mappings, and check node telemetry in real-time.
        </p>
      </div>

      {/* Terminal */}
      <ConsoleTerminal theme={theme} />

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 24 }}>
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} style={{ background: cardBg, border: `1px solid ${cardBdr}`, borderRadius: 18, padding: '20px', boxShadow: shadow }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: textPri, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon className="w-4 h-4" style={{ color: '#10b981' }} /> {f.title}
              </h3>
              <p style={{ fontSize: 12, color: textSec, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
