import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import SidebarDrawer from "./components/SidebarDrawer";
import LoginModal from "./components/LoginModal";
import HomePage from "./components/HomePage";
import ConsoleAppPage from "./components/ConsoleAppPage";
import ClusterHealthPage from "./components/ClusterHealthPage";
import SettingsPage from "./components/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFoundPage from "./components/NotFoundPage";

const API_BASE_URL = typeof __API_BASE_URL__ !== "undefined"
  ? __API_BASE_URL__
  : (typeof __BACKEND_BASE_URL__ !== "undefined" ? __BACKEND_BASE_URL__ : "http://localhost:8000");

const AUTH_USER_KEY = "elasticease_session_user";
const AUTH_BOOT_KEY = "elasticease_frontend_boot_id";
const FRONTEND_BOOT_ID = typeof __FRONTEND_BOOT_ID__ !== "undefined"
  ? __FRONTEND_BOOT_ID__
  : "static-frontend-session";

function readSessionUser() {
  const storedBootId = sessionStorage.getItem(AUTH_BOOT_KEY);
  if (storedBootId !== FRONTEND_BOOT_ID) {
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.setItem(AUTH_BOOT_KEY, FRONTEND_BOOT_ID);
    return null;
  }
  try { return JSON.parse(sessionStorage.getItem(AUTH_USER_KEY)); }
  catch { sessionStorage.removeItem(AUTH_USER_KEY); return null; }
}

function getPageContentClass(pathname) {
  if (pathname === "/console")  return "page-content--console";
  if (pathname === "/settings") return "page-content--narrow";
  if (pathname === "/cluster")  return "page-content--wide";
  return "page-content";
}

function AppContent() {
  const [theme, setTheme] = useState(() => localStorage.getItem("elasticease_theme") || "dark");
  const [user, setUser]   = useState(readSessionUser);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clusterHealth, setClusterHealth] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.className = theme === "dark" ? "dark" : "";
    localStorage.setItem("elasticease_theme", theme);
  }, [theme]);

  // Poll cluster health for the Navbar status row
  useEffect(() => {
    if (!user) return;
    let active = true;
    async function fetchHealth() {
      try {
        const res = await fetch(`${API_BASE_URL}/v1/core/cluster_status`);
        if (!res.ok) return;
        const j = await res.json();
        if (active && j?.success && j?.response) setClusterHealth(j.response);
      } catch { /* silent — Navbar shows last known state */ }
    }
    fetchHealth();
    const id = setInterval(fetchHealth, 15_000);
    return () => { active = false; clearInterval(id); };
  }, [user]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    sessionStorage.setItem(AUTH_BOOT_KEY, FRONTEND_BOOT_ID);
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    navigate("/home");
  };

  const handleLogout = () => {
    setUser(null);
    setClusterHealth(null);
    sessionStorage.removeItem(AUTH_USER_KEY);
    navigate("/login");
  };

  const isDark    = theme === "dark";
  const showShell = location.pathname !== "/login" && Boolean(user);

  let activeTab = "home";
  if (location.pathname === "/console")  activeTab = "console";
  else if (location.pathname === "/cluster")  activeTab = "cluster";
  else if (location.pathname === "/settings") activeTab = "settings";

  const contentClass = showShell ? getPageContentClass(location.pathname) : "";

  return (
    <div className="app-shell bg-base-surface text-primary">

      {showShell && (
        <>
          <Navbar
            user={user}
            onLogout={handleLogout}
            theme={theme}
            toggleTheme={toggleTheme}
            onOpenDrawer={() => setDrawerOpen(true)}
            activeTab={activeTab}
            clusterHealth={clusterHealth}
          />
          <SidebarDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            activeTab={activeTab}
            theme={theme}
          />
        </>
      )}

      <main className="app-main">
        {showShell ? (
          <div className={contentClass}>
            <Routes>
              <Route path="/home" element={
                <ProtectedRoute user={user}>
                  <HomePage user={user} onNavigateToTab={(tab) => navigate(tab === "home" ? "/home" : `/${tab}`)} theme={theme} />
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
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginModal onLoginSuccess={handleLoginSuccess} />} />
            <Route path="*" element={user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />} />
          </Routes>
        )}
      </main>

      {showShell && (
        <footer className="app-footer">
          <div className="footer-left">
            <span className={`font-semibold text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Elasticease Platform</span>
            <span className={isDark ? "text-slate-700" : "text-slate-300"}>·</span>
            <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>v1.0.0</span>
          </div>
          <span className={`text-[11px] flex items-center gap-1.5 ${isDark ? "text-slate-700" : "text-slate-400"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Connected
          </span>
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
