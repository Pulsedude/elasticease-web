import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  XIcon, HomeIcon, TerminalIcon, ActivityIcon, SettingsIcon, ShieldIcon, ServerIcon,
} from "./Icons";

export default function SidebarDrawer({ isOpen, onClose, activeTab, theme }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const navItems = [
    { id: "home",     path: "/home",     label: "Overview",            icon: HomeIcon,     desc: "Dashboard & metrics" },
    { id: "console",  path: "/console",  label: "Console",             icon: TerminalIcon, desc: "CLI terminal & commands" },
    { id: "cluster",  path: "/cluster",  label: "Cluster Diagnostics", icon: ActivityIcon, desc: "Nodes, shards & indices" },
    { id: "settings", path: "/settings", label: "Settings",            icon: SettingsIcon, desc: "Configure endpoints" },
  ];

  return (
    <div
      className={`drawer-root ${isOpen ? "drawer-open" : ""} fixed inset-0 z-50`}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation drawer"
    >
      <div onClick={onClose} className="drawer-backdrop absolute inset-0" />

      <div className={`drawer-panel ${isDark ? "bg-[#0c0c10] border-[#1e2130]" : "bg-white border-slate-200"}`}>

        {/* Header */}
        <div className={`drawer-header ${isDark ? "border-[#1e2130]" : "border-slate-200"}`}>
          <div className="drawer-brand">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: "0 0 0 1px rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.1)" }}>
              <ShieldIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="gradient-text font-bold text-[14px] leading-none">elasticease</p>
              <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>Navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close navigation drawer"
            className={`w-7 h-7 flex items-center justify-center rounded-lg border-none bg-transparent cursor-pointer transition-colors ${
              isDark ? "text-slate-500 hover:bg-[#1e2130] hover:text-slate-200" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <div className="drawer-nav">
          <p className="drawer-menu-label">Main</p>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); onClose(); }}
                type="button"
                aria-current={active ? "page" : undefined}
                className={`drawer-nav-item ${
                  active
                    ? isDark ? "bg-indigo-500/10 border-indigo-500/30" : "bg-indigo-50 border-indigo-200"
                    : isDark ? "hover:bg-[#1e2130]" : "hover:bg-slate-50"
                }`}
              >
                <div className={`drawer-nav-icon ${
                  active ? "bg-indigo-600" : isDark ? "bg-[#1e2130]" : "bg-slate-100"
                }`}>
                  <Icon className={`w-4 h-4 ${active ? "text-white" : isDark ? "text-slate-400" : "text-slate-500"}`} />
                </div>
                <div className="drawer-nav-copy">
                  <div className="drawer-nav-title-row">
                    <span className={active ? isDark ? "text-indigo-300" : "text-indigo-700" : isDark ? "text-slate-100" : "text-slate-900"}>
                      {item.label}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`drawer-footer ${isDark ? "border-[#1e2130]" : "border-slate-200"}`}>
          <div className={`drawer-status-card ${isDark ? "bg-[#0c0c10] border-[#1e2130]" : "bg-slate-50 border-slate-200"}`}>
            <div className="drawer-status-row">
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                <ServerIcon className="w-3.5 h-3.5 text-emerald-500" /> Backend
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className={`text-[11px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>Python API connected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
