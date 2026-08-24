import React from "react";
import { ServerIcon, ActivityIcon, ShieldIcon, DatabaseIcon } from "./Icons";

export default function ClusterHealthPage({ theme }) {
  const isDark = theme === "dark";

  const nodes = [
    { name: "node-primary-01", ip: "10.0.0.12", role: "Master / Data", cpu: "42%", ram: "78%", heap: "38%", docs: "3.1M",  status: "online" },
    { name: "node-data-02",    ip: "10.0.0.13", role: "Data Node",     cpu: "38%", ram: "74%", heap: "35%", docs: "1.8M",  status: "online" },
    { name: "node-data-03",   ip: "10.0.0.14", role: "Data Node",     cpu: "45%", ram: "81%", heap: "41%", docs: "1.4M",  status: "online" },
  ];

  const indices = [
    { name: "app-logs-2026",    health: "green",  docs: "1,420,891", size: "842 MB", shards: "3/1" },
    { name: "user-analytics",  health: "green",  docs: "850,210",   size: "310 MB", shards: "2/1" },
    { name: "product-catalog", health: "green",  docs: "4,102,005", size: "1.24 GB", shards: "5/1" },
  ];

  const healthDot = isDark ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-emerald-500";

  const metaCards = [
    { label: "Cluster Status", value: "Green", sub: "All nodes healthy", icon: ShieldIcon, valueColor: "text-emerald-600 dark:text-emerald-400", dot: true },
    { label: "Active Shards",  value: "284",   sub: "0 unassigned",      icon: ActivityIcon, valueColor: isDark ? "text-slate-100" : "text-slate-900" },
    { label: "Total Docs",     value: "6.3M",  sub: "Across 3 indices",  icon: DatabaseIcon, valueColor: isDark ? "text-slate-100" : "text-slate-900" },
  ];

  return (
    <div className="page-stack">
      <div className="page-heading">
        <h1>Cluster Health &amp; Diagnostics</h1>
        <p>Real-time metrics, node allocations, and index health across your Elasticsearch cluster.</p>
      </div>

      {/* Metric cards */}
      <div className="stat-grid stat-grid-3 mb-8">
        {metaCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`metric-card flex flex-col gap-3 ${
              isDark ? "bg-[#0c0c10] border-[#1e2130]" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="flex items-start justify-between">
                <span className={`t-meta ${isDark ? "text-slate-500" : "text-slate-400"}`}>{c.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isDark ? "bg-[#111116]" : "bg-slate-100"
                }`}>
                  <Icon className={`w-4 h-4 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                </div>
              </div>
              <div>
                <p className={`flex items-center gap-2 text-2xl font-semibold tracking-tight mb-0.5 ${c.valueColor}`}>
                  {c.dot && <span className={`w-2 h-2 rounded-full ${healthDot} flex-shrink-0`} />}
                  {c.value}
                </p>
                <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{c.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nodes table */}
      <div className={`table-panel mb-6 ${isDark ? "bg-[#0c0c10] border-[#1e2130]" : "bg-white border-slate-200 shadow-sm"}`}>
        <div className="table-panel-header">
          <h2 className={`table-panel-title ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            <ServerIcon className="w-4 h-4 text-indigo-400" /> Connected Nodes
          </h2>
          <span className="table-panel-badge">3 Active</span>
        </div>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">List of connected Elasticsearch cluster nodes and their resource metrics</caption>
            <thead>
              <tr>
                {["Node Name", "IP Address", "Role", "CPU", "RAM", "Heap", "Docs", "Status"].map(h => (
                  <th key={h} scope="col">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.map((n, i) => (
                <tr key={i}>
                  <td className={`font-mono font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{n.name}</td>
                  <td className={`font-mono text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{n.ip}</td>
                  <td className={isDark ? "text-slate-400" : "text-slate-500"}>{n.role}</td>
                  <td className="font-mono text-xs">
                    <span className={parseInt(n.cpu) > 70 ? "text-amber-500 font-semibold" : isDark ? "text-slate-300" : "text-slate-700"}>{n.cpu}</span>
                  </td>
                  <td className={`font-mono text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{n.ram}</td>
                  <td className={`font-mono text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{n.heap}</td>
                  <td className={`font-mono text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{n.docs}</td>
                  <td>
                    <span className="node-status">
                      <span className={`w-1.5 h-1.5 rounded-full ${healthDot}`} />
                      Online
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Indices table */}
      <div className={`table-panel ${isDark ? "bg-[#0c0c10] border-[#1e2130]" : "bg-white border-slate-200 shadow-sm"}`}>
        <div className="table-panel-header">
          <h2 className={`table-panel-title ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            <DatabaseIcon className="w-4 h-4 text-indigo-400" /> Index Overview
          </h2>
          <span className="table-panel-badge">{indices.length} Indices</span>
        </div>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">List of Elasticsearch cluster indices and shard details</caption>
            <thead>
              <tr>
                {["Index Name", "Health", "Documents", "Store Size", "Shards (P/R)"].map(h => (
                  <th key={h} scope="col">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {indices.map((idx, i) => (
                <tr key={i}>
                  <td className={`font-mono font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>{idx.name}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                      <span className={`w-1.5 h-1.5 rounded-full ${healthDot}`} />
                      {idx.health}
                    </span>
                  </td>
                  <td className={`font-mono text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{idx.docs}</td>
                  <td className={`font-mono text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{idx.size}</td>
                  <td className={`font-mono text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{idx.shards}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
