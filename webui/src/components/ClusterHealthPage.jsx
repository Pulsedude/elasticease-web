import React, { useState, useEffect } from "react";
import { ServerIcon, ActivityIcon, ShieldIcon, DatabaseIcon } from "./Icons";

// Backend API Base URL from Vite config (config.yaml)
const API_BASE_URL = typeof __API_BASE_URL__ !== "undefined"
  ? __API_BASE_URL__
  : (typeof __BACKEND_BASE_URL__ !== "undefined" ? __BACKEND_BASE_URL__ : "http://localhost:8000");

export default function ClusterHealthPage({ theme }) {
  const isDark = theme === "dark";

  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [indices, setIndices] = useState([]);
  const [clusterData, setClusterData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchClusterData() {
      try {
        const [nodesRes, indicesRes, clusterRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/v1/core/nodes`),
          fetch(`${API_BASE_URL}/v1/core/indices`),
          fetch(`${API_BASE_URL}/v1/core/cluster_status`),
        ]);

        if (!isMounted) return;

        if (nodesRes.status === "fulfilled" && nodesRes.value.ok) {
          const j = await nodesRes.value.json();
          if (j?.success && Array.isArray(j?.response)) {
            setNodes(j.response);
          }
        }

        if (indicesRes.status === "fulfilled" && indicesRes.value.ok) {
          const j = await indicesRes.value.json();
          if (j?.success && Array.isArray(j?.response)) {
            setIndices(j.response.filter(idx => !String(idx.index || "").startsWith(".")));
          }
        }

        if (clusterRes.status === "fulfilled" && clusterRes.value.ok) {
          const j = await clusterRes.value.json();
          if (j?.success && j?.response) {
            setClusterData(j.response);
          }
        }

        if (isMounted) setIsLoading(false);
      } catch (err) {
        console.error("[ClusterHealth] Fetch error:", err);
        if (isMounted) setIsLoading(false);
      }
    }

    fetchClusterData();
    const interval = setInterval(fetchClusterData, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [API_BASE_URL]);

  function getHealthConfig(statusStr) {
    const s = (statusStr || "").toLowerCase();
    if (s === "green") return { label: "Green", color: "text-emerald-500 dark:text-emerald-400", dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" };
    if (s === "yellow") return { label: "Yellow", color: "text-amber-500 dark:text-amber-400", dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" };
    if (s === "red") return { label: "Red", color: "text-rose-500 dark:text-rose-400", dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" };
    return { label: "Unknown", color: "text-slate-400", dot: "bg-slate-400" };
  }

  const healthCfg = getHealthConfig(clusterData?.status);

  // Format large numbers
  const formatNum = (num) => {
    if (num === undefined || num === null || num === "") return "0";
    const n = parseInt(String(num).replace(/,/g, ""), 10);
    if (isNaN(n)) return "0";
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toLocaleString();
  };

  const totalDocs = indices.reduce((acc, idx) => acc + parseInt(String(idx["docs.count"] || "0").replace(/,/g, ""), 10), 0);
  
  const metaCards = [
    { 
      label: "Cluster Status", 
      value: clusterData?.status ? clusterData.status.charAt(0).toUpperCase() + clusterData.status.slice(1) : (isLoading ? "Loading..." : "Unknown"), 
      sub: clusterData ? "All nodes responding" : "Waiting for connection...", 
      icon: ShieldIcon, 
      valueColor: healthCfg.color, 
      dot: true 
    },
    { 
      label: "Active Shards",  
      value: clusterData?.active_shards !== undefined ? clusterData.active_shards : (isLoading ? "..." : "0"),   
      sub: clusterData?.unassigned_shards !== undefined ? `${clusterData.unassigned_shards} unassigned` : "Fetching shards...",      
      icon: ActivityIcon, 
      valueColor: "text-primary" 
    },
    { 
      label: "Total Docs",     
      value: formatNum(totalDocs),  
      sub: `Across ${indices.length} indices`,  
      icon: DatabaseIcon, 
      valueColor: "text-primary" 
    },
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
            <div key={i} className="metric-card flex flex-col gap-3 bg-surface border-base border shadow-surface-sm">
              <div className="flex items-start justify-between">
                <span className="t-meta text-secondary">{c.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-raised">
                  <Icon className={`w-4 h-4 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                </div>
              </div>
              <div>
                <p className={`flex items-center gap-2 text-2xl font-semibold tracking-tight mb-0.5 ${c.valueColor}`}>
                  {c.dot && <span className={`w-2 h-2 rounded-full ${healthCfg.dot} flex-shrink-0`} />}
                  {c.value}
                </p>
                <p className="text-xs text-secondary">{c.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nodes table */}
      <div className="table-panel mb-6 bg-surface border-base border shadow-surface-sm">
        <div className="table-panel-header">
          <h2 className="table-panel-title text-primary">
            <ServerIcon className="w-4 h-4 text-indigo-400" /> Connected Nodes
          </h2>
          <span className="table-panel-badge">{nodes.length} Active</span>
        </div>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">List of connected Elasticsearch cluster nodes and their resource metrics</caption>
            <thead>
              <tr>
                {["Node Name", "IP Address", "Role", "CPU", "RAM", "Heap", "Status"].map(h => (
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
                    <span className={parseInt(n.cpu || "0") > 70 ? "text-amber-500 font-semibold" : "text-primary"}>{n.cpu ? `${n.cpu}%` : "-"}</span>
                  </td>
                  <td className="font-mono text-xs text-secondary">{n["ram.percent"] ? `${n["ram.percent"]}%` : "-"}</td>
                  <td className="font-mono text-xs text-secondary">{n["heap.percent"] ? `${n["heap.percent"]}%` : "-"}</td>
                  <td>
                    <span className="node-status">
                      <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500`} />
                      Online
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-sm text-secondary">
                    {isLoading ? "Fetching nodes..." : "No nodes found"}
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
              )) : (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-sm text-secondary">
                    {isLoading ? "Fetching indices..." : "No visible indices found"}
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
