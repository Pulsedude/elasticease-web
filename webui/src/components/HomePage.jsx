import { useState, useEffect } from "react";
import {
  TerminalIcon, DatabaseIcon, CpuIcon,
  ActivityIcon, ServerIcon, ChevronRightIcon, LayersIcon, ShieldIcon
} from "./Icons";
import ConsoleTerminal from "./ConsoleTerminal";
import BackButton from "./BackButton";
import { API_BASE_URL, createEventSource } from "../api/client.js";

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

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return "--";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  let val = Number(bytes);
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(1)} ${units[i]}`;
}

function deriveClusterStatus(statsData, clusterHealth, indices) {
  if (statsData?.status) {
    return String(statsData.status).toLowerCase();
  }
  if (clusterHealth?.status) {
    return String(clusterHealth.status).toLowerCase();
  }
  if (Array.isArray(indices) && indices.length > 0) {
    if (indices.some((idx) => (idx.health || "").toLowerCase() === "red")) return "red";
    if (indices.some((idx) => (idx.health || "").toLowerCase() === "yellow")) return "yellow";
    return "green";
  }
  if (statsData?.cluster_name || clusterHealth?.cluster_name || clusterHealth?.tagline || clusterHealth?.name) {
    return "green";
  }
  return null;
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

  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOffline, setIsBackendOffline] = useState(false);
  const [clusterInfo, setClusterInfo] = useState(null);
  const [latencyData, setLatencyData] = useState(null);
  const [latencyHistory, setLatencyHistory] = useState([1.2, 1.3, 1.1, 1.8, 1.2, 1.2]);

  // ── 1. SSE Stream: Real-time Cluster Info & Latency from /v1/core/cluster_info (ONLY backend route) ──
  useEffect(() => {
    let isMounted = true;
    let eventSource = null;

    try {
      eventSource = createEventSource(`${API_BASE_URL}/v1/core/cluster_info`);

      eventSource.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload) {
            if (payload.success === false) {
              setIsBackendOffline(true);
              setIsLoading(false);
              return;
            }
            setClusterInfo(payload);
            setIsLoading(false);
            setIsBackendOffline(false);

            // Extract latency from the same /cluster_info route
            if (payload.latency !== undefined && payload.latency !== null) {
              const rawLat = parseFloat(payload.latency);
              if (!isNaN(rawLat)) {
                const ms = Math.round(rawLat * 10) / 10;
                setLatencyData(ms);
                setLatencyHistory((prev) => {
                  const next = [...prev, ms];
                  return next.length > 10 ? next.slice(next.length - 10) : next;
                });
              }
            }
          }
        } catch (err) {
          console.error("[HomePage] SSE JSON parse error:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn("[HomePage] SSE connection issue, EventSource will automatically retry:", err);
        if (isMounted) {
          setIsBackendOffline(true);
          setIsLoading(false);
        }
      };
    } catch (err) {
      console.error("[HomePage] Failed to initialize SSE EventSource:", err);
      if (isMounted) {
        setIsBackendOffline(true);
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // ── Derived Data from SSE payload (from /_cluster/stats via /cluster_info) ──
  const statsData = (clusterInfo?.response && typeof clusterInfo.response === "object")
    ? clusterInfo.response
    : clusterInfo;

  const clusterHealth = clusterInfo?.cluster_health;
  const nodes = Array.isArray(clusterInfo?.total_nodes) && clusterInfo.total_nodes.length > 0
    ? clusterInfo.total_nodes
    : (Array.isArray(clusterInfo?.nodes)
        ? clusterInfo.nodes
        : (Array.isArray(clusterInfo?.response?.nodes) ? clusterInfo.response.nodes : []));
  const indices = Array.isArray(clusterInfo?.indices) ? clusterInfo.indices : [];

  const derivedStatus = deriveClusterStatus(statsData, clusterHealth, indices);
  const healthCfg = getHealthConfig(derivedStatus, isDark);

  const clusterName = statsData?.cluster_name || clusterHealth?.cluster_name || "elasticsearch";

  // Nodes counts
  const totalNodesCount = statsData?.nodes?.count?.total
    ?? (Array.isArray(nodes) ? nodes.length : 0);
  const dataNodesCount = statsData?.nodes?.count?.data
    ?? (Array.isArray(nodes) ? nodes.filter((n) => String(n["node.role"] || "").includes("d")).length : 0);
  const masterNodesCount = statsData?.nodes?.count?.master
    ?? (Array.isArray(nodes) ? nodes.filter((n) => n.master === "*" || String(n["node.role"] || "").includes("m")).length : 0);
  const ingestNodesCount = statsData?.nodes?.count?.ingest ?? 0;
  const esVersions = Array.isArray(statsData?.nodes?.versions) ? statsData.nodes.versions.join(", ") : null;

  // Documents & Indices count
  const totalDocs = statsData?.indices?.docs?.count
    ?? (clusterInfo?.total_docs !== undefined && clusterInfo?.total_docs !== null
        ? clusterInfo.total_docs
        : (indices.length > 0
            ? indices.reduce((acc, idx) => acc + (parseInt(String(idx["docs.count"] || "0"), 10) || 0), 0)
            : null));

  const visibleIndices = indices.filter((idx) => !String(idx.index || "").startsWith("."));
  const indicesCount = statsData?.indices?.count ?? (visibleIndices.length || indices.length);

  // Shards
  const activePrimaryShards = statsData?.indices?.shards?.primaries
    ?? (clusterHealth?.active_shards !== undefined
        ? clusterHealth.active_shards
        : indices.reduce((acc, idx) => acc + (parseInt(idx.pri || "0", 10) || 0), 0));

  const totalShards = statsData?.indices?.shards?.total
    ?? (clusterHealth?.active_shards !== undefined && clusterHealth?.unassigned_shards !== undefined
        ? clusterHealth.active_shards + clusterHealth.unassigned_shards
        : indices.reduce((acc, idx) => acc + ((parseInt(idx.pri || "0", 10) || 0) + (parseInt(idx.rep || "0", 10) || 0)), activePrimaryShards));

  const storeSizeBytes = statsData?.indices?.store?.size_in_bytes ?? null;

  const displayTopology = nodes.length > 0
    ? nodes.map((n) => ({
        name: n.name || "unknown",
        ip: n.ip || "-",
        cpu: n.cpu ? `${n.cpu}%` : "-",
        master: n.master === "*" || String(n["node.role"] || "").includes("m"),
      }))
    : [];

  const stats = [
    {
      label: "Cluster Health",
      value: derivedStatus
        ? derivedStatus.charAt(0).toUpperCase() + derivedStatus.slice(1)
        : (isBackendOffline ? "Offline" : (isLoading ? "Loading..." : "Unknown")),
      sub: derivedStatus ? healthCfg.sub : (isBackendOffline ? "Backend server unreachable" : "Waiting for cluster telemetry"),
      icon: ShieldIcon,
      color: isBackendOffline ? "text-rose-400" : healthCfg.color,
      bg: isBackendOffline ? "bg-rose-500/10" : healthCfg.bg,
      border: isBackendOffline ? "border-rose-500/20" : healthCfg.border,
      sparkline: isBackendOffline ? [0, 0, 0, 0, 0, 0] : [20, 20, 20, 20, 20, 20],
      sparkColor: isBackendOffline ? "#f43f5e" : healthCfg.sparkColor,
      dot: isBackendOffline ? "bg-rose-500" : healthCfg.dot,
    },
    {
      label: "Active Nodes",
      value: totalNodesCount > 0
        ? `${totalNodesCount} Active`
        : (isBackendOffline ? "Offline" : (isLoading ? "Loading..." : "0 Active")),
      sub: totalNodesCount > 0
        ? (dataNodesCount > 0
            ? `${dataNodesCount} data · ${masterNodesCount} master`
            : (esVersions ? `Elasticsearch v${esVersions}` : `${totalNodesCount} total nodes`))
        : (isBackendOffline ? "Backend unreachable" : "No nodes responding"),
      icon: ServerIcon,
      color: isBackendOffline ? "text-rose-400" : "text-indigo-400",
      bg: isBackendOffline ? "bg-rose-500/10" : (isDark ? "bg-indigo-500/10" : "bg-indigo-50"),
      border: isBackendOffline ? "border-rose-500/20" : (isDark ? "border-indigo-500/20" : "border-indigo-200"),
      sparkline: isBackendOffline ? [0, 0, 0, 0, 0, 0] : [35, 45, 42, 50, 48, 42],
      sparkColor: isBackendOffline ? "#f43f5e" : "#818cf8",
      dot: totalNodesCount > 0 ? "bg-indigo-500" : (isBackendOffline ? "bg-rose-500" : "bg-slate-500"),
    },
    {
      label: "Query Latency",
      value: latencyData !== null ? `${latencyData}ms` : (isBackendOffline ? "Offline" : (isLoading ? "Loading..." : "-")),
      sub: latencyData !== null ? "Elasticsearch API ping (/cluster_info)" : (isBackendOffline ? "Backend unreachable" : "Elasticsearch API ping"),
      icon: ActivityIcon,
      color: isBackendOffline ? "text-rose-400" : "text-purple-400",
      bg: isBackendOffline ? "bg-rose-500/10" : (isDark ? "bg-purple-500/10" : "bg-purple-50"),
      border: isBackendOffline ? "border-rose-500/20" : (isDark ? "border-purple-500/20" : "border-purple-200"),
      sparkline: isBackendOffline ? [0, 0, 0, 0, 0, 0] : (latencyHistory.length >= 2 ? latencyHistory : [0, 0, 0, 0, 0, 0]),
      sparkColor: isBackendOffline ? "#f43f5e" : "#c084fc",
      dot: isBackendOffline ? "bg-rose-500" : "bg-purple-500",
    },
    {
      label: "Total Docs",
      value: totalDocs !== null ? formatDocsCount(totalDocs) : (isBackendOffline ? "Offline" : (isLoading ? "Loading..." : "0")),
      sub: indicesCount > 0
        ? `${indicesCount} ${indicesCount === 1 ? "index" : "indices"}${storeSizeBytes !== null ? ` (${formatBytes(storeSizeBytes)})` : ""}`
        : (isBackendOffline ? "Backend unreachable" : "0 indices"),
      icon: DatabaseIcon,
      color: isBackendOffline ? "text-rose-400" : "text-blue-400",
      bg: isBackendOffline ? "bg-rose-500/10" : (isDark ? "bg-blue-500/10" : "bg-blue-50"),
      border: isBackendOffline ? "border-rose-500/20" : (isDark ? "border-blue-500/20" : "border-blue-200"),
      sparkline: isBackendOffline ? [0, 0, 0, 0, 0, 0] : [5.8, 5.9, 6.0, 6.1, 6.2, 6.3],
      sparkColor: isBackendOffline ? "#f43f5e" : "#60a5fa",
      dot: isBackendOffline ? "bg-rose-500" : "bg-blue-500",
    },
  ];

  const features = [
    { title: "Interactive CLI Terminal",       desc: "Execute ES REST queries with formatted JSON responses and syntax highlighting.",   icon: TerminalIcon },
    { title: "Real-Time Health Telemetry",     desc: "Monitor node CPU, heap memory, GC events, and shard distribution.",               icon: ActivityIcon },
    { title: "Index Orchestration",            desc: "Create, reindex, alias, and update mapping schemas with built-in validation.",     icon: LayersIcon   },
    { title: "Backend Integration",     desc: "Fully wired to your run.py backend — async requests, API proxying, secure auth.", icon: CpuIcon      },
  ];

  return (
    <div className="page-stack">

      {/* ── BACK NAV ── */}
      <div className="page-heading-nav" style={{ marginBottom: 16 }}>
        <BackButton />
      </div>

      {/* ── BACKEND OFFLINE ALERT BANNER ── */}
      {isBackendOffline && (
        <div
          role="alert"
          className={`mb-6 p-4 rounded-xl border flex items-start sm:items-center justify-between gap-3 shadow-sm ${
            isDark ? "bg-rose-950/20 border-rose-500/30 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0 mt-1 sm:mt-0 animate-pulse" />
            <div className="text-sm">
              <span className="font-semibold text-rose-400">Backend Server Offline:</span> Cannot connect to{" "}
              <code className={`font-mono text-xs px-1.5 py-0.5 rounded ${isDark ? "bg-[#1e2130] text-rose-300" : "bg-rose-100 text-rose-900"}`}>
                {API_BASE_URL}
              </code>
              . Telemetry and cluster metrics are unavailable. Please ensure your Python backend service (<code>run.py</code>) is running.
            </div>
          </div>
        </div>
      )}

      {/* ── HERO PANEL ── */}
      <div className="hero-panel">
        <div className="hero-grid">
          {/* Left copy */}
          <div className="flex flex-col justify-center min-w-0">
            <div className={`inline-flex items-center gap-2 h-7 px-3 rounded-full text-xs font-semibold leading-none w-fit border mb-4 ${
              isBackendOffline
                ? (isDark ? "bg-rose-500/20 border-rose-500/40 text-rose-300" : "bg-rose-100 border-rose-300 text-rose-800")
                : (isDark ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200" : "bg-emerald-100 border-emerald-300 text-emerald-800")
            }`}>
              <span className={`w-2 h-2 rounded-full inline-block animate-pulse flex-shrink-0 ${isBackendOffline ? "bg-rose-500" : healthCfg.dot}`} />
              <span className="flex items-center gap-1.5 leading-none">
                <span>{isBackendOffline ? "backend offline" : clusterName}</span>
                <span className="opacity-50">&middot;</span>
                <span>{isBackendOffline ? "disconnected" : (derivedStatus ? "connected" : "connecting...")}</span>
              </span>
            </div>

            <h1 className={`text-2xl sm:text-3xl lg:text-[2.25rem] font-bold tracking-tight leading-[1.18] mb-3.5 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              Elasticsearch management,<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                simplified.
              </span>
            </h1>

            <p className={`text-sm sm:text-[15px] leading-relaxed max-w-lg mb-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              A high-performance platform to monitor, query, and orchestrate your Elasticsearch nodes with maximum clarity.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateToTab("console")}
                type="button"
                className="inline-flex items-center justify-center gap-2.5 h-10 px-5 rounded-xl font-semibold text-sm leading-none text-white border border-transparent shadow-sm transition-all cursor-pointer"
                style={{ background: 'var(--accent)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
              >
                <TerminalIcon className="w-4 h-4 flex-shrink-0" />
                <span className="leading-none">Open Console</span>
                <ChevronRightIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
              </button>
              <button
                onClick={() => onNavigateToTab("cluster")}
                type="button"
                className={`inline-flex items-center justify-center gap-2.5 h-10 px-5 rounded-xl font-semibold text-sm leading-none transition-all border cursor-pointer ${
                  isDark ? "border-[#1e2130] bg-[#0c0c10]/40 text-slate-300 hover:bg-[#1e2130] hover:text-slate-100" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <ActivityIcon className="w-4 h-4 flex-shrink-0" />
                <span className="leading-none">View Infrastructure</span>
              </button>
            </div>
          </div>

          {/* Right: cluster visualization */}
          <div className="w-full min-w-0 flex flex-col justify-center">
            <div className={`w-full rounded-xl border overflow-hidden shadow-sm transition-all ${isDark ? "bg-[#111116] border-[#1e2130]" : "bg-slate-50 border-slate-200"}`}>
              <div className={`px-4 py-2.5 flex items-center justify-between border-b ${isDark ? "bg-[#0c0c10] border-[#1e2130]" : "bg-white border-slate-200"}`}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </div>
                  <span className={`ml-1.5 text-xs font-mono font-medium leading-none ${isDark ? "text-slate-400" : "text-slate-500"}`}>cluster-topology</span>
                </div>
                <span className={`inline-flex items-center h-5 px-2 rounded text-[11px] font-mono font-medium border leading-none ${
                  totalNodesCount > 0
                    ? (isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200")
                    : (isDark ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-700 border-rose-200")
                }`}>
                  {totalNodesCount > 0 ? `${totalNodesCount} node${totalNodesCount === 1 ? "" : "s"} active` : (isBackendOffline ? "Backend offline" : "0 nodes active")}
                </span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {displayTopology.length > 0 ? (
                  displayTopology.map((n) => (
                    <div key={n.name} className={`flex items-center justify-between h-[54px] px-3 rounded-lg border transition-colors ${
                      isDark ? "bg-[#0c0c10]/60 border-[#1e2130] hover:bg-[#1e2130]/50" : "bg-white border-slate-200 hover:bg-slate-100/80"
                    }`}>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 border ${
                          isDark ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600"
                        }`}>
                          <ServerIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`text-xs sm:text-[13px] font-mono font-medium truncate leading-none ${isDark ? "text-slate-100" : "text-slate-900"}`}>{n.name}</span>
                            {n.master && (
                              <span className={`inline-flex items-center h-3.5 px-1 rounded text-[9px] font-mono font-semibold uppercase tracking-wide leading-none flex-shrink-0 ${
                                isDark ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                              }`}>
                                master
                              </span>
                            )}
                          </div>
                          <span className={`text-[11px] font-mono leading-none mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{n.ip}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <div className="flex flex-col items-end justify-center min-w-[40px]">
                          <span className={`text-[10px] font-semibold tracking-wider uppercase leading-none ${isDark ? "text-slate-500" : "text-slate-400"}`}>CPU</span>
                          <span className={`text-xs sm:text-[13px] font-mono font-semibold tabular-nums leading-none mt-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}>{n.cpu}</span>
                        </div>
                        <div className="w-2.5 h-2.5 flex items-center justify-center flex-shrink-0">
                          <span className={`w-2 h-2 rounded-full inline-block ${healthCfg.dot || "bg-emerald-500"}`} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : totalNodesCount > 0 ? (
                  /* Display cluster node stats from _cluster/stats */
                  <div className="flex flex-col gap-2">
                    <div className={`p-3 rounded-lg border flex items-center justify-between ${
                      isDark ? "bg-[#0c0c10]/60 border-[#1e2130]" : "bg-white border-slate-200"
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 border ${
                          isDark ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600"
                        }`}>
                          <ServerIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className={`text-xs sm:text-[13px] font-medium ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                            Cluster Nodes
                          </div>
                          <div className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                            {dataNodesCount} data &middot; {masterNodesCount} master {ingestNodesCount > 0 ? `&middot; ${ingestNodesCount} ingest` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-mono font-semibold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                          {totalNodesCount} Active
                        </span>
                        {esVersions && (
                          <div className={`text-[10px] font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                            v{esVersions}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className={`p-2.5 rounded-lg border ${isDark ? "bg-[#0c0c10]/40 border-[#1e2130]" : "bg-white border-slate-200"}`}>
                        <div className={`text-[10px] uppercase font-semibold tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          JVM Heap
                        </div>
                        <div className={`text-xs font-mono font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                          {statsData?.nodes?.jvm?.mem?.heap_used_in_bytes ? formatBytes(statsData.nodes.jvm.mem.heap_used_in_bytes) : "-"}
                          {statsData?.nodes?.jvm?.mem?.heap_max_in_bytes ? ` / ${formatBytes(statsData.nodes.jvm.mem.heap_max_in_bytes)}` : ""}
                        </div>
                      </div>
                      <div className={`p-2.5 rounded-lg border ${isDark ? "bg-[#0c0c10]/40 border-[#1e2130]" : "bg-white border-slate-200"}`}>
                        <div className={`text-[10px] uppercase font-semibold tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          Cluster Store
                        </div>
                        <div className={`text-xs font-mono font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                          {storeSizeBytes !== null ? formatBytes(storeSizeBytes) : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`p-6 text-center rounded-lg border ${isDark ? "bg-[#0c0c10]/40 border-[#1e2130]" : "bg-white border-slate-200"}`}>
                    <ServerIcon className={`w-6 h-6 mx-auto mb-2 ${isBackendOffline ? "text-rose-400" : "text-slate-400"}`} />
                    <p className={`text-xs font-semibold ${isBackendOffline ? "text-rose-400" : (isDark ? "text-slate-300" : "text-slate-700")}`}>
                      {isBackendOffline ? "Backend server is offline" : (isLoading ? "Connecting to cluster..." : "No connected nodes found")}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isBackendOffline ? `Cannot connect to ${API_BASE_URL}` : "Cluster telemetry stream is inactive"}
                    </p>
                  </div>
                )}
                <div className={`h-8 px-3 rounded-lg flex items-center justify-between text-xs font-mono border ${
                  isDark ? "bg-[#0c0c10] border-[#1e2130]" : "bg-white border-slate-200"
                }`}>
                  <span className={`leading-none ${isDark ? "text-slate-400" : "text-slate-500"}`}>active_shards</span>
                  <span className={`font-mono font-semibold leading-none ${isBackendOffline ? "text-rose-400" : "text-emerald-500"}`}>
                    {totalShards > 0 ? `${activePrimaryShards} / ${totalShards}` : (isBackendOffline ? "Offline" : "0 / 0")}
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
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer bg-transparent ${
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
            Frontend is configured to sync with your backend.
          </p>
        </div>
        <button onClick={() => onNavigateToTab("settings")} type="button" className="backend-config-button cursor-pointer">
          Configure Endpoints
        </button>
      </div>
    </div>
  );
}
