import React, { useState } from 'react';
import { TerminalIcon, PlayIcon, SparklesIcon } from './Icons';

export default function ConsoleTerminal() {
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

  return (
    <div className="terminal-panel rounded-[20px] overflow-hidden border border-[#1f2937] bg-[#0b0f1a] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
      {/* Window chrome */}
      <div className="terminal-chrome px-5 py-3.5 bg-[#111827] border-b border-[#1f2937] flex items-center justify-between flex-wrap gap-2">
        <div className="terminal-window-title flex items-center gap-3">
          <div className="terminal-dots flex gap-1.5">
            {['#f87171', '#fbbf24', '#34d399'].map((c, i) => (
              <span key={i} className="w-3 h-3 rounded-full inline-block" style={{ background: c }} />
            ))}
          </div>
          <span className="terminal-title text-xs text-gray-500 font-mono pl-3 border-l border-[#1f2937] flex items-center gap-1.5">
            <TerminalIcon className="w-3.5 h-3.5 text-indigo-400" />
            elasticease-console ~ bash
          </span>
        </div>
        <span className="terminal-status text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full flex items-center gap-1">
          <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Runner Active
        </span>
      </div>

      {/* Preset buttons */}
      <div className="terminal-presets px-4 py-2.5 bg-[rgba(17,24,39,0.6)] border-b border-[#1f2937] flex items-center gap-2 overflow-x-auto flex-nowrap">
        <span className="terminal-quick-label text-[11px] text-gray-500 font-mono flex-shrink-0 flex items-center gap-1">
          <SparklesIcon className="w-3.5 h-3.5 text-yellow-400" /> Quick:
        </span>
        {presets.map((p, i) => (
          <button key={i} onClick={() => { setInputVal(p); runCommand(p); }} type="button"
            className="terminal-preset-button px-2.5 py-1 rounded-lg bg-[#1f2937] text-gray-400 font-mono text-[11px] border border-[#1f2937] cursor-pointer whitespace-nowrap flex-shrink-0 transition-all hover:bg-indigo-600 hover:text-white"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Output */}
      <div className="terminal-output p-5 max-h-80 overflow-y-auto font-mono text-xs leading-[1.7] flex flex-col gap-5">
        {history.map((item, i) => (
          <div className="terminal-entry" key={i}>
            <div className="terminal-command mb-2 flex items-baseline gap-2 flex-wrap">
              <span className="terminal-prompt text-emerald-500">user@elasticease:~$</span>
              <span className="terminal-command-text text-gray-100 font-bold">{item.cmd}</span>
            </div>
            <pre className="terminal-pre px-4 py-3.5 rounded-xl bg-[rgba(17,24,39,0.7)] border border-[#1f2937] text-gray-300 overflow-x-auto whitespace-pre-wrap break-words m-0 leading-[1.7]">
              {item.out}
            </pre>
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="terminal-input-row px-4 py-3 bg-[#111827] border-t border-[#1f2937] flex items-center gap-2.5">
        <span className="terminal-input-prompt text-emerald-500 font-mono text-[13px]">$</span>
        <input
          type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') runCommand(); }}
          placeholder="Type an Elasticsearch API command..."
          className="terminal-input flex-1 bg-transparent border-none text-gray-100 font-mono text-xs outline-none caret-indigo-400 min-w-0"
        />
        <button
          onClick={() => runCommand()} type="button"
          className="terminal-run-button px-3.5 py-1.5 rounded-[9px] bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[11px] font-bold border-none cursor-pointer flex items-center gap-1 flex-shrink-0 transition-colors"
        >
          <PlayIcon className="w-3 h-3" /> Run
        </button>
      </div>
    </div>
  );
}
