import { useState, useRef, useEffect, useLayoutEffect } from "react";
import logo from "../assets/logo.png";
import {
  MenuIcon, SunIcon, MoonIcon, LogOutIcon,
  ShieldIcon, ServerIcon, ActivityIcon, ChevronRightIcon,
  SparklesIcon, CheckIcon, GithubIcon
} from "./Icons";
import { API_BASE_URL, apiFetch } from "../api/client.js";

// Configs from config.yaml (injected by vite.config.js)
const ES_BASE_URL = typeof __ES_BASE_URL__ !== "undefined" ? __ES_BASE_URL__ : "http://localhost:9200";
const DEFAULT_AI_INFERENCE = typeof __SELECTED_AI_INFERENCE__ !== "undefined" ? __SELECTED_AI_INFERENCE__ : "ollama";
const OLLAMA_MODEL = typeof __OLLAMA_MODEL__ !== "undefined" ? __OLLAMA_MODEL__ : "gpt-oss:120b-cloud";
const LITELLM_MODEL = typeof __LITELLM_MODEL__ !== "undefined" ? __LITELLM_MODEL__ : "gemini/gemini-3-flash-preview";

// Extract just host:port from the full URL (strip protocol + trailing slashes)
function parseEsHost(url) {
  try {
    const u = new URL(url);
    return u.host; // e.g. "127.0.0.1:9200"
  } catch {
    return (url || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function healthLabel(status, isBackendConnected) {
  if (isBackendConnected === false) {
    return { label: "Offline", color: "text-rose-400", dot: "bg-rose-500" };
  }
  const s = (status || "").toLowerCase();
  if (s === "green")  return { label: "Green",   color: "text-emerald-500", dot: "bg-emerald-500" };
  if (s === "yellow") return { label: "Yellow",  color: "text-amber-400",   dot: "bg-amber-400"   };
  if (s === "red")    return { label: "Red",     color: "text-rose-400",    dot: "bg-rose-400"    };
  return                     { label: "Checking…", color: "text-slate-400", dot: "bg-slate-400"   };
}

export default function Navbar({ user, onLogout, theme, toggleTheme, onOpenDrawer, clusterHealth, isBackendConnected }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [selectedAi, setSelectedAi] = useState(() => {
    return localStorage.getItem("elasticease_selected_ai_inference") || DEFAULT_AI_INFERENCE;
  });
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const isDark = theme === "dark";

  const esHost  = parseEsHost(ES_BASE_URL);
  const health  = healthLabel(clusterHealth?.status, isBackendConnected);

  // Compute dropdown position relative to viewport (fixed positioning).
  // This makes the dropdown escape the sticky .app-header stacking context
  // without using negative margins or transforms.
  const updateMenuPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    if (isMobile) return; // mobile positioning handled via CSS media query
    const GAP = 8;
    const MARGIN = 16;
    const menuWidth = 320;
    // Align dropdown right edge with trigger right edge
    let right = Math.max(MARGIN, window.innerWidth - rect.right);
    // Ensure dropdown doesn't go off-screen to the left
    const leftEdge = window.innerWidth - right - menuWidth;
    if (leftEdge < MARGIN) {
      right = window.innerWidth - menuWidth - MARGIN;
    }
    const top = rect.bottom + GAP;
    setMenuPos({ top, right });
  };

  // Sync to backend config.yaml and state
  const handleSelectAi = async (provider) => {
    setSelectedAi(provider);
    localStorage.setItem("elasticease_selected_ai_inference", provider);
    try {
      await apiFetch(`${API_BASE_URL}/v1/core/ai_inference`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
    } catch (err) {
      console.error("[Navbar] Failed to persist AI inference to config.yaml:", err);
    }
  };

  useEffect(() => {
    async function fetchAiConfig() {
      try {
        const res = await apiFetch(`${API_BASE_URL}/v1/core/ai_config`);
        if (res.ok) {
          const j = await res.json();
          if (j?.success && j?.selected_ai_inference) {
            setSelectedAi(j.selected_ai_inference);
            localStorage.setItem("elasticease_selected_ai_inference", j.selected_ai_inference);
          }
        }
      } catch {
        // Fallback to local config
      }
    }
    fetchAiConfig();
  }, []);

  // Position dropdown when opened + on resize/scroll while open.
  useLayoutEffect(() => {
    if (!profileOpen) return;
    updateMenuPosition();
    const onResizeOrScroll = () => updateMenuPosition();
    window.addEventListener("resize", onResizeOrScroll);
    window.addEventListener("scroll", onResizeOrScroll, true);
    return () => {
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileOpen]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setProfileOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setProfileOpen(false);
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  return (
    <header className="app-header">
      <div className="nav-inner">

        {/* LEFT: menu + brand */}
        <div className="nav-left">
          <button
            onClick={onOpenDrawer}
            type="button"
            title="Open navigation menu"
            aria-label="Open navigation menu"
            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer bg-transparent ${isDark ? "border-[#1e2130] hover:bg-[#1e2130] text-slate-400 hover:text-slate-100" : "border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900"}`}
          >
            <MenuIcon className="w-4 h-4" />
          </button>

          <div className="nav-brand-center flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border ${isDark ? "border-[#1e2130]" : "border-slate-200"}`}
                 style={{ boxShadow: "0 0 0 1px rgba(99,102,241,0.25)" }}>
              {!logoError ? (
                <img src={logo} alt="Elasticease Logo" className="brand-logo-img" onError={() => setLogoError(true)} />
              ) : (
                <ShieldIcon className="w-4 h-4 text-indigo-400" />
              )}
            </div>
            <span className="gradient-text font-bold text-xl tracking-tight leading-none">elasticease</span>
          </div>
        </div>

        {/* RIGHT: theme + profile */}
        <div className="nav-actions">
          <a
            href="https://github.com/Pulsedude/elasticease-web"
            target="_blank"
            rel="noopener noreferrer"
            title="View on Github"
            aria-label="GitHub Repository"
            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer bg-transparent ${isDark ? "border-[#1e2130] hover:bg-[#1e2130] text-slate-400 hover:text-slate-100" : "border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900"}`}
          >
            <GithubIcon className="w-5 h-5" />
          </a>

          <button
            onClick={toggleTheme}
            type="button"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors cursor-pointer bg-transparent ${isDark ? "border-[#1e2130] hover:bg-[#1e2130] text-slate-400 hover:text-slate-100" : "border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900"}`}
          >
            {isDark ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4 text-indigo-500" />}
          </button>

          <div ref={dropdownRef} className="profile-wrapper">
            <button
              ref={triggerRef}
              onClick={() => setProfileOpen(v => !v)}
              type="button"
              className="profile-trigger"
              aria-label="User profile and settings"
              aria-expanded={profileOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                   style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <span className={`text-sm font-semibold truncate hidden sm:inline-block ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                {user?.name || "User"}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 inline-block animate-pulse ${health.dot}`} />
            </button>

            {profileOpen && (
              <div
                ref={menuRef}
                className="profile-menu dropdown-enter"
                role="menu"
                style={{
                  position: "fixed",
                  top: `${menuPos.top}px`,
                  right: `${menuPos.right}px`,
                }}
              >
                {/* Profile Header */}
                <div className="profile-menu-header">
                  <div className="flex items-center gap-2.5">
                    <div className="profile-avatar"
                         style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-[13px] truncate leading-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>{user?.name || "admin"}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border leading-none ${isDark ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/25" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                        {user?.role || "Cluster Administrator"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connection Meta */}
                <div className="profile-menu-meta">
                  <div className="profile-meta-row">
                    <span className="flex items-center gap-2 min-w-0">
                      <ServerIcon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span className="truncate">Connected Node</span>
                    </span>
                    <code className={`text-xs font-mono px-2 py-0.5 rounded ${isDark ? "bg-[#1e2130] text-slate-300" : "bg-slate-100 text-slate-700"}`}>
                      {esHost}
                    </code>
                  </div>

                  <div className="profile-meta-row">
                    <span className="flex items-center gap-2">
                      <ActivityIcon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>Cluster Health</span>
                    </span>
                    <span className={`flex items-center gap-1.5 font-semibold text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                      <span className={`w-2 h-2 rounded-full inline-block ${health.dot}`} />
                      {health.label}
                    </span>
                  </div>

                  <div className="profile-meta-row">
                    <span className="flex items-center gap-2">
                      <SparklesIcon className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span>Active AI Inference</span>
                    </span>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded capitalize ${
                      selectedAi === "litellm"
                        ? (isDark ? "bg-purple-500/25 text-purple-200 border border-purple-500/50" : "bg-purple-100 text-purple-800 border border-purple-300")
                        : (isDark ? "bg-emerald-500/25 text-emerald-200 border border-emerald-500/50" : "bg-emerald-100 text-emerald-800 border border-emerald-300")
                    }`}>
                      {selectedAi === "litellm" ? "LiteLLM" : "Ollama"}
                    </span>
                  </div>
                </div>

                {/* AI Inference Selector */}
                <div className={`profile-ai-section ${isDark ? "bg-[#0c0c10]/40" : "bg-slate-50/70"}`}>
                  <div className="flex items-center justify-between mb-1.5 gap-2 min-w-0">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Select AI Inference
                    </span>
                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded flex-shrink-0 leading-none">
                    </span>
                  </div>
                  <div className="profile-ai-grid">
                    <button
                      type="button"
                      onClick={() => handleSelectAi("ollama")}
                      className={`profile-ai-option ${
                        selectedAi === "ollama"
                          ? (isDark ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200" : "bg-emerald-100 border-emerald-400 text-emerald-900")
                          : (isDark ? "text-slate-400" : "text-slate-600")
                      }`}
                    >
                      <span className="profile-ai-option-title">
                        <span>Ollama</span>
                        {selectedAi === "ollama" && <CheckIcon className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                      </span>
                      <span className={`profile-ai-option-model ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {OLLAMA_MODEL}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectAi("litellm")}
                      className={`profile-ai-option ${
                        selectedAi === "litellm"
                          ? (isDark ? "bg-purple-500/20 border-purple-500/50 text-purple-200" : "bg-purple-100 border-purple-400 text-purple-900")
                          : (isDark ? "text-slate-400" : "text-slate-600")
                      }`}
                    >
                      <span className="profile-ai-option-title">
                        <span>LiteLLM</span>
                        {selectedAi === "litellm" && <CheckIcon className="w-3 h-3 text-purple-400 flex-shrink-0" />}
                      </span>
                      <span className={`profile-ai-option-model ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        {LITELLM_MODEL.replace("gemini/", "")}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Sign Out */}
                <div className="profile-signout">
                  <button
                    onClick={() => { setProfileOpen(false); onLogout(); }}
                    type="button"
                    role="menuitem"
                    className={`w-full flex items-center justify-center h-9 px-3 rounded-lg text-[11px] font-semibold cursor-pointer transition-all border ${
                      isDark
                        ? "bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25 hover:border-rose-500/40 hover:text-rose-200"
                        : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:border-rose-300 hover:text-rose-700"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <LogOutIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Sign out</span>
                    </span>
                    <ChevronRightIcon className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
