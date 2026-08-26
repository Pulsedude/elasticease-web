import React, { useState } from "react";
import { SettingsIcon, CheckIcon, ServerIcon } from "./Icons";

export default function SettingsPage({ theme }) {
  const isDark = theme === "dark";
  const [backendUrl, setBackendUrl] = useState("http://localhost:8000/api");
  const [esHost,     setEsHost]     = useState("http://localhost:9200");
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="settings-page">
      <div className="page-heading">
        <h1 className="flex items-center gap-2.5">
          <SettingsIcon className={`w-6 h-6 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
          Connection Settings
        </h1>
        <p>Configure how the frontend communicates with your Python backend (<code className={`text-xs px-1.5 py-0.5 rounded font-mono ${
          isDark ? "bg-[#1e2130] text-indigo-300" : "bg-slate-100 text-indigo-700"
        }`}>run.py</code>) and Elasticsearch cluster.</p>
      </div>

      {saved && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 px-4 py-3 rounded-xl flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 text-[13px] font-medium bg-emerald-500/10 border border-emerald-500/20 fade-up"
        >
          <CheckIcon className="w-4 h-4 flex-shrink-0" />
          Settings saved successfully.
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
              onChange={e => setBackendUrl(e.target.value)}
              placeholder="http://localhost:8000/api"
              className="bg-base-surface text-primary border-base focus:border-indigo-500"
              required
            />
            <p>Points to your Python server configured in <code className={`text-[11px] px-1 py-0.5 rounded font-mono ${isDark ? "bg-[#1e2130] text-indigo-300" : "bg-slate-100 text-indigo-700"}`}>config.yaml</code>.</p>
          </div>

          <div className="settings-field">
            <label htmlFor="es-host-input">Elasticsearch Node URL</label>
            <input
              id="es-host-input"
              type="url"
              value={esHost}
              onChange={e => setEsHost(e.target.value)}
              placeholder="http://localhost:9200"
              className="bg-base-surface text-primary border-base focus:border-indigo-500"
              required
            />
            <p>Direct Elasticsearch REST API endpoint used by the Console.</p>
          </div>

          <div className="settings-actions">
            <button
              type="submit"
              className="bg-accent hover:bg-accent-hover text-white transition-colors font-semibold cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
