import React, { useState, useEffect } from "react";
import { ServerIcon, ActivityIcon, ShieldIcon, DatabaseIcon, CpuIcon } from "./Icons";
import BackButton from "./BackButton";

// Backend API Base URL from Vite config (config.yaml)
const API_BASE_URL = typeof __API_BASE_URL__ !== "undefined"
  ? __API_BASE_URL__
  : (typeof __BACKEND_BASE_URL__ !== "undefined" ? __BACKEND_BASE_URL__ : "http://localhost:8000");

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

function deriveClusterStatus(statsData, clusterData, indices) {
  if (statsData?.status) return String(statsData.status).toLowerCase();
  if (clusterData?.status) return String(clusterData.status).toLowerCase();
  if (Array.isArray(indices) && indices.length > 0) {
    if (indices.some((idx) => (idx.health || "").toLowerCase() === "red")) return "red";
    if (indices.some((idx) => (idx.health || "").toLowerCase() === "yellow")) return "yellow";
    return "green";
  }
  if (statsData?.cluster_name || clusterData?.cluster_name || clusterData?.tagline || clusterData?.name) {
    return "green";
  }
  return null;
}

export default function ClusterHealthPage({ theme }) {
  const isDark = theme === "dark";

  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOffline, setIsBackendOffline] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [indices, setIndices] = useState([]);
  const [rawIndices, setRawIndices] = useState([]);
  const [clusterData, setClusterData] = useState(null);
  const [clusterStats, setClusterStats] = useState(null);
  const [streamTotalDocs, setStreamTotalDocs] = useState(null);
  const [latency, setLatency] = useState(null);

  // ── 1. Real-time SSE telemetry from /v1/core/cluster_info ────────────────
  useEffect(() => {
    let isMounted = true;
    let eventSource = null;

    try {
      eventSource = new EventSource(`${API_BASE_URL}/v1/core/cluster_info`);

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

            // Extract cluster stats from payload.response (from /_cluster/stats)
            const stats = (payload.response && typeof payload.response === "object")
              ? payload.response
              : payload;
            setClusterStats(stats);

            // Extract round-trip latency from the same /cluster_info route
            if (payload.latency !== undefined && payload.latency !== null) {
              const rawLat = parseFloat(payload.latency);
              if (!isNaN(rawLat)) {
                setLatency(Math.round(rawLat * 10) / 10);
              }
            }

            // Fallback / direct properties if present in /cluster_info SSE payload
            if (payload.cluster_health) {
              setClusterData(payload.cluster_health);
            }
            if (Array.isArray(payload.total_nodes)) {
              setNodes(payload.total_nodes);
            } else if (Array.isArray(payload.nodes)) {
              setNodes(payload.nodes);
            } else if (Array.isArray(payload.response?.nodes)) {
              setNodes(payload.response.nodes);
            }

            if (Array.isArray(payload.indices)) {
              const allIndices = payload.indices;
              const nonSystem = allIndices.filter(
                (idx) => !String(idx.index || "").startsWith(".")
              );
              setIndices(nonSystem.length > 0 ? nonSystem : allIndices);
              setRawIndices(allIndices);
            } else if (Array.isArray(payload.response?.indices)) {
              const allIndices = payload.response.indices;
              const nonSystem = allIndices.filter(
                (idx) => !String(idx.index || "").startsWith(".")
              );
              setIndices(nonSystem.length > 0 ? nonSystem : allIndices);
              setRawIndices(allIndices);
            }

            if (payload.total_docs !== undefined && payload.total_docs !== null) {
              setStreamTotalDocs(payload.total_docs);
            }

            setIsLoading(false);
            setIsBackendOffline(false);
          }
        } catch (err) {
          console.error("[ClusterHealth] SSE parse error:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn("[ClusterHealth] SSE connection issue, EventSource will retry:", err);
        if (isMounted) {
          setIsBackendOffline(true);
          setIsLoading(false);
        }
      };
    } catch (err) {
      console.error("[ClusterHealth] Failed to initialize SSE:", err);
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

  function getHealthConfig(statusStr) {
    const s = (statusStr || "").toLowerCase();
    if (s === "green") return { label: "Green", color: "text-emerald-500 dark:text-emerald-400", dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" };
    if (s === "yellow") return { label: "Yellow", color: "text-amber-500 dark:text-amber-400", dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" };
    if (s === "red") return { label: "Red", color: "text-rose-500 dark:text-rose-400", dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" };
    return { label: "Unknown", color: "text-slate-400", dot: "bg-slate-400" };
  }

  const derivedStatus = deriveClusterStatus(clusterStats, clusterData, rawIndices.length > 0 ? rawIndices : indices);
  const healthCfg = getHealthConfig(derivedStatus);

  // Format large numbers
  const formatNum = (num) => {
    if (num === undefined || num === null || num === "") return "0";
    const n = parseInt(String(num).replace(/,/g, ""), 10);
    if (isNaN(n)) return "0";
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toLocaleString();
  };

  const listForShards = rawIndices.length > 0 ? rawIndices : indices;
  const activePrimaryShards = clusterStats?.indices?.shards?.primaries
    ?? (clusterData?.active_shards !== undefined
        ? clusterData.active_shards
        : listForShards.reduce((acc, idx) => acc + (parseInt(idx.pri || "0", 10) || 0), 0));

  const totalShards = clusterStats?.indices?.shards?.total
    ?? (clusterData?.active_shards !== undefined && clusterData?.unassigned_shards !== undefined
        ? clusterData.active_shards + clusterData.unassigned_shards
        : listForShards.reduce((acc, idx) => acc + ((parseInt(idx.pri || "0", 10) || 0) + (parseInt(idx.rep || "0", 10) || 0)), activePrimaryShards));

  const unassignedShards = Math.max(0, totalShards - activePrimaryShards);

  const fallbackDocsCount = indices.reduce((acc, idx) => acc + parseInt(String(idx["docs.count"] || "0").replace(/,/g, ""), 10), 0);
  const totalDocsToDisplay = clusterStats?.indices?.docs?.count
    ?? (streamTotalDocs !== null ? streamTotalDocs : fallbackDocsCount);

  const indicesCount = clusterStats?.indices?.count ?? indices.length;
  const storeSizeBytes = clusterStats?.indices?.store?.size_in_bytes ?? null;
  const clusterName = clusterStats?.cluster_name || clusterData?.cluster_name || "elasticsearch";

  // Nodes role metrics from _cluster/stats
  const totalNodesCount = clusterStats?.nodes?.count?.total ?? nodes.length;
  const dataNodesCount = clusterStats?.nodes?.count?.data
    ?? nodes.filter((n) => String(n["node.role"] || "").includes("d")).length;
  const masterNodesCount = clusterStats?.nodes?.count?.master
    ?? nodes.filter((n) => n.master === "*" || String(n["node.role"] || "").includes("m")).length;
  const ingestNodesCount = clusterStats?.nodes?.count?.ingest ?? 0;
  const esVersions = Array.isArray(clusterStats?.nodes?.versions) ? clusterStats.nodes.versions.join(", ") : null;

  // Resource / Diagnostics from _cluster/stats
  const jvmHeapUsed = clusterStats?.nodes?.jvm?.mem?.heap_used_in_bytes;
  const jvmHeapMax = clusterStats?.nodes?.jvm?.mem?.heap_max_in_bytes;
  const jvmHeapPercent = (jvmHeapUsed && jvmHeapMax) ? Math.round((jvmHeapUsed / jvmHeapMax) * 100) : null;
  const jvmThreads = clusterStats?.nodes?.jvm?.threads;

  const processCpu = clusterStats?.nodes?.process?.cpu?.percent;
  const osMemPercent = clusterStats?.nodes?.os?.mem?.used_percent;
  const availableProcessors = clusterStats?.nodes?.os?.available_processors;

  const fsTotal = clusterStats?.nodes?.fs?.total_in_bytes;
  const fsAvailable = clusterStats?.nodes?.fs?.available_in_bytes;
  const fsFreePercent = (fsTotal && fsAvailable) ? Math.round((fsAvailable / fsTotal) * 100) : null;

  const segmentsCount = clusterStats?.indices?.segments?.count;
  const segmentsMemory = clusterStats?.indices?.segments?.memory_in_bytes;

  const metaCards = [
    { 
      label: "Cluster Status", 
      value: isBackendOffline ? "Offline" : (derivedStatus ? derivedStatus.charAt(0).toUpperCase() + derivedStatus.slice(1) : (isLoading ? "Loading..." : "Unknown")), 
      sub: isBackendOffline ? "Backend server unreachable" : (derivedStatus ? `Cluster: ${clusterName}` : "Waiting for connection..."), 
      icon: ShieldIcon, 
      valueColor: isBackendOffline ? "text-rose-500 dark:text-rose-400" : healthCfg.color, 
      dot: true 
    },
    { 
      label: "Active Shards",  
      value: isBackendOffline ? "Offline" : (totalShards > 0 ? `${activePrimaryShards} / ${totalShards}` : (isLoading ? "..." : "0")),   
      sub: isBackendOffline ? "Cannot reach backend" : (unassignedShards > 0 ? `${unassignedShards} unassigned shards` : `${activePrimaryShards} primary active`),      
      icon: ActivityIcon, 
      valueColor: isBackendOffline ? "text-rose-500 dark:text-rose-400" : "text-primary" 
    },
    { 
      label: "Total Docs",     
      value: isBackendOffline ? "Offline" : formatNum(totalDocsToDisplay),  
      sub: isBackendOffline ? "Cannot reach backend" : `Across ${indicesCount} ${indicesCount === 1 ? "index" : "indices"}${storeSizeBytes !== null ? ` (${formatBytes(storeSizeBytes)})` : ""}`,  
      icon: DatabaseIcon, 
      valueColor: isBackendOffline ? "text-rose-500 dark:text-rose-400" : "text-primary" 
    },
    {
      label: "Query Latency",
      value: latency !== null ? `${latency}ms` : (isBackendOffline ? "Offline" : (isLoading ? "Loading..." : "-")),
      sub: isBackendOffline ? "Cannot reach backend" : "Elasticsearch API ping (/cluster_info)",
      icon: CpuIcon,
      valueColor: isBackendOffline ? "text-rose-500 dark:text-rose-400" : "text-primary"
    }
  ];

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div className="page-heading-nav">
          <BackButton />
        </div>
        <h1>Cluster Health &amp; Diagnostics</h1>
        <p>Real-time metrics, node allocations, and index health across your Elasticsearch cluster.</p>
      </div>

      {/* Backend Offline Alert Banner */}
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
              <span className="font-semibold text-rose-400">Backend Server Offline:</span> Cannot connect to backend server at{" "}
              <code className={`font-mono text-xs px-1.5 py-0.5 rounded ${isDark ? "bg-[#1e2130] text-rose-300" : "bg-rose-100 text-rose-900"}`}>
                {API_BASE_URL}
              </code>
              . Live cluster diagnostics and telemetry are paused until the backend service is running.
            </div>
          </div>
        </div>
      )}

      {/* Metric cards (4-grid) */}
      <div className="stat-grid mb-8">
        {metaCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="metric-card flex flex-col gap-3 bg-surface border-base border shadow-surface-sm">
              <div className="flex items-start justify-between">
                <span className="t-meta text-secondary">{c.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-raised">
                  <Icon className={`w-4 h-4 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                </div>
              </div>
              <div>
                <p className={`flex items-center gap-2 text-2xl font-semibold tracking-tight mb-0.5 ${c.valueColor}`}>
                  {c.dot && <span className={`w-2 h-2 rounded-full ${isBackendOffline ? "bg-rose-500" : healthCfg.dot} flex-shrink-0`} />}
                  {c.value}
                </p>
                <p className="text-xs text-secondary">{c.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Diagnostics & Resource Utilization Panel from /_cluster/stats */}
      {clusterStats && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold tracking-tight text-primary flex items-center gap-2">
              <CpuIcon className="w-4 h-4 text-indigo-400" /> Resource Diagnostics &amp; Cluster Telemetry
            </h2>
            <span className="text-xs text-secondary font-mono">
              UUID: {clusterStats.cluster_uuid ? `${clusterStats.cluster_uuid.slice(0, 12)}…` : "local"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* JVM Memory */}
            <div className="p-4 rounded-xl border border-base bg-surface shadow-surface-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">JVM Heap Memory</span>
                {jvmHeapPercent !== null && (
                  <span className={`text-xs font-mono font-bold ${jvmHeapPercent > 80 ? "text-amber-500" : "text-emerald-500"}`}>
                    {jvmHeapPercent}%
                  </span>
                )}
              </div>
              <p className="text-lg font-mono font-semibold text-primary mb-1">
                {jvmHeapUsed ? formatBytes(jvmHeapUsed) : "-"}
              </p>
              <div className="w-full bg-raised rounded-full h-1.5 mb-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${jvmHeapPercent > 80 ? "bg-amber-500" : "bg-indigo-500"}`}
                  style={{ width: `${Math.min(100, jvmHeapPercent || 0)}%` }}
                />
              </div>
              <p className="text-[11px] text-secondary">
                Max: {jvmHeapMax ? formatBytes(jvmHeapMax) : "-"} {jvmThreads ? `· ${jvmThreads} threads` : ""}
              </p>
            </div>

            {/* Host & Process CPU */}
            <div className="p-4 rounded-xl border border-base bg-surface shadow-surface-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Compute &amp; CPU</span>
                {processCpu !== undefined && processCpu !== null && (
                  <span className="text-xs font-mono font-bold text-indigo-400">{processCpu}%</span>
                )}
              </div>
              <p className="text-lg font-mono font-semibold text-primary mb-1">
                {processCpu !== undefined && processCpu !== null ? `${processCpu}% CPU` : (availableProcessors ? `${availableProcessors} Cores` : "-")}
              </p>
              <div className="w-full bg-raised rounded-full h-1.5 mb-2 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, processCpu || 0)}%` }}
                />
              </div>
              <p className="text-[11px] text-secondary">
                {availableProcessors ? `${availableProcessors} CPU cores` : "Host system"} {osMemPercent !== undefined && osMemPercent !== null ? `· ${osMemPercent}% RAM used` : ""}
              </p>
            </div>

            {/* Disk & Filesystem */}
            <div className="p-4 rounded-xl border border-base bg-surface shadow-surface-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Storage &amp; Disk</span>
                {fsFreePercent !== null && (
                  <span className="text-xs font-mono font-bold text-emerald-500">{fsFreePercent}% Free</span>
                )}
              </div>
              <p className="text-lg font-mono font-semibold text-primary mb-1">
                {fsAvailable ? formatBytes(fsAvailable) : (storeSizeBytes ? formatBytes(storeSizeBytes) : "-")}
              </p>
              <div className="w-full bg-raised rounded-full h-1.5 mb-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, fsFreePercent || 0)}%` }}
                />
              </div>
              <p className="text-[11px] text-secondary">
                {fsTotal ? `Total: ${formatBytes(fsTotal)}` : (storeSizeBytes ? `Index Store: ${formatBytes(storeSizeBytes)}` : "Storage ready")}
              </p>
            </div>

            {/* Node Roles & Versions */}
            <div className="p-4 rounded-xl border border-base bg-surface shadow-surface-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Cluster Topology</span>
                {esVersions && (
                  <span className="text-xs font-mono font-semibold text-indigo-400">v{esVersions}</span>
                )}
              </div>
              <p className="text-lg font-mono font-semibold text-primary mb-1">
                {totalNodesCount} {totalNodesCount === 1 ? "Node" : "Nodes"}
              </p>
              <p className="text-xs text-secondary mt-1">
                {dataNodesCount} data &middot; {masterNodesCount} master {ingestNodesCount > 0 ? `&middot; ${ingestNodesCount} ingest` : ""}
              </p>
              <p className="text-[11px] text-secondary mt-1">
                {segmentsCount ? `${segmentsCount} segments (${formatBytes(segmentsMemory)})` : "Healthy node topology"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nodes table */}
      <div className="table-panel mb-6 bg-surface border-base border shadow-surface-sm">
        <div className="table-panel-header">
          <h2 className="table-panel-title text-primary">
            <ServerIcon className="w-4 h-4 text-indigo-400" /> Connected Nodes
          </h2>
          <span className="table-panel-badge">{isBackendOffline ? "Offline" : `${totalNodesCount} Active`}</span>
        </div>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">List of connected Elasticsearch cluster nodes and their resource metrics</caption>
            <thead>
              <tr>
                {["Node Name", "IP Address", "Role", "CPU", "RAM", "Heap", "Status"].map((h) => (
                  <th key={h} scope="col">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.length > 0 ? nodes.map((n, i) => (
                <tr key={i}>
                  <td className="font-mono font-semibold text-primary">{n.name || "unknown"}</td>
                  <td className="font-mono text-xs text-secondary">{n.ip || "-"}</td>
                  <td className="text-secondary">{n["node.role"] === "m" || String(n.master) === "*" ? "Master" : (n["node.role"] ? "Data" : "Node")}</td>
                  <td className="font-mono text-xs">
                    <span className={parseInt(n.cpu || "0", 10) > 70 ? "text-amber-500 font-semibold" : "text-primary"}>
                      {n.cpu ? `${n.cpu}%` : "-"}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-secondary">{n["ram.percent"] ? `${n["ram.percent"]}%` : "-"}</td>
                  <td className="font-mono text-xs text-secondary">{n["heap.percent"] ? `${n["heap.percent"]}%` : "-"}</td>
                  <td>
                    <span className="node-status">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Online
                    </span>
                  </td>
                </tr>
              )) : totalNodesCount > 0 ? (
                <tr>
                  <td className="font-mono font-semibold text-primary">cluster-node-group</td>
                  <td className="font-mono text-xs text-secondary">Local Cluster</td>
                  <td className="text-secondary">{masterNodesCount} Master / {dataNodesCount} Data</td>
                  <td className="font-mono text-xs text-primary">{processCpu !== undefined && processCpu !== null ? `${processCpu}%` : "-"}</td>
                  <td className="font-mono text-xs text-secondary">{osMemPercent !== undefined && osMemPercent !== null ? `${osMemPercent}%` : "-"}</td>
                  <td className="font-mono text-xs text-secondary">{jvmHeapPercent !== null ? `${jvmHeapPercent}%` : "-"}</td>
                  <td>
                    <span className="node-status">
                      <span className={`w-1.5 h-1.5 rounded-full ${healthCfg.dot || "bg-emerald-500"}`} />
                      {derivedStatus ? derivedStatus.charAt(0).toUpperCase() + derivedStatus.slice(1) : "Online"}
                    </span>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-sm text-secondary">
                    {isBackendOffline ? "Cannot retrieve connected nodes: backend server is offline." : (isLoading ? "Connecting to /cluster_info SSE stream..." : "No nodes found")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Indices table */}
      <div className="table-panel bg-surface border-base border shadow-surface-sm">
        <div className="table-panel-header">
          <h2 className="table-panel-title text-primary">
            <DatabaseIcon className="w-4 h-4 text-indigo-400" /> Index Overview
          </h2>
          <span className="table-panel-badge">{isBackendOffline ? "Offline" : `${indicesCount} Indices`}</span>
        </div>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">List of Elasticsearch cluster indices and shard details</caption>
            <thead>
              <tr>
                {["Index Name", "Health", "Documents", "Store Size", "Shards (P/R)"].map((h) => (
                  <th key={h} scope="col">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {indices.length > 0 ? indices.map((idx, i) => (
                <tr key={i}>
                  <td className="font-mono font-semibold text-primary">{idx.index}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      idx.health === "green" ? "text-emerald-600 dark:text-emerald-400" :
                      idx.health === "yellow" ? "text-amber-600 dark:text-amber-400" :
                      "text-rose-600 dark:text-rose-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        idx.health === "green" ? "bg-emerald-500" :
                        idx.health === "yellow" ? "bg-amber-500" :
                        "bg-rose-500"
                      }`} />
                      {idx.health}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-secondary">{formatNum(idx["docs.count"] || idx.docs)}</td>
                  <td className="font-mono text-xs text-secondary">{String(idx["store.size"] || "-").toUpperCase()}</td>
                  <td className="font-mono text-xs text-secondary">{idx.pri || "0"}/{idx.rep || "0"}</td>
                </tr>
              )) : indicesCount > 0 ? (
                <tr>
                  <td className="font-mono font-semibold text-primary">All Indices ({indicesCount})</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${healthCfg.dot || "bg-emerald-500"}`} />
                      {derivedStatus || "Active"}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-secondary">{formatNum(totalDocsToDisplay)}</td>
                  <td className="font-mono text-xs text-secondary">{storeSizeBytes !== null ? formatBytes(storeSizeBytes) : "-"}</td>
                  <td className="font-mono text-xs text-secondary">{activePrimaryShards}/{totalShards}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-sm text-secondary">
                    {isBackendOffline ? "Cannot retrieve indices: backend server is offline." : (isLoading ? "Connecting to /cluster_info SSE stream..." : "No visible indices found")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
