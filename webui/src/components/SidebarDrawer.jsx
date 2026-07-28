import React, { useEffect } from 'react';
import {
  XIcon,
  HomeIcon,
  TerminalIcon,
  ActivityIcon,
  SettingsIcon,
  ShieldIcon,
  ServerIcon,
} from './Icons';

export default function SidebarDrawer({ isOpen, onClose, activeTab, setActiveTab, theme }) {
  const isDark = theme === 'dark';

  // Lock scroll on mobile when drawer open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ESC key closes drawer
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const navItems = [
    { id: 'home',     label: 'Home',                   icon: HomeIcon,     badge: 'Main',        desc: 'Dashboard overview' },
    { id: 'console',  label: 'Console App',             icon: TerminalIcon, badge: 'Interactive', desc: 'CLI terminal & cluster control' },
    { id: 'cluster',  label: 'Cluster Diagnostics',     icon: ActivityIcon, badge: 'Live',        desc: 'Nodes, shards & indices' },
    { id: 'settings', label: 'Backend & Connection',    icon: SettingsIcon, badge: 'API',         desc: 'Configure endpoint & API' },
  ];

  const drawerBg   = isDark ? '#0a0e1e' : '#fff';
  const borderCol  = isDark ? '#1e293b' : '#e2e8f0';
  const textPri    = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted  = isDark ? '#64748b' : '#94a3b8';
  const hoverBg    = isDark ? 'rgba(30,41,59,0.7)' : '#f8fafc';
  const activeBg   = isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff';
  const activeBdr  = isDark ? 'rgba(99,102,241,0.35)' : '#c7d2fe';
  const activeText = isDark ? '#a5b4fc' : '#4f46e5';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, pointerEvents: isOpen ? 'auto' : 'none' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Panel */}
      <div
        className="drawer-panel"
        style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: '100%', maxWidth: 300,
          background: drawerBg,
          borderRight: `1px solid ${borderCol}`,
          boxShadow: '4px 0 40px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          zIndex: 10,
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${borderCol}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              padding: 2, flexShrink: 0,
            }}>
              <div style={{
                width: '100%', height: '100%',
                background: isDark ? '#070b14' : '#fff',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldIcon className="w-4 h-4" style={{ color: '#818cf8' }} />
              </div>
            </div>
            <div>
              <p className="gradient-text" style={{ fontWeight: 800, fontSize: 16, lineHeight: 1 }}>Élasticease</p>
              <p style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>Navigation</p>
            </div>
          </div>
          <button
            onClick={onClose} type="button"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 8, borderRadius: 10,
              color: textMuted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = textPri; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = textMuted; }}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          <p style={{ padding: '4px 12px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: textMuted }}>
            Main Menu
          </p>
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); onClose(); }}
                type="button"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 12px', borderRadius: 14, marginBottom: 4,
                  background: active ? activeBg : 'none',
                  border: active ? `1px solid ${activeBdr}` : '1px solid transparent',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.18s, border 0.18s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = hoverBg; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none'; }}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? '#6366f1' : (isDark ? '#1e293b' : '#f1f5f9'),
                  boxShadow: active ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
                }}>
                  <Icon className="w-4 h-4" style={{ color: active ? '#fff' : textMuted }} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: active ? activeText : textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, whiteSpace: 'nowrap',
                      background: active ? '#6366f1' : (isDark ? '#1e293b' : '#f1f5f9'),
                      color: active ? '#fff' : textMuted,
                    }}>
                      {item.badge}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer status */}
        <div style={{ padding: 16, borderTop: `1px solid ${borderCol}` }}>
          <div style={{
            padding: '12px 14px', borderRadius: 14,
            background: isDark ? 'rgba(15,23,42,0.8)' : '#f8fafc',
            border: `1px solid ${borderCol}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: textPri, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ServerIcon className="w-3.5 h-3.5" style={{ color: '#10b981' }} /> Backend Status
              </span>
              <span className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            </div>
            <p style={{ fontSize: 11, color: textMuted }}>Ready for Python backend API</p>
          </div>
        </div>
      </div>
    </div>
  );
}
