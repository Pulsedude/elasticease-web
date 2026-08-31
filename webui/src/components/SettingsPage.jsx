import React, { useState, useEffect } from "react";
import { SettingsIcon, CheckIcon, ServerIcon } from "./Icons";
import BackButton from "./BackButton";

// Configs from config.yaml (injected by vite.config.js)
const API_BASE_URL = typeof __API_BASE_URL__ !== "undefined"
  ? __API_BASE_URL__
  : (typeof __BACKEND_BASE_URL__ !== "undefined" ? __BACKEND_BASE_URL__ : "http://localhost:8000");
const ES_BASE_URL = typeof __ES_BASE_URL__ !== "undefined" ? __ES_BASE_URL__ : "http://localhost:9200";

export default function SettingsPage({ theme }) {
  const isDark = theme === "dark";
  const [backendUrl, setBackendUrl] = useState(API_BASE_URL);
  const [esHost, setEsHost] = useState(ES_BASE_URL);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [saveErrorMsg, setSaveErrorMsg] = useState("");

  // Load current configuration from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadActiveConfig() {
      try {
        const res = await fetch(`${API_BASE_URL}/v1/core/config`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.success) {
            if (data.backend_base_url) {
              setBackendUrl(data.backend_base_url);
            }
            if (data.elastic_base_url) {
              setEsHost(data.elastic_base_url);
            }
          }
        }
      } catch (err) {
        console.warn("[SettingsPage] Could not fetch remote config, using defaults:", err);
      }
    }
    loadActiveConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveSuccessMsg("");
    setSaveErrorMsg("");

    const cleanBackendUrl = backendUrl.trim().replace(/\/+$/, "");
    const cleanEsHost = esHost.trim().replace(/\/+$/, "");

    // Validation
    if (!cleanBackendUrl.startsWith("http://") && !cleanBackendUrl.startsWith("https://")) {
      setSaveErrorMsg("Backend Base URL must start with http:// or https://");
      return;
    }
    if (!cleanEsHost.startsWith("http://") && !cleanEsHost.startsWith("https://")) {
      setSaveErrorMsg("Elasticsearch Node URL must start with http:// or https://");
      return;
    }

    setIsSaving(true);

    try {
      // 1. Update Backend URL in config.yaml
      const backendRes = await fetch(`${API_BASE_URL}/v1/core/update_backend_url`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ base_url: cleanBackendUrl }),
      });
      const backendData = await backendRes.json().catch(() => ({}));

      if (!backendRes.ok || backendData?.success === false) {
        const err = backendData?.detail?.error || backendData?.detail || backendData?.error || "Failed to update Backend URL";
        throw new Error(err);
      }

      // 2. Update Elasticsearch URL in config.yaml
      const esRes = await fetch(`${API_BASE_URL}/v1/core/update_elastic_url`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ base_url: cleanEsHost }),
      });
      const esData = await esRes.json().catch(() => ({}));

      if (!esRes.ok || esData?.success === false) {
        const err = esData?.detail?.error || esData?.detail || esData?.error || "Failed to update Elasticsearch URL";
        throw new Error(err);
      }

      setBackendUrl(cleanBackendUrl);
      setEsHost(cleanEsHost);

      setSaveSuccessMsg("Endpoints updated successfully in config.yaml and active session.");
      setTimeout(() => setSaveSuccessMsg(""), 5000);
    } catch (err) {
      console.error("[SettingsPage] Save error:", err);
      setSaveErrorMsg(err?.message || "An unexpected error occurred while saving endpoints.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-heading">
        <div className="page-heading-nav">
          <BackButton />
        </div>
        <h1 className="flex items-center gap-2.5">
          <SettingsIcon className={`w-6 h-6 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
          Connection Settings
        </h1>
        <p>
          Configure how the frontend communicates with your backend 
          <code
            className={`text-xs px-1.5 py-0.5 rounded font-mono ${
              isDark ? "bg-[#1e2130] text-indigo-300" : "bg-slate-100 text-indigo-700"
            }`}
          >
          </code>
          and Elasticsearch cluster. Changes are saved directly to{" "}
          <code
            className={`text-xs px-1.5 py-0.5 rounded font-mono ${
              isDark ? "bg-[#1e2130] text-indigo-300" : "bg-slate-100 text-indigo-700"
            }`}
          >
            config.yaml
          </code>
          .
        </p>
      </div>

      {saveSuccessMsg && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 px-4 py-3 rounded-xl flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 text-[13px] font-medium bg-emerald-500/10 border border-emerald-500/20 fade-up"
        >
          <CheckIcon className="w-4 h-4 flex-shrink-0" />
          {saveSuccessMsg}
        </div>
      )}

      {saveErrorMsg && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 px-4 py-3 rounded-xl flex items-center gap-2.5 text-rose-600 dark:text-rose-400 text-[13px] font-medium bg-rose-500/10 border border-rose-500/20 fade-up"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
          {saveErrorMsg}
        </div>
      )}

      <div className="settings-card bg-surface border-base border shadow-surface-sm">
        {/* Section label */}
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-base">
          <ServerIcon className={`w-4 h-4 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
          <span className="text-sm font-semibold text-primary">Endpoint Configuration</span>
        </div>

        <form className="settings-form" onSubmit={handleSave}>
          <div className="settings-field">
            <label htmlFor="backend-url-input">Python Backend API Base URL</label>
            <input
              id="backend-url-input"
              type="url"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="bg-base-surface text-primary border-base focus:border-indigo-500"
              required
            />
            <p>
              Points to your Python FastAPI server configured in{" "}
              <code
                className={`text-[11px] px-1 py-0.5 rounded font-mono ${
                  isDark ? "bg-[#1e2130] text-indigo-300" : "bg-slate-100 text-indigo-700"
                }`}
              >
              </code>
            </p>
          </div>

          <div className="settings-field">
            <label htmlFor="es-host-input">Elasticsearch Node URL</label>
            <input
              id="es-host-input"
              type="url"
              value={esHost}
              onChange={(e) => setEsHost(e.target.value)}
              placeholder="http://localhost:9200"
              className="bg-base-surface text-primary border-base focus:border-indigo-500"
              required
            />
            <p>
              Direct Elasticsearch cluster node URL configured in{" "}
              <code
                className={`text-[11px] px-1 py-0.5 rounded font-mono ${
                  isDark ? "bg-[#1e2130] text-indigo-300" : "bg-slate-100 text-indigo-700"
                }`}
              >
              </code>
            </p>
          </div>

          <div className="settings-actions">
            <button
              type="submit"
              disabled={isSaving}
              className={`inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white transition-colors font-semibold ${
                isSaving ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {isSaving ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />
                  <span>Saving Endpoints...</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
