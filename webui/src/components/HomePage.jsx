import React from 'react';
import {
  SparklesIcon, TerminalIcon, DatabaseIcon, CpuIcon,
  ActivityIcon, ServerIcon, ChevronRightIcon, CheckIcon, LayersIcon, ShieldIcon
} from './Icons';
import ConsoleTerminal from './ConsoleTerminal';

export default function HomePage({ user, onNavigateToTab, theme }) {
  const isDark = theme === 'dark';
  const textPri   = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const textSec   = isDark ? '#94a3b8' : '#475569';
  const cardBg    = isDark ? '#0f1629' : '#fff';
  const cardBdr   = isDark ? '#1e293b' : '#e2e8f0';
  const cardShadow = isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)';

  const stats = [
    { label: 'Active Nodes',    value: '3 / 3 Online',     sub: '100% operational',      icon: ServerIcon,   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Managed Indices', value: '24 Indices',        sub: '6.3M total docs',       icon: DatabaseIcon, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Query Latency',   value: '1.2 ms avg',        sub: 'Sub-ms peak response',  icon: ActivityIcon, color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    { label: 'Cluster Health',  value: 'Green',             sub: '0 unassigned shards',   icon: ShieldIcon,   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  ];

  const features = [
    { title: 'Interactive CLI Terminal',         desc: 'Execute native ES REST queries (GET/POST/PUT/DELETE) with formatted JSON responses and syntax highlighting.',              icon: TerminalIcon },
    { title: 'Real-Time Health Telemetry',       desc: 'Monitor node CPU, heap memory, GC events, and shard distribution across your entire Elasticsearch cluster.',             icon: ActivityIcon },
    { title: 'Automated Index Orchestration',    desc: 'Create, reindex, alias, and update mapping schemas with built-in validation before any destructive mutations.',          icon: LayersIcon   },
    { title: 'Python Backend Integration Ready', desc: 'Fully wired to your `run.py` backend service — async requests, API proxying, and secure cluster authentication.',        icon: CpuIcon      },
  ];

  return (
    <div>
      {/* ── HERO ── */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 24,
        background: isDark
          ? 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.06) 50%, rgba(10,14,30,0) 100%)'
          : 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(168,85,247,0.04) 50%, rgba(248,250,252,0) 100%)',
        border: `1px solid ${cardBdr}`,
        padding: 'clamp(28px, 5vw, 52px)',
        marginBottom: 28,
        boxShadow: cardShadow,
      }}>
        {/* Ambient blob */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 320, height: 320, background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 680 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '6px 14px', borderRadius: 999, marginBottom: 20,
            background: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff',
            border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : '#c7d2fe'}`,
            fontSize: 12, fontWeight: 700,
            color: isDark ? '#a5b4fc' : '#4f46e5',
          }}>
            <SparklesIcon className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
            Welcome back, {user?.name || 'Admin'}!
          </div>

          <h1 style={{ fontSize: 'clamp(24px, 4vw, 46px)', fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1.15, color: textPri, marginBottom: 16 }}>
            Simplify Elasticsearch<br />
            Management with{' '}
            <span className="gradient-text">Élasticease</span>
          </h1>

          <p style={{ fontSize: 'clamp(13px, 2vw, 16px)', color: textSec, lineHeight: 1.7, marginBottom: 28, maxWidth: 560 }}>
            A unified, high-performance web and console management platform built to monitor, query, and orchestrate your Elasticsearch nodes with maximum clarity.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button onClick={() => onNavigateToTab('console')} type="button"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '13px 24px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.35)'; }}
            >
              <TerminalIcon className="w-5 h-5" /> Launch Console <ChevronRightIcon className="w-4 h-4" />
            </button>

            <button onClick={() => onNavigateToTab('cluster')} type="button"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '13px 24px', borderRadius: 14,
                background: cardBg, border: `1px solid ${cardBdr}`,
                color: textPri, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              View Cluster Status
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} style={{
              background: cardBg, border: `1px solid ${cardBdr}`,
              borderRadius: 18, padding: '20px 22px',
              boxShadow: cardShadow, transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = isDark ? '0 12px 32px rgba(0,0,0,0.4)' : '0 12px 32px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = cardShadow; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</span>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
              </div>
              <p style={{ fontSize: 20, fontWeight: 800, color: textPri, marginBottom: 4, letterSpacing: '-0.3px' }}>{s.value}</p>
              <p style={{ fontSize: 11, color: textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckIcon className="w-3 h-3" style={{ color: '#10b981' }} /> {s.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── CONSOLE SECTION ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ borderBottom: `1px solid ${cardBdr}`, paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            <TerminalIcon className="w-4 h-4" /> Core Feature
          </div>
          <h2 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, color: textPri, letterSpacing: '-0.4px' }}>
            Élasticease Console App
          </h2>
          <p style={{ fontSize: 13, color: textSec, marginTop: 6, maxWidth: 520 }}>
            Full CLI power inside your browser — execute REST commands, inspect indices, and manage node operations in real-time.
          </p>
        </div>

        <ConsoleTerminal theme={theme} />

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 20 }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} style={{
                background: cardBg, border: `1px solid ${cardBdr}`,
                borderRadius: 18, padding: '20px',
                display: 'flex', alignItems: 'flex-start', gap: 14,
                boxShadow: cardShadow, transition: 'transform 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon className="w-5 h-5" style={{ color: '#818cf8' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: textPri, marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 12, color: textSec, lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BACKEND BANNER ── */}
      <div style={{
        background: isDark ? '#0f1629' : '#1e1b4b',
        border: `1px solid ${isDark ? '#1e293b' : '#312e81'}`,
        borderRadius: 20, padding: '24px 28px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <CpuIcon className="w-5 h-5" style={{ color: '#818cf8' }} /> Backend Connection Ready
          </h3>
          <p style={{ fontSize: 12, color: '#64748b' }}>Frontend is configured to sync with your Python backend (`run.py`).</p>
        </div>
        <button onClick={() => onNavigateToTab('settings')} type="button"
          style={{
            padding: '10px 20px', borderRadius: 12, border: 'none',
            background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            transition: 'background 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
          onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
        >
          Configure Endpoints
        </button>
      </div>
    </div>
  );
}
