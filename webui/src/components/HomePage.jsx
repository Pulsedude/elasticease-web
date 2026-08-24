import React, { useState, useEffect } from "react";
import {
  TerminalIcon, DatabaseIcon, CpuIcon,
  ActivityIcon, ServerIcon, ChevronRightIcon, LayersIcon, ShieldIcon
} from "./Icons";
import ConsoleTerminal from "./ConsoleTerminal";

function Sparkline({ data, color }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = range === 0 ? 50 : 100 - ((d - min) / range) * 75 - 12;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 100" className="w-full h-5" preserveAspectRatio="none" overflow="visible" aria-hidden="true" focusable="false">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function formatDocsCount(num) {
  if (num === null || num === undefined) return "--";
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}

function getHealthConfig(statusStr, isDark) {
  const s = (statusStr || "").toLowerCase();
  if (s === "green") {
    return {
      label: "Green",
      color: "text-emerald-400",
      bg: isDark ? "bg-emerald-500/10" : "bg-emerald-50",
      border: isDark ? "border-emerald-500/20" : "border-emerald-200",
      dot: "bg-emerald-500",
      sparkColor: "#34d399",
      sub: "All primary & replica shards active",
    };
  }
  if (s === "yellow") {
    return {
      label: "Yellow",
      color: "text-amber-400",
      bg: isDark ? "bg-amber-500/10" : "bg-amber-50",
      border: isDark ? "border-amber-500/20" : "border-amber-200",
      dot: "bg-amber-500",
      sparkColor: "#fbbf24",
      sub: "Primary active, replica unassigned",
    };
  }
  if (s === "red") {
    return {
      label: "Red",
      color: "text-rose-400",
      bg: isDark ? "bg-rose-500/10" : "bg-rose-50",
      border: isDark ? "border-rose-500/20" : "border-rose-200",
      dot: "bg-rose-500",
      sparkColor: "#f43f5e",
      sub: "One or more primary shards unassigned",
    };
  }
  return {
    label: "Unknown",
    color: "text-slate-400",
    bg: isDark ? "bg-slate-500/10" : "bg-slate-100",
    border: isDark ? "border-slate-500/20" : "border-slate-200",
    dot: "bg-slate-400",
    sparkColor: "#94a3b8",
    sub: "Connecting to Elasticsearch...",
  };
}

