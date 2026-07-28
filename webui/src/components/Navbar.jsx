import React, { useState, useRef, useEffect } from 'react';
import {
  MenuIcon,
  SunIcon,
  MoonIcon,
  LogOutIcon,
  ShieldIcon,
  ServerIcon,
  ActivityIcon,
  ChevronRightIcon
} from './Icons';

export default function Navbar({ user, onLogout, theme, toggleTheme, onOpenDrawer }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = theme === 'dark';

  const navStyle = {
    position: 'sticky', top: 0, zIndex: 30, width: '100%',
    background: isDark ? 'rgba(10,14,30,0.92)' : 'rgba(248,250,252,0.92)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    transition: 'background 0.3s ease, border-color 0.3s ease',
  };

  const containerStyle = {
    maxWidth: 1280, margin: '0 auto',
    padding: '0 20px',
    height: 64,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
  };

  const btnBase = {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
  };

  const iconBtnStyle = {
    ...btnBase,
    padding: '8px',
    borderRadius: 12,
    color: isDark ? '#94a3b8' : '#475569',
    background: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(241,245,249,0.8)',
    border: `1px solid ${isDark ? 'rgba(30,41,59,0.8)' : '#e2e8f0'}`,
  };

  const themeBtnStyle = {
    ...btnBase,
    padding: '8px 12px',
    borderRadius: 12,
    background: isDark ? 'rgba(30,41,59,0.8)' : '#fff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    color: isDark ? '#f1f5f9' : '#0f172a',
    gap: 6, fontSize: 12, fontWeight: 600,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  };

  const profileBtnStyle = {
    ...btnBase,
    padding: '6px 10px',
    borderRadius: 12,
    gap: 8,
    background: isDark ? 'rgba(15,23,42,0.9)' : '#fff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  };

  const dropdownStyle = {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: 276,
    background: isDark ? '#0f1629' : '#fff',
    border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    borderRadius: 20, overflow: 'hidden',
    boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.6)' : '0 24px 60px rgba(0,0,0,0.12)',
    zIndex: 50,
  };

  return (
    <header style={navStyle}>
      <div style={containerStyle}>
        {/* LEFT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Menu button */}
          <button onClick={onOpenDrawer} type="button" style={iconBtnStyle} title="Open menu">
            <MenuIcon className="w-5 h-5" />
          </button>

          {/* Logo + brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              padding: 2, flexShrink: 0,
            }}>
              <div style={{
                width: '100%', height: '100%',
                background: isDark ? '#070b14' : '#fff',
                borderRadius: 8, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {!logoError ? (
                  <img src="/elasticease-logo.png" alt="Logo"
                    style={{ width: 22, height: 22, objectFit: 'contain' }}
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <ShieldIcon className="w-5 h-5" style={{ color: '#818cf8' }} />
                )}
              </div>
            </div>
            <span className="gradient-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1 }}>
              Elasticease
            </span>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Theme toggle */}
          <button onClick={toggleTheme} type="button" style={themeBtnStyle} title="Toggle theme">
            {isDark
              ? <><SunIcon className="w-4 h-4" style={{ color: '#fbbf24' }} /><span style={{ display: 'none' }} className="sm-show">Light</span></>
              : <><MoonIcon className="w-4 h-4" style={{ color: '#6366f1' }} /><span style={{ display: 'none' }} className="sm-show">Dark</span></>
            }
          </button>

          {/* Profile dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button onClick={() => setProfileOpen(v => !v)} type="button" style={profileBtnStyle}>
              {/* Avatar */}
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 12,
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </span>
              {/* Online dot */}
              <span className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="dropdown-enter" style={dropdownStyle}>
                {/* User header */}
                <div style={{ padding: '16px', borderBottom: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 16,
                    }}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: isDark ? '#f1f5f9' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.name || 'admin_user'}
                      </p>
                      <p style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.email || 'admin@elasticease.io'}
                      </p>
                      <span style={{
                        display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 999,
                        background: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff',
                        color: isDark ? '#a5b4fc' : '#4f46e5', fontSize: 10, fontWeight: 700,
                        border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : '#c7d2fe'}`,
                      }}>
                        {user?.role || 'Cluster Administrator'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick info */}
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ServerIcon className="w-3.5 h-3.5" style={{ color: '#6366f1' }} /> Connected Node
                    </span>
                    <code style={{ fontSize: 10, background: isDark ? '#1e293b' : '#f1f5f9', color: isDark ? '#94a3b8' : '#0f172a', padding: '2px 6px', borderRadius: 6 }}>
                      localhost:9200
                    </code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: isDark ? '#64748b' : '#94a3b8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ActivityIcon className="w-3.5 h-3.5" style={{ color: '#10b981' }} /> Cluster Health
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#10b981', fontSize: 11 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                      Green
                    </span>
                  </div>
                </div>

                {/* Logout */}
                <div style={{ padding: '8px' }}>
                  <button
                    onClick={() => { setProfileOpen(false); onLogout(); }}
                    type="button"
                    style={{
                      ...btnBase, width: '100%', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: 12,
                      color: '#ef4444', fontSize: 12, fontWeight: 700,
                      background: 'none',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.1)' : 'rgba(254,242,242,1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LogOutIcon className="w-4 h-4" />
                      Sign Out / Logout
                    </span>
                    <ChevronRightIcon className="w-4 h-4" style={{ opacity: 0.6 }} />
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
