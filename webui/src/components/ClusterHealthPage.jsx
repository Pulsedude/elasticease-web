import React from 'react';
import { ServerIcon } from './Icons';

export default function ClusterHealthPage({ theme }) {
  const isDark = theme === 'dark';

  const nodes = [
    { name: 'node-primary-01', ip: '10.0.0.12', role: 'Master / Data', cpu: '4%', ram: '78%' },
    { name: 'node-data-02',    ip: '10.0.0.13', role: 'Data Node',     cpu: '2%', ram: '74%' },
    { name: 'node-data-03',    ip: '10.0.0.14', role: 'Data Node',     cpu: '5%', ram: '81%' },
  ];

  const metaCards = [
    { label: 'Cluster Status', value: 'Green (Healthy)', valueColor: 'text-emerald-500', hasDot: true },
    { label: 'Total Shards',   value: '284 Active', valueColor: isDark ? 'text-slate-100' : 'text-slate-900', hasDot: false },
    { label: 'Unassigned',     value: '0 Shards',   valueColor: isDark ? 'text-slate-100' : 'text-slate-900', hasDot: false },
  ];

  return (
    <div className="page-stack">
      <div className={`section-heading border-b pb-5 mb-7 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight mb-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          Cluster Health &amp; Diagnostics
        </h1>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Real-time metrics, node allocations, and index health across your Elasticsearch cluster.
        </p>
      </div>

      <div className="stat-grid stat-grid-3 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        {metaCards.map((c, i) => (
          <div key={i} className={`metric-card rounded-[18px] p-5 border ${
            isDark ? 'bg-[#0d0d0d] border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.3)]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <p className={`text-[11px] font-bold uppercase tracking-[0.07em] mb-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{c.label}</p>
            <p className={`text-xl font-extrabold flex items-center gap-2 ${c.valueColor}`}>
              {c.hasDot && <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block flex-shrink-0" />}
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className={`table-panel rounded-[20px] overflow-hidden border ${
        isDark ? 'bg-[#0d0d0d] border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.3)]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`table-panel-header px-5 py-4 border-b flex items-center justify-between flex-wrap gap-2 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <h2 className={`table-panel-title text-base font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <ServerIcon className="w-5 h-5 text-indigo-500" /> Connected Nodes
          </h2>
          <span className="table-panel-badge text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">3 Active</span>
        </div>

        <div className="table-scroll overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 560 }}>
            <thead>
              <tr className={`border-b ${
                isDark ? 'bg-[rgba(15,22,41,0.9)] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {['Node Name', 'IP Address', 'Role', 'CPU', 'RAM', 'Status'].map(h => (
                  <th key={h} className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] whitespace-nowrap ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.map((n, i) => (
                <tr key={i}
                  className={`transition-colors cursor-default ${
                    i < nodes.length - 1 ? isDark ? 'border-b border-slate-800' : 'border-b border-slate-200' : ''
                  } ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                >
                  <td className={`px-4 py-3.5 font-mono font-bold text-[13px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{n.name}</td>
                  <td className={`px-4 py-3.5 font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{n.ip}</td>
                  <td className={`px-4 py-3.5 text-[13px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{n.role}</td>
                  <td className={`px-4 py-3.5 font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{n.cpu}</td>
                  <td className={`px-4 py-3.5 font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{n.ram}</td>
                  <td className="px-4 py-3.5">
                    <span className="node-status inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Online
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
