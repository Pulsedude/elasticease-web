import React from 'react';
import { ActivityIcon, ServerIcon, ShieldIcon, CheckIcon } from './Icons';

export default function ClusterHealthPage({ theme }) {
  const isDark = theme === 'dark';
  const textPri  = isDark ? '#f1f5f9' : '#0f172a';
  const textSec  = isDark ? '#94a3b8' : '#475569';
  const textMuted= isDark ? '#64748b' : '#94a3b8';
  const cardBg   = isDark ? '#0f1629' : '#fff';
  const cardBdr  = isDark ? '#1e293b' : '#e2e8f0';
  const shadow   = isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)';
  const rowHover = isDark ? 'rgba(30,41,59,0.5)' : '#f8fafc';

  const nodes = [
    { name: 'node-primary-01', ip: '10.0.0.12', role: 'Master / Data', cpu: '4%', ram: '78%' },
    { name: 'node-data-02',    ip: '10.0.0.13', role: 'Data Node',     cpu: '2%', ram: '74%' },
    { name: 'node-data-03',    ip: '10.0.0.14', role: 'Data Node',     cpu: '5%', ram: '81%' },
  ];

  const metaCards = [
    { label: 'Cluster Status', value: 'Green (Healthy)', valueColor: '#10b981', hasDot: true },
    { label: 'Total Shards',   value: '284 Active', valueColor: textPri, hasDot: false },
    { label: 'Unassigned',     value: '0 Shards',   valueColor: textPri, hasDot: false },
  ];

  return (
    <div>
      {/* Page header */}
      <div style={{ borderBottom: `1px solid ${cardBdr}`, paddingBottom: 20, marginBottom: 28 }}>
        <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, color: textPri, letterSpacing: '-0.5px', marginBottom: 6 }}>
          Cluster Health &amp; Diagnostics
        </h1>
        <p style={{ fontSize: 14, color: textSec }}>
          Real-time metrics, node allocations, and index health across your Elasticsearch cluster.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {metaCards.map((c, i) => (
          <div key={i} style={{ background: cardBg, border: `1px solid ${cardBdr}`, borderRadius: 18, padding: '20px', boxShadow: shadow }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{c.label}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: c.valueColor, display: 'flex', alignItems: 'center', gap: 8 }}>
              {c.hasDot && <span className="animate-pulse" style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block', flexShrink: 0 }} />}
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Nodes Table */}
      <div style={{ background: cardBg, border: `1px solid ${cardBdr}`, borderRadius: 20, overflow: 'hidden', boxShadow: shadow }}>
        {/* Table header row */}
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${cardBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: textPri, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ServerIcon className="w-5 h-5" style={{ color: '#6366f1' }} /> Connected Nodes
          </h2>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
            3 Active
          </span>
        </div>

        {/* Scrollable table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ background: isDark ? 'rgba(15,22,41,0.9)' : '#f8fafc', borderBottom: `1px solid ${cardBdr}` }}>
                {['Node Name', 'IP Address', 'Role', 'CPU', 'RAM', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.map((n, i) => (
                <tr key={i}
                  style={{ borderBottom: i < nodes.length - 1 ? `1px solid ${cardBdr}` : 'none', transition: 'background 0.15s', cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.background = rowHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: textPri, fontSize: 13 }}>{n.name}</td>
                  <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: textSec, fontSize: 12 }}>{n.ip}</td>
                  <td style={{ padding: '14px 18px', color: textSec, fontSize: 13 }}>{n.role}</td>
                  <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: textSec, fontSize: 12 }}>{n.cpu}</td>
                  <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: textSec, fontSize: 12 }}>{n.ram}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#10b981' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                      Online
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