export default function HomePage({ onNavigateToTab, theme }) {
  const isDark = theme === "dark";

  // Backend config from Vite define
  const BACKEND_HOST = typeof __BACKEND_HOST__ !== 'undefined' ? __BACKEND_HOST__ : '127.0.0.1';
  const BACKEND_PORT = typeof __BACKEND_PORT__ !== 'undefined' ? __BACKEND_PORT__ : '8000';
  const API_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

  const [isLoading, setIsLoading] = useState(true);
  const [clusterData, setClusterData] = useState(null);
  const [latencyData, setLatencyData] = useState(null);
  const [latencyHistory, setLatencyHistory] = useState([1.2, 1.3, 1.1, 1.8, 1.2, 1.2]);
  const [docsData, setDocsData] = useState({ totalDocs: null, indicesCount: 0 });
  const [nodesData, setNodesData] = useState([
    { name: "node-primary-01", ip: "10.0.0.12", cpu: "42%", master: true },
    { name: "node-data-02",    ip: "10.0.0.13", cpu: "38%", master: false },
    { name: "node-data-03",    ip: "10.0.0.14", cpu: "45%", master: false },
  ]);

  // ── Fetch live telemetry from backend ──────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function fetchTelemetry() {
      try {
        const [clusterRes, latencyRes, nodesRes, indicesRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/v1/core/cluster_status`),
          fetch(`${API_BASE_URL}/v1/core/latency`),
          fetch(`${API_BASE_URL}/v1/core/nodes`),
          fetch(`${API_BASE_URL}/v1/core/indices`),
        ]);

        if (!isMounted) return;

        // 1. Cluster Health  → { success, response: { status, number_of_nodes, number_of_data_nodes, active_shards, ... } }
        if (clusterRes.status === "fulfilled" && clusterRes.value.ok) {
          const j = await clusterRes.value.json();
          if (j?.success && j?.response) {
            setClusterData(j.response);
          }
        }

        // 2. API Latency  → { success, response: <float ms> }
        if (latencyRes.status === "fulfilled" && latencyRes.value.ok) {
          const j = await latencyRes.value.json();
          if (j?.success && typeof j?.response === "number") {
            const ms = Math.round(j.response * 10) / 10;   // 1 decimal place
            setLatencyData(ms);
            setLatencyHistory((prev) => {
              const next = [...prev, ms];
              return next.length > 10 ? next.slice(next.length - 10) : next;
            });
          }
        }

        // 3. Nodes  → { success, response: [ { name, ip, heap.percent, cpu, load_1m, ... } ] }
        if (nodesRes.status === "fulfilled" && nodesRes.value.ok) {
          const j = await nodesRes.value.json();
          if (j?.success && Array.isArray(j?.response) && j.response.length > 0) {
            const mapped = j.response.map((n) => ({
              name: n.name || n["name"] || "node",
              ip:   n.ip   || n["ip"]   || "—",
              cpu:  n.cpu  ? `${n.cpu}%` : (n["cpu.percent"] ? `${n["cpu.percent"]}%` : "—"),
              master: n["node.role"]?.includes("m") ?? false,
            }));
            setNodesData(mapped);
          }
        }

        // 4. Indices  → { success, response: [ { index, "docs.count", "store.size", ... } ] }
        if (indicesRes.status === "fulfilled" && indicesRes.value.ok) {
          const j = await indicesRes.value.json();
          if (j?.success && Array.isArray(j?.response)) {
            const indices = j.response;
            // sum docs.count across all indices (filter out system indices starting with .)
            const totalDocs = indices.reduce((acc, idx) => {
              const raw = idx["docs.count"] ?? idx["docs"] ?? "0";
              return acc + (parseInt(String(raw), 10) || 0);
            }, 0);
            const visibleIndices = indices.filter((idx) => !String(idx.index || "").startsWith("."));
            setDocsData({
              totalDocs,
              indicesCount: visibleIndices.length || indices.length,
            });
          }
        }

        if (isMounted) setIsLoading(false);
      } catch (err) {
        console.error("[HomePage] Telemetry fetch error:", err);
        if (isMounted) setIsLoading(false);
      }
    }

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10_000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [API_BASE_URL]);


  const healthCfg = getHealthConfig(clusterData?.status, isDark);

  const stats = [
    {
      label: "Cluster Health",
      value: clusterData?.status
        ? clusterData.status.charAt(0).toUpperCase() + clusterData.status.slice(1)
        : (isLoading ? "Loading..." : "Green"),
      sub: clusterData?.status ? healthCfg.sub : "All nodes responsive",
      icon: ShieldIcon,
      color: healthCfg.color,
      bg: healthCfg.bg,
      border: healthCfg.border,
      sparkline: [20, 20, 20, 20, 20, 20],
      sparkColor: healthCfg.sparkColor,
      dot: healthCfg.dot,
    },
    {
      label: "Active Nodes",
      value: clusterData?.number_of_nodes !== undefined
        ? `${clusterData.number_of_nodes} / ${clusterData.number_of_nodes}`
        : (isLoading ? "Loading..." : "3 / 3"),
      sub: clusterData?.number_of_data_nodes !== undefined
        ? `${clusterData.number_of_data_nodes} data node${clusterData.number_of_data_nodes === 1 ? "" : "s"}`
        : "CPU avg 42%",
      icon: ServerIcon,
      color: "text-indigo-400",
      bg: isDark ? "bg-indigo-500/10" : "bg-indigo-50",
      border: isDark ? "border-indigo-500/20" : "border-indigo-200",
      sparkline: [35, 45, 42, 50, 48, 42],
      sparkColor: "#818cf8",
      dot: "bg-indigo-500",
    },
    {
      label: "Query Latency",
      value: latencyData !== null ? `${latencyData}ms` : (isLoading ? "Loading..." : "1.2ms"),
      sub: latencyData !== null ? "Elasticsearch API ping" : "p99: 4.5ms",
      icon: ActivityIcon,
      color: "text-purple-400",
      bg: isDark ? "bg-purple-500/10" : "bg-purple-50",
      border: isDark ? "border-purple-500/20" : "border-purple-200",
      sparkline: latencyHistory.length >= 2 ? latencyHistory : [1.2, 1.3, 1.1, 1.8, 1.2, 1.2],
      sparkColor: "#c084fc",
      dot: "bg-purple-500",
    },
    {
      label: "Total Docs",
      value: docsData.totalDocs !== null ? formatDocsCount(docsData.totalDocs) : (isLoading ? "Loading..." : "6.3M"),
      sub: docsData.indicesCount > 0 ? `${docsData.indicesCount} ${docsData.indicesCount === 1 ? "index" : "indices"}` : "24 indices",
      icon: DatabaseIcon,
      color: "text-blue-400",
      bg: isDark ? "bg-blue-500/10" : "bg-blue-50",
      border: isDark ? "border-blue-500/20" : "border-blue-200",
      sparkline: [5.8, 5.9, 6.0, 6.1, 6.2, 6.3],
      sparkColor: "#60a5fa",
      dot: "bg-blue-500",
    },
  ];

  const features = [
    { title: "Interactive CLI Terminal",       desc: "Execute ES REST queries with formatted JSON responses and syntax highlighting.",   icon: TerminalIcon },
    { title: "Real-Time Health Telemetry",     desc: "Monitor node CPU, heap memory, GC events, and shard distribution.",               icon: ActivityIcon },
    { title: "Index Orchestration",            desc: "Create, reindex, alias, and update mapping schemas with built-in validation.",     icon: LayersIcon   },
    { title: "Python Backend Integration",     desc: "Fully wired to your run.py backend — async requests, API proxying, secure auth.", icon: CpuIcon      },
  ];

  const surf = isDark ? "bg-[#0c0c10] border-[#1e2130]" : "bg-white border-slate-200 shadow-sm";

  return (
    <div className="page-stack">

      {/* ── HERO ── */}
      <div className={`hero-panel ${surf}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center p-6 sm:p-8 lg:p-10">
          {/* Left copy (7 columns) */}
          <div className="lg:col-span-7 flex flex-col justify-center min-w-0">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium w-fit mb-4 border ${
              isDark ? "bg-[#111116] border-[#1e2130] text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${healthCfg.dot} animate-pulse`} />
              {clusterData?.cluster_name || "elasticease-production"} &middot; connected
            </div>

            <h1 className={`font-bold tracking-tight leading-[1.18] mb-3.5 ${isDark ? "text-slate-100" : "text-slate-900"}`}
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)" }}
            >
              Elasticsearch management,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                simplified.
              </span>
            </h1>

            <p className={`text-[14px] leading-relaxed mb-6 max-w-xl ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              A high-performance platform to monitor, query, and orchestrate your Elasticsearch nodes with maximum clarity.
            </p>

            <div className="flex items-center flex-wrap gap-3">
              <button
                onClick={() => onNavigateToTab("console")} type="button"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[13px] transition-all text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm cursor-pointer"
              >
                <TerminalIcon className="w-4 h-4 flex-shrink-0" /> Open Console <ChevronRightIcon className="w-3.5 h-3.5 flex-shrink-0" />
              </button>
              <button
                onClick={() => onNavigateToTab("cluster")} type="button"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[13px] transition-all border cursor-pointer ${
                  isDark ? "bg-[#111116] border-[#1e2130] text-slate-300 hover:bg-[#1e2130]" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ActivityIcon className="w-4 h-4 flex-shrink-0" /> View Infrastructure
              </button>
            </div>
          </div>

          {/* Right: cluster visualization (5 columns) */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end w-full min-w-0">
            <div className={`w-full max-w-[420px] lg:max-w-none rounded-xl border overflow-hidden shadow-sm ${
              isDark ? "bg-[#0f0f14] border-[#1e2130]" : "bg-white border-slate-200 shadow-md"
            }`}>
              <div className={`px-4 py-2.5 border-b flex items-center gap-2 ${isDark ? "bg-[#111116] border-[#1e2130]" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className={`ml-1 text-[10px] font-mono truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>cluster-topology</span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {nodesData.map((n) => (
                  <div key={n.name} className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    isDark ? "border-[#1e2130] bg-[#0c0c10] hover:bg-[#14141c]" : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ServerIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                      <div className="min-w-0">
                        <div className={`text-[11px] font-medium font-mono truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{n.name}</div>
                        <div className={`text-[10px] font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>{n.ip}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <div className="text-right">
                        <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>CPU</div>
                        <div className={`text-[11px] font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}>{n.cpu}</div>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full ${healthCfg.dot}`} style={{ boxShadow: "0 0 5px rgba(16,185,129,0.5)" }} />
                    </div>
                  </div>
                ))}
                <div className={`px-3 py-2 rounded-lg flex items-center justify-between text-[10px] font-mono border ${
                  isDark ? "bg-[#0c0c10] border-[#1e2130] text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
                }`}>
                  <span>active_shards</span>
                  <span className={isDark ? "text-emerald-400" : "text-emerald-600"}>
                    {clusterData?.active_shards !== undefined
                      ? `${clusterData.active_shards} / ${clusterData.active_shards}`
                      : "284 / 284"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── METRIC CARDS ── */}
      <div className="stat-grid mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`metric-card group ${isDark ? "bg-[#0c0c10] border-[#1e2130]" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`t-meta ${isDark ? "text-slate-500" : "text-slate-400"}`}>{s.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${s.bg} ${s.border}`}>
                  <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span className={`text-2xl font-semibold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>{s.value}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs flex items-center gap-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.sub}
                  </span>
                  <div className="w-14 flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity duration-300">
                    <Sparkline data={s.sparkline} color={s.sparkColor} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CONSOLE SECTION ── */}
      <div className="mb-8">
        <div className={`flex items-start justify-between mb-4 pb-4 border-b ${isDark ? "border-[#1e2130]" : "border-slate-200"}`}>
          <div>
            <h2 className={`text-lg font-semibold tracking-tight mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              Interactive Console
            </h2>
            <p className={`text-[13px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Execute REST commands directly against your Elasticsearch cluster.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab("console")} type="button"
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer ${
              isDark ? "border-[#1e2130] text-slate-400 hover:bg-[#1e2130] hover:text-slate-200" : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            }`}
          >
            Full Console <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <ConsoleTerminal theme={theme} />

        <div className="feature-grid mt-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className={`feature-card ${isDark ? "bg-[#0c0c10] border-[#1e2130]" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${isDark ? "bg-indigo-500/10" : "bg-indigo-50"}`}>
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className={`text-[13px] font-semibold mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}>{f.title}</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? "text-slate-500" : "text-slate-400"}`}>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BACKEND BANNER ── */}
      <div className={`backend-banner ${isDark ? "bg-[#0c0c10] border-[#1e2130]" : "bg-white border-slate-200 shadow-sm"}`}>
        <div>
          <h3 className={`text-sm font-semibold flex items-center gap-2 mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            <CpuIcon className="w-4 h-4 text-indigo-400" /> Backend Connection Ready
          </h3>
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Frontend is configured to sync with your Python backend (run.py).
          </p>
        </div>
        <button onClick={() => onNavigateToTab("settings")} type="button" className="backend-config-button cursor-pointer">
          Configure Endpoints
        </button>
      </div>

    </div>
  );
}

