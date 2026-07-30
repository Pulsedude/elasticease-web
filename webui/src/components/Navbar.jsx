import { useState, useRef, useEffect } from 'react';
import logo from '../assets/logo.png';
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

  return (
    <header className={`app-header sticky top-0 z-30 w-full backdrop-blur-md border-b transition-all duration-300 ${isDark ? 'bg-[rgba(10,14,30,0.92)] border-[#1e293b]' : 'bg-[rgba(248,250,252,0.92)] border-[#e2e8f0]'}`}>
      <div className="nav-inner max-w-[1280px] mx-auto px-5 h-16 flex items-center justify-between gap-4">
        {/* LEFT */}
        <div className="nav-left flex items-center gap-3">
          <button onClick={onOpenDrawer} type="button" title="Open menu"
            className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${isDark ? 'text-slate-400 bg-slate-800/50 border-slate-700/80 hover:bg-slate-700/60' : 'text-slate-600 bg-slate-100/80 border-slate-200 hover:bg-slate-200/80'}`}>
            <MenuIcon className="w-5 h-5" />
          </button>
          <div className="brand-lockup flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] p-0.5 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <div className={`w-full h-full rounded-[8px] overflow-hidden flex items-center justify-center ${isDark ? 'bg-[#070b14]' : 'bg-white'}`}>
                {!logoError ? (
                  <img src={logo} alt="Logo" className="w-[22px] h-[22px] object-contain" onError={() => setLogoError(true)} />
                ) : (
                  <ShieldIcon className="w-5 h-5 text-[#818cf8]" />
                )}
              </div>
            </div>
            <span className="gradient-text text-lg font-extrabold tracking-tight leading-none">Elasticease</span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="nav-actions flex items-center gap-2.5">
          <button onClick={toggleTheme} type="button" title="Toggle theme"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border shadow-sm transition-all cursor-pointer ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-100 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'}`}>
            {isDark
              ? <SunIcon className="w-4 h-4 text-amber-400" />
              : <MoonIcon className="w-4 h-4 text-indigo-500" />
            }
          </button>

          <div ref={dropdownRef} className="profile-wrapper relative">
            <button onClick={() => setProfileOpen(v => !v)} type="button"
              className={`profile-trigger flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shadow-sm cursor-pointer transition-all ${isDark ? 'bg-slate-900/90 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
              <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-extrabold text-xs" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className={`text-xs font-semibold max-w-[90px] overflow-hidden text-ellipsis whitespace-nowrap ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {user?.name || 'User'}
              </span>
              <span className="animate-pulse w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            </button>

            {profileOpen && (
              <div className={`profile-menu dropdown-enter absolute top-[calc(100%+8px)] right-0 w-[276px] rounded-[20px] overflow-hidden z-50 border ${
                isDark ? 'bg-[#0f1629] border-[#1e293b] shadow-[0_24px_60px_rgba(0,0,0,0.6)]' : 'bg-white border-[#e2e8f0] shadow-[0_24px_60px_rgba(0,0,0,0.12)]'
              }`}>
                <div className={`profile-menu-header p-4 border-b ${isDark ? 'border-[#1e293b]' : 'border-slate-50'}`}>
                  <div className="profile-user-row flex items-center gap-3">
                    <div className="profile-avatar w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-extrabold text-base" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)' }}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div className="profile-copy min-w-0">
                      <p className={`font-bold text-sm truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{user?.name || 'admin_user'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@elasticease.io'}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isDark ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {user?.role || 'Cluster Administrator'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`profile-menu-meta px-4 py-3 border-b ${isDark ? 'border-[#1e293b]' : 'border-slate-50'}`}>
                  <div className={`profile-meta-row flex justify-between items-center text-[11px] mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span className="flex items-center gap-1.5">
                      <ServerIcon className="w-3.5 h-3.5 text-indigo-500" /> Connected Node
                    </span>
                    <code className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-900'}`}>localhost:9200</code>
                  </div>
                  <div className={`profile-meta-row flex justify-between items-center text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span className="flex items-center gap-1.5">
                      <ActivityIcon className="w-3.5 h-3.5 text-emerald-500" /> Cluster Health
                    </span>
                    <span className="flex items-center gap-1 font-bold text-emerald-500">
                      <span className="w-[7px] h-[7px] rounded-full bg-emerald-500 inline-block" /> Green
                    </span>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => { setProfileOpen(false); onLogout(); }}
                    type="button"
                    className={`profile-logout w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-red-500 text-xs font-bold cursor-pointer transition-colors bg-transparent border-none ${
                      isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <LogOutIcon className="w-4 h-4" />
                      Sign Out / Logout
                    </span>
                    <ChevronRightIcon className="w-4 h-4 opacity-60" />
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
