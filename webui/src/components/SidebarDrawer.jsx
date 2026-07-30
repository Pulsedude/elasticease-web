import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XIcon,
  HomeIcon,
  TerminalIcon,
  ActivityIcon,
  SettingsIcon,
  ShieldIcon,
  ServerIcon,
} from './Icons';

export default function SidebarDrawer({ isOpen, onClose, activeTab, theme }) {
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const navItems = [
    { id: 'home',     path: '/home',          label: 'Home',                   icon: HomeIcon,     badge: 'Main',        desc: 'Dashboard overview' },
    { id: 'console',  path: '/console',   label: 'Console App',            icon: TerminalIcon, badge: 'Interactive', desc: 'CLI terminal & cluster control' },
    { id: 'cluster',  path: '/cluster',   label: 'Cluster Diagnostics',    icon: ActivityIcon, badge: 'Live',        desc: 'Nodes, shards & indices' },
    { id: 'settings', path: '/settings',  label: 'Backend & Connection',   icon: SettingsIcon, badge: 'API',         desc: 'Configure endpoint & API' },
  ];

  return (
    <div className={`drawer-root ${isOpen ? 'drawer-open' : 'drawer-closed'} fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`drawer-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Panel */}
      <div
        className={`drawer-panel absolute top-0 left-0 bottom-0 w-full max-w-[300px] flex flex-col z-10 border-r shadow-[4px_0_40px_rgba(0,0,0,0.3)] transition-transform duration-300 ${isDark ? 'bg-[#0a0e1e] border-[#1e293b]' : 'bg-white border-[#e2e8f0]'} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header */}
        <div className={`drawer-header px-5 pt-5 pb-4 border-b flex items-center justify-between ${isDark ? 'border-[#1e293b]' : 'border-[#e2e8f0]'}`}>
          <div className="drawer-brand flex items-center gap-2.5">
            <div
              className="w-[34px] h-[34px] rounded-[10px] p-0.5 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            >
              <div className={`w-full h-full rounded-lg flex items-center justify-center ${isDark ? 'bg-[#070b14]' : 'bg-white'}`}>
                <ShieldIcon className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <div>
              <p className="gradient-text font-extrabold text-base leading-none">Élasticease</p>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Navigation</p>
            </div>
          </div>
          <button
            onClick={onClose} type="button"
            className={`p-2 rounded-[10px] flex items-center justify-center transition-all cursor-pointer border-none bg-transparent ${isDark ? 'text-slate-500 hover:bg-slate-800/70 hover:text-slate-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <div className="drawer-nav flex-1 overflow-y-auto p-3">
          <p className={`drawer-menu-label px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Main Menu</p>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); onClose(); }}
                type="button"
                className={`drawer-nav-item w-full flex items-center gap-3 px-3 py-3 rounded-[14px] mb-1 cursor-pointer text-left transition-all border ${
                  active
                    ? isDark ? 'bg-indigo-500/15 border-indigo-500/35' : 'bg-indigo-50 border-indigo-200'
                    : isDark ? 'border-transparent hover:bg-slate-800/70 bg-transparent' : 'border-transparent hover:bg-slate-50 bg-transparent'
                }`}
              >
                <div className={`drawer-nav-icon w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center ${
                  active ? 'bg-indigo-600 shadow-[0_4px_12px_rgba(99,102,241,0.35)]' : isDark ? 'bg-slate-800' : 'bg-slate-100'
                }`}>
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
                <div className="drawer-nav-copy flex-1 min-w-0">
                  <div className="drawer-nav-title-row flex items-center justify-between gap-1.5">
                    <span className={`text-[13px] font-bold truncate ${
                      active ? isDark ? 'text-indigo-300' : 'text-indigo-700' : isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}>{item.label}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                      active ? 'bg-indigo-600 text-white' : isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
                    }`}>{item.badge}</span>
                  </div>
                  <p className={`text-[11px] mt-0.5 truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`drawer-footer p-4 border-t ${isDark ? 'border-[#1e293b]' : 'border-[#e2e8f0]'}`}>
          <div className={`drawer-status-card px-3.5 py-3 rounded-[14px] border ${
            isDark ? 'bg-slate-900/80 border-[#1e293b]' : 'bg-slate-50 border-[#e2e8f0]'
          }`}>
            <div className="drawer-status-row flex items-center justify-between mb-1">
              <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                <ServerIcon className="w-3.5 h-3.5 text-emerald-500" /> Backend Status
              </span>
              <span className="animate-pulse w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            </div>
            <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ready for Python backend API</p>
          </div>
        </div>
      </div>
    </div>
  );
}
