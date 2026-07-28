import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SidebarDrawer from './components/SidebarDrawer';
import LoginModal from './components/LoginModal';
import HomePage from './components/HomePage';
import ConsoleAppPage from './components/ConsoleAppPage';
import ClusterHealthPage from './components/ClusterHealthPage';
import SettingsPage from './components/SettingsPage';

export default function App() {
  // ── Theme ──
  const [theme, setTheme] = useState(() => localStorage.getItem('elasticease_theme') || 'dark');

  // ── User auth ──
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('elasticease_user')); } catch { return null; }
  });

  // ── Navigation ──
  const [activeTab, setActiveTab] = useState('home');

  // ── Drawer ──
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sync theme class on <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Also update CSS variable root for bg-main etc.
    document.documentElement.className = theme === 'dark' ? 'dark' : '';
    localStorage.setItem('elasticease_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('elasticease_user', JSON.stringify(userData));
    setActiveTab('home');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('elasticease_user');
  };

  // ── Colors derived from theme ──
  const isDark   = theme === 'dark';
  const bgMain   = isDark ? '#070b14' : '#f1f5f9';
  const textPri  = isDark ? '#f1f5f9' : '#0f172a';
  const bdrColor = isDark ? '#1e293b' : '#e2e8f0';

  // Login gate
  if (!user) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: bgMain, color: textPri, display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s, color 0.3s' }}>
      {/* Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenDrawer={() => setDrawerOpen(true)}
        activeTab={activeTab}
      />

      {/* Sidebar Drawer */}
      <SidebarDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
      />

      {/* Main content */}
      <main style={{ flex: 1, width: '100%', maxWidth: 1280, margin: '0 auto', padding: 'clamp(16px, 3vw, 36px) clamp(16px, 3vw, 32px)', boxSizing: 'border-box' }}>
        {activeTab === 'home'     && <HomePage     user={user} onNavigateToTab={setActiveTab} theme={theme} />}
        {activeTab === 'console'  && <ConsoleAppPage  theme={theme} />}
        {activeTab === 'cluster'  && <ClusterHealthPage theme={theme} />}
        {activeTab === 'settings' && <SettingsPage     theme={theme} />}
      </main>

      {/* Footer */}
      <footer style={{
        width: '100%', borderTop: `1px solid ${bdrColor}`,
        background: isDark ? 'rgba(10,14,30,0.7)' : 'rgba(248,250,252,0.8)',
        padding: '18px clamp(16px, 3vw, 32px)',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        fontSize: 12, color: isDark ? '#475569' : '#94a3b8',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: isDark ? '#64748b' : '#475569' }}>Élasticease Platform</span>
          <span>&bull;</span>
          <span>Frontend Interface v1.0.0</span>
        </div>
        <p style={{ fontSize: 11 }}>
          Connected &amp; Ready for Python Backend API Integration
        </p>
      </footer>
    </div>
  );
}
