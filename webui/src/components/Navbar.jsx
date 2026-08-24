import { useState, useRef, useEffect } from "react";
import logo from "../assets/logo.png";
import {
  MenuIcon, SunIcon, MoonIcon, LogOutIcon,
  ShieldIcon, ServerIcon, ActivityIcon, ChevronRightIcon
} from "./Icons";

// ES host from config.yaml (injected by vite.config.js)
const ES_BASE_URL = typeof __ES_BASE_URL__ !== "undefined" ? __ES_BASE_URL__ : "https://127.0.0.1:9200";

// Extract just host:port from the full URL (strip protocol + trailing slashes)
function parseEsHost(url) {
  try {
    const u = new URL(url);
    return u.host; // e.g. "127.0.0.1:9200"
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function healthLabel(status) {
  const s = (status || "").toLowerCase();
  if (s === "green")  return { label: "Green",   color: "text-emerald-500", dot: "bg-emerald-500" };
  if (s === "yellow") return { label: "Yellow",  color: "text-amber-400",   dot: "bg-amber-400"   };
  if (s === "red")    return { label: "Red",     color: "text-rose-400",    dot: "bg-rose-400"    };
  return                     { label: "Checking…", color: "text-slate-400", dot: "bg-slate-400"   };
}

export default function Navbar({ user, onLogout, theme, toggleTheme, onOpenDrawer, clusterHealth }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const dropdownRef = useRef(null);
  const isDark = theme === "dark";

  const esHost  = parseEsHost(ES_BASE_URL);
  const health  = healthLabel(clusterHealth?.status);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className={`app-header sticky top-0 z-30 w-full transition-colors duration-200 ${
      isDark ? "bg-[rgba(6,6,8,0.97)] border-[#1e2130]" : "bg-[rgba(255,255,255,0.97)] border-[#e2e8f0]"
    }`}>
      <div className="nav-inner">

        {/* LEFT: menu + brand */}
        <div className="nav-left">
          <button
            onClick={onOpenDrawer}
            type="button"
            title="Open navigation menu"
            aria-label="Open navigation menu"
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border cursor-pointer ${
              isDark ? "border-[#1e2130] text-slate-400 hover:bg-[#111116] hover:text-slate-200" : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            <MenuIcon className="w-4 h-4" />
          </button>

          <div className="nav-brand-center flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 ${isDark ? "bg-[#0c0c10]" : "bg-white"}`}
              style={{ boxShadow: "0 0 0 1px rgba(99,102,241,0.25)" }}>
              {!logoError ? (
                <img src={logo} alt="Elasticease Logo" className="brand-logo-img" onError={() => setLogoError(true)} />
              ) : (
                <ShieldIcon className="w-4 h-4 text-indigo-400" />
              )}
            </div>
            <span className="gradient-text font-bold text-[15px] tracking-tight leading-none">elasticease</span>
          </div>
        </div>

        {/* RIGHT: theme + profile */}
        <div className="nav-actions">
          <button
            onClick={toggleTheme}
            type="button"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border cursor-pointer transition-colors ${
              isDark ? "border-[#1e2130] text-slate-400 hover:bg-[#111116] hover:text-slate-200" : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            {isDark ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4 text-indigo-500" />}
          </button>

          <div ref={dropdownRef} className="profile-wrapper">
            <button
              onClick={() => setProfileOpen(v => !v)}
              type="button"
              className="profile-trigger"
              aria-label="User profile and settings"
              aria-expanded={profileOpen}
              aria-haspopup="true"
            >
              <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-[12px]"
                style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <span className={`text-[13px] font-semibold max-w-[100px] truncate hidden xs:inline-block ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                {user?.name || "User"}
              </span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${health.dot} animate-pulse`} />
            </button>

            {profileOpen && (
              <div className={`profile-menu dropdown-enter ${isDark ? "bg-[#0c0c10] border-[#1e2130]" : "bg-white border-slate-200"}`} role="menu">
                <div className="profile-menu-header">
                  <div className="flex items-center gap-3">
                    <div className="profile-avatar" style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}>{user?.name || "admin"}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email || `${(user?.name || "admin").toLowerCase()}@elasticease.io`}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isDark ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/25" : "bg-indigo-50 text-indigo-700 border-indigo-200"
                      }`}>{user?.role || "Cluster Administrator"}</span>
                    </div>
                  </div>
                </div>

                <div className="profile-menu-meta">
                  {/* Connected Node — real ES host from config.yaml */}
                  <div className="profile-meta-row">
                    <span className="flex items-center gap-1.5">
                      <ServerIcon className="w-3.5 h-3.5 text-indigo-400" /> Connected Node
                    </span>
                    <code className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${isDark ? "bg-[#1e2130] text-slate-300" : "bg-slate-100 text-slate-700"}`}>
                      {esHost}
                    </code>
                  </div>

                  {/* Cluster Health — live from API */}
                  <div className="profile-meta-row" style={{ marginBottom: 0 }}>
                    <span className="flex items-center gap-1.5">
                      <ActivityIcon className="w-3.5 h-3.5 text-emerald-500" /> Cluster Health
                    </span>
                    <span className={`flex items-center gap-1 font-semibold text-xs ${health.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${health.dot}`} />
                      {health.label}
                    </span>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => { setProfileOpen(false); onLogout(); }}
                    type="button"
                    role="menuitem"
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-red-500 text-xs font-semibold cursor-pointer transition-colors bg-transparent border-none ${
                      isDark ? "hover:bg-red-500/8" : "hover:bg-red-50"
                    }`}
                  >
                    <span className="flex items-center gap-2"><LogOutIcon className="w-4 h-4" /> Sign out</span>
                    <ChevronRightIcon className="w-3.5 h-3.5 opacity-50" />
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

