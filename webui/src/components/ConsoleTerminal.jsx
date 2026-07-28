import React, { useState } from 'react';
import { TerminalIcon, PlayIcon, SparklesIcon } from './Icons';

export default function ConsoleTerminal({ theme }) {
  const isDark = theme === 'dark';

  const [inputVal, setInputVal] = useState('GET /_cluster/health');
  const [history, setHistory] = useState([
    {
      cmd: 'elasticease-cli --version',
      out: 'Élasticease Console App v1.2.0\nEngine: Elasticsearch 8.x / OpenSearch Compatible\nBackend: Active'
    },
    {
      cmd: 'GET /_cluster/health',
      out: JSON.stringify({
        cluster_name: "elasticease-production",
        status: "green",
        number_of_nodes: 3,
        number_of_data_nodes: 3,
        active_primary_shards: 142,
        active_shards: 284,
        unassigned_shards: 0,
        active_shards_percent_as_number: 100.0
      }, null, 2)
    }
  ]);

  const presets = [
    'GET /_cluster/health',
    'GET /_cat/indices?v=true',
    'GET /_cat/nodes?v=true',
    'GET /_cluster/stats',
  ];

  const runCommand = (cmd) => {
    const target = cmd || inputVal;
    let out = '';
    if (target.includes('_cat/indices')) {
      out = `health  status  index             pri  rep  docs.count  store.size\ngreen   open    app-logs-2026       3    1   1,420,891      842mb\ngreen   open    user-analytics      2    1     850,210      310mb\ngreen   open    product-catalog     5    1   4,102,005     1.24gb`;
    } else if (target.includes('_cat/nodes')) {
      out = `ip         heap.%  ram.%  cpu  node.role  master  name\n10.0.0.12     42     78    4  cdfhilmrstw  *  node-primary-01\n10.0.0.13     38     74    2  cdfhilmrstw  -  node-data-02\n10.0.0.14     45     81    5  cdfhilmrstw  -  node-data-03`;
    } else if (target.includes('_cluster/stats')) {
      out = JSON.stringify({ nodes: { count: { total: 3 } }, indices: { count: 24, docs: { count: 6373106 }, store: { size_in_bytes: 2316255744 } } }, null, 2);
    } else {
      out = JSON.stringify({ cluster_name: "elasticease-production", status: "green", number_of_nodes: 3, active_primary_shards: 142, active_shards: 284, unassigned_shards: 0, active_shards_percent_as_number: 100.0 }, null, 2);
    }
    setHistory(prev => [...prev, { cmd: target, out }]);
    if (!cmd) setInputVal('');
  };

  const bg      = '#0b0f1a';
  const bgHeader = '#111827';
  const border   = '#1f2937';
  const textGray = '#6b7280';
  const textGreen = '#10b981';
  const textIndigo = '#818cf8';
  const textWhite = '#f3f4f6';

  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${border}`, background: bg, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
      {/* Window chrome */}
      <div style={{ padding: '14px 20px', background: bgHeader, borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#f87171', '#fbbf24', '#34d399'].map((c, i) => <span key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c, display: 'inline-block' }} />)}
          </div>
          <span style={{ fontSize: 12, color: textGray, fontFamily: 'monospace', paddingLeft: 12, borderLeft: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TerminalIcon className="w-3.5 h-3.5" style={{ color: textIndigo }} />
            elasticease-console ~ bash
          </span>
        </div>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: textGreen, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', padding: '3px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: textGreen, display: 'inline-block' }} />
          Runner Active
        </span>
      </div>

      {/* Preset quick buttons */}
      <div style={{ padding: '10px 16px', background: 'rgba(17,24,39,0.6)', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', flexWrap: 'nowrap' }}>
        <span style={{ fontSize: 11, color: textGray, fontFamily: 'monospace', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <SparklesIcon className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} /> Quick:
        </span>
        {presets.map((p, i) => (
          <button key={i} onClick={() => { setInputVal(p); runCommand(p); }} type="button"
            style={{
              padding: '5px 10px', borderRadius: 8, background: '#1f2937',
              color: '#9ca3af', fontFamily: 'monospace', fontSize: 11,
              border: `1px solid ${border}`, cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'background 0.15s, color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#1f2937'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Output area */}
      <div style={{ padding: '20px', maxHeight: 320, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {history.map((item, i) => (
          <div key={i}>
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: textGreen }}>user@elasticease:~$</span>
              <span style={{ color: textWhite, fontWeight: 700 }}>{item.cmd}</span>
            </div>
            <pre style={{
              padding: '14px 16px', borderRadius: 12,
              background: 'rgba(17,24,39,0.7)', border: `1px solid ${border}`,
              color: '#d1d5db', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              margin: 0, lineHeight: 1.7,
            }}>
              {item.out}
            </pre>
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div style={{ padding: '12px 16px', background: bgHeader, borderTop: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: textGreen, fontFamily: 'monospace', fontSize: 13 }}>$</span>
        <input
          type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') runCommand(); }}
          placeholder="Type an Elasticsearch API command..."
          style={{
            flex: 1, background: 'transparent', border: 'none',
            color: textWhite, fontFamily: 'monospace', fontSize: 12,
            outline: 'none', caretColor: textIndigo, minWidth: 0,
          }}
        />
        <button
          onClick={() => runCommand()} type="button"
          style={{
            padding: '7px 14px', borderRadius: 9,
            background: '#6366f1', color: '#fff',
            fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            flexShrink: 0, transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#4f46e5'}
          onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
        >
          <PlayIcon className="w-3 h-3" /> Run
        </button>
      </div>
    </div>
  );
}
