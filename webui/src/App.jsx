import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import SidebarDrawer from "./components/SidebarDrawer";
import LoginModal from "./components/LoginModal";
import HomePage from "./components/HomePage";
import ConsoleAppPage from "./components/ConsoleAppPage";
import ClusterHealthPage from "./components/ClusterHealthPage";
import CommandsGuidePage from "./components/CommandsGuidePage";
import SettingsPage from "./components/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFoundPage from "./components/NotFoundPage";
import { GithubIcon } from "./components/Icons";
import { API_BASE_URL, createEventSource } from "./api/client.js";

const AUTH_USER_KEY  = "elasticease_session_user";
const AUTH_BOOT_KEY  = "elasticease_frontend_boot_id";
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

/**
 * Map each route to its content-wrapper class.
 * Console gets a special class that strips padding and makes it
 * fill the remaining height so the history area scrolls internally.
 */
function getPageContentClass(pathname) {
  if (pathname === "/console")  return "page-content--console";
  if (pathname === "/settings") return "page-content--narrow";
  if (pathname === "/cluster" || pathname === "/commands")  return "page-content--wide";
  if (pathname === "/home")     return "page-content";
  return "page-content--not-found";
}

function AppContent() {
  const [theme,              setTheme]             = useState(() => localStorage.getItem("elasticease_theme") || "dark");
  const [user,               setUser]              = useState(readSessionUser);
  const [drawerOpen,         setDrawerOpen]        = useState(false);
  const [clusterHealth,      setClusterHealth]     = useState(null);
  const [isBackendConnected, setIsBackendConnected]= useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.className = theme === "dark" ? "dark" : "";
    localStorage.setItem("elasticease_theme", theme);
  }, [theme]);

  // Listen to cluster info SSE stream for the Navbar status indicator
  useEffect(() => {
    if (!user) return;
    let active = true;
    let eventSource = null;

    try {
      eventSource = createEventSource(`${API_BASE_URL}/v1/core/cluster_info`);
      eventSource.onopen = () => {
        if (!active) return;
        setIsBackendConnected(true);
      };
      eventSource.onmessage = (event) => {
        if (!active) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload) {
            setIsBackendConnected(true);
            if (payload.success === false) {
              setClusterHealth(null);
              return;
            }
            const clusterStats = (payload.response && typeof payload.response === "object") ? payload.response : payload;
            const status = clusterStats?.status || payload.cluster_health?.status;
            if (status) {
              setClusterHealth({
                status,
                cluster_name: clusterStats?.cluster_name || payload.cluster_health?.cluster_name
              });
            }
          }
        } catch { /* silent */ }
      };
      eventSource.onerror = (err) => {
        if (!active) return;
        setIsBackendConnected(false);
        console.warn("[App] SSE cluster_info connection retry:", err);
      };
    } catch {
      if (active) setIsBackendConnected(false);
    }

    return () => {
      active = false;
      if (eventSource) {
        eventSource.close();
      }
    };
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

  const isDark       = theme === "dark";
  const isConsolePage= location.pathname === "/console";
  const showShell    = location.pathname !== "/login" && Boolean(user);

  let activeTab = "home";
  if (location.pathname === "/console")  activeTab = "console";
  else if (location.pathname === "/cluster")  activeTab = "cluster";
  else if (location.pathname === "/commands") activeTab = "commands";
  else if (location.pathname === "/settings") activeTab = "settings";

  const contentClass = showShell ? getPageContentClass(location.pathname) : "";

  return (
    <div className={`app-shell bg-base-surface text-primary${isConsolePage ? " app-shell--console" : ""}`}>

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
            isBackendConnected={isBackendConnected}
          />
          <SidebarDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            activeTab={activeTab}
            theme={theme}
            isBackendConnected={isBackendConnected}
          />
        </>
      )}

      <main className={`app-main${isConsolePage ? " app-main--console" : ""}`}>
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
              <Route path="/commands" element={
                <ProtectedRoute user={user}>
                  <CommandsGuidePage theme={theme} />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute user={user}>
                  <SettingsPage theme={theme} />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFoundPage theme={theme} user={user} />} />
            </Routes>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginModal onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/home" element={<Navigate to="/login" replace />} />
            <Route path="/console" element={<Navigate to="/login" replace />} />
            <Route path="/cluster" element={<Navigate to="/login" replace />} />
            <Route path="/commands" element={<Navigate to="/login" replace />} />
            <Route path="/settings" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFoundPage theme={theme} user={user} />} />
          </Routes>
        )}
      </main>

      {/* Footer — hidden on console page to maximise vertical space */}
      {showShell && !isConsolePage && (
        <footer className="app-footer">
          <div className="footer-left">
            <span className={`font-semibold text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Elasticease Web</span>
            <span className={isDark ? "text-slate-700" : "text-slate-300"}>·</span>
            <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>v0.1.0</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Pulsedude/elasticease-web"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub Repository"
              aria-label="GitHub Repository"
              className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-colors cursor-pointer bg-transparent ${
                isDark
                  ? "border-[#1e2130] hover:bg-[#1e2130] text-slate-400 hover:text-slate-100"
                  : "border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
              }`}
            >
              <GithubIcon className="w-4 h-4" />
            </a>
            <span className={`text-[11px] flex items-center gap-1.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? "bg-emerald-500" : "bg-rose-500"}`} />
              {isBackendConnected ? "Connected" : "Backend Offline"}
            </span>
          </div>
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