
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import SidebarDrawer from './components/SidebarDrawer';
import LoginModal from './components/LoginModal';
import HomePage from './components/HomePage';
import ConsoleAppPage from './components/ConsoleAppPage';
import ClusterHealthPage from './components/ClusterHealthPage';
import SettingsPage from './components/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import NotFoundPage from './components/NotFoundPage';

// Inner app component to use router hooks
function AppContent() {
  // ── Theme ──
  const [theme, setTheme] = useState(() => localStorage.getItem('elasticease_theme') || 'dark');

  // ── User auth ──
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('elasticease_user')); } catch { return null; }
  });

  // ── Drawer ──
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Sync theme class on <html>
  useEffect(() => {
    document.documentElement.className = theme === 'dark' ? 'dark' : '';
    localStorage.setItem('elasticease_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('elasticease_user', JSON.stringify(userData));
    navigate('/home');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('elasticease_user');
    navigate('/login');
  };

  const isDark = theme === 'dark';

  // Determine active tab from pathname
  let activeTab = 'home';
  if (location.pathname === '/home') activeTab = 'home';
  else if (location.pathname === '/console') activeTab = 'console';
  else if (location.pathname === '/cluster') activeTab = 'cluster';
  else if (location.pathname === '/settings') activeTab = 'settings';

  return (
    <div className={`app-shell min-h-screen w-full flex flex-col transition-colors duration-300 overflow-x-hidden ${isDark ? 'bg-black text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      {/* Conditionally render Navbar and Sidebar if not on login page */}
      {location.pathname !== '/login' && (
        <>
          <Navbar
            user={user}
            onLogout={handleLogout}
            theme={theme}
            toggleTheme={toggleTheme}
            onOpenDrawer={() => setDrawerOpen(true)}
            activeTab={activeTab}
          />
          <SidebarDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            activeTab={activeTab}
            theme={theme}
          />
        </>
      )}

      {/* Main content */}
      <main className={`${location.pathname !== '/login' ? 'app-main flex-1 w-full max-w-[1280px] mx-auto box-border px-4 sm:px-6 md:px-8 py-6 md:py-9' : ''}`}>
        <Routes>
          {/* Login Route: Redirect to / if already logged in */}
          <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginModal onLoginSuccess={handleLoginSuccess} />} />

          {/* Protected Routes */}
          <Route path="/home" element={
            <ProtectedRoute user={user}>
              <HomePage user={user} onNavigateToTab={(tab) => navigate(tab === 'home' ? '/home' : `/${tab}`)} theme={theme} />
            </ProtectedRoute>
          } />
          
          <Route path="/console" element={
            <ProtectedRoute user={user}>
              <ConsoleAppPage theme={theme} />
            </ProtectedRoute>
          } />

          <Route path="/cluster" element={
            <ProtectedRoute user={user}>
              <ClusterHealthPage theme={theme} />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute user={user}>
              <SettingsPage theme={theme} />
            </ProtectedRoute>
          } />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Footer */}
      {location.pathname !== '/login' && (
        <footer className={`app-footer w-full border-t px-4 sm:px-6 md:px-8 py-4 flex flex-wrap items-center justify-between gap-2 text-xs transition-colors duration-300 ${
          isDark
            ? 'border-[#2a2a3a] bg-[rgba(5,5,8,0.7)] text-slate-600'
            : 'border-slate-200 bg-[rgba(248,250,252,0.8)] text-slate-400'
        }`}>
          <div className="footer-left flex items-center gap-2 flex-wrap">
            <span className={`font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Élasticease Platform</span>
            <span>&bull;</span>
            <span>Frontend Interface v1.0.0</span>
          </div>
          <p className="text-[11px] text-center md:text-right w-full md:w-auto">Connected &amp; Ready for Python Backend API Integration</p>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
