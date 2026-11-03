import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  TerminalIcon,
  ActivityIcon,
  SettingsIcon,
  CheckIcon,
  CopyIcon,
  ShieldIcon,
} from "./Icons";

export default function NotFoundPage({ theme, user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [copied, setCopied] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Derive theme & auth status cleanly with sensible fallbacks
  const isDark =
    theme === "dark" ||
    (typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"));

  const isAuthenticated = Boolean(
    user ||
      (typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("elasticease_session_user"))
  );

  const handleCopyDiagnostics = () => {
    const diagnosticText = [
      "=== Élasticease Route Diagnostic ===",
      `Path: ${location.pathname || "/"}`,
      `Status: 404 (Route Not Found)`,
      `Timestamp: ${new Date().toISOString()}`,
      `Referrer: ${typeof document !== "undefined" && document.referrer ? document.referrer : "Direct navigation"}`,
      `User Agent: ${typeof navigator !== "undefined" ? navigator.userAgent : "Unknown"}`,
    ].join("\n");

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(diagnosticText)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {});
    }
  };

  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center overflow-hidden py-8 px-4 sm:px-6">
      {/* Background grid pattern */}
      <div className="not-found-grid-bg" />

      {/* Ambient gradient orbs (contained, no overflow) */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[480px] max-w-[85vw] h-[260px] rounded-full pointer-events-none blur-3xl opacity-35 dark:opacity-25"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(99,102,241,0.35), transparent 70%)"
            : "radial-gradient(circle, rgba(79,70,229,0.18), transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[420px] max-w-[80vw] h-[240px] rounded-full pointer-events-none blur-3xl opacity-25 dark:opacity-15"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(168,85,247,0.3), transparent 70%)"
            : "radial-gradient(circle, rgba(168,85,247,0.14), transparent 70%)",
        }}
      />

      <div className="not-found-container">
        {/* Status Badge */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-colors mb-4"
          style={{
            backgroundColor: isDark
              ? "rgba(99, 102, 241, 0.12)"
              : "rgba(79, 70, 229, 0.08)",
            borderColor: isDark
              ? "rgba(99, 102, 241, 0.3)"
              : "rgba(79, 70, 229, 0.22)",
            color: isDark ? "#a5b4fc" : "#4f46e5",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
          <span>HTTP 404 &bull; ROUTE NOT FOUND</span>
        </div>

        {/* Big 404 Number */}
        <div className="relative select-none my-1 flex items-center justify-center">
          <div
            className="absolute w-56 h-28 blur-3xl opacity-30 dark:opacity-40 rounded-full pointer-events-none"
            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
          />
          <h1
            className="font-black tracking-tight leading-none text-center select-none"
            style={{
              fontSize: "clamp(84px, 16vw, 150px)",
              background: isDark
                ? "linear-gradient(180deg, #ffffff 10%, #cbd5e1 60%, #64748b 100%)"
                : "linear-gradient(180deg, #1e1b4b 0%, #4338ca 60%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: isDark
                ? "drop-shadow(0 4px 24px rgba(99, 102, 241, 0.35))"
                : "drop-shadow(0 4px 18px rgba(79, 70, 229, 0.2))",
            }}
          >
            404
          </h1>
        </div>

        {/* Headings */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 text-primary">
          Lost in the <span className="gradient-text">Cluster</span>?
        </h2>

        <p className="text-secondary text-sm sm:text-base leading-relaxed mb-6 max-w-lg mx-auto">
          The requested route{" "}
          <code
            className="px-2 py-0.5 rounded-md font-mono text-xs font-semibold border inline-block max-w-[280px] sm:max-w-xs truncate align-middle mx-1"
            style={{
              backgroundColor: "var(--bg-raised)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
            title={location.pathname}
          >
            {location.pathname || "/"}
          </code>{" "}
          does not exist or has been migrated. Check the address or navigate back to safety.
        </p>

        {/* Primary & Secondary Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md mb-8">
          <button
            onClick={() => navigate(isAuthenticated ? "/home" : "/login")}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white cursor-pointer border-none shadow-lg transition-all duration-150 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 4px 16px rgba(99, 102, 241, 0.35)",
            }}
          >
            {isAuthenticated ? (
              <HomeIcon className="w-4 h-4" />
            ) : (
              <ShieldIcon className="w-4 h-4" />
            )}
            <span>{isAuthenticated ? "Back to Dashboard" : "Go to Login"}</span>
            <ChevronRightIcon className="w-4 h-4 opacity-80" />
          </button>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer border transition-all duration-150 hover:-translate-y-0.5"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Quick Platform Navigation Hub */}
        <div
          className="w-full max-w-xl mx-auto border-t pt-6"
          style={{ borderColor: "var(--border-faint)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider mb-3 text-muted text-center">
            Platform Destinations
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left w-full">
            <button
              onClick={() => navigate("/console")}
              className="not-found-dest-card group"
              type="button"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "rgba(99, 102, 241, 0.12)",
                  color: "#6366f1",
                }}
              >
                <TerminalIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-primary group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                  Console
                </div>
                <div className="text-[11px] text-muted truncate">
                  Queries & tools
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/cluster")}
              className="not-found-dest-card group"
              type="button"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                }}
              >
                <ActivityIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-primary group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                  Cluster
                </div>
                <div className="text-[11px] text-muted truncate">
                  Shards & nodes
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/settings")}
              className="not-found-dest-card group"
              type="button"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "rgba(168, 85, 247, 0.12)",
                  color: "#a855f7",
                }}
              >
                <SettingsIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-primary group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                  Settings
                </div>
                <div className="text-[11px] text-muted truncate">
                  Host & credentials
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Collapsible Diagnostics Section */}
        <div className="mt-6 flex flex-col items-center w-full max-w-xl">
          <button
            type="button"
            onClick={() => setShowDiagnostics((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-secondary cursor-pointer transition-colors"
          >
            <span>
              {showDiagnostics ? "Hide diagnostics" : "Show route diagnostics"}
            </span>
            <ChevronRightIcon
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showDiagnostics ? "rotate-90" : ""
              }`}
            />
          </button>

          {showDiagnostics && (
            <div
              className="w-full mt-3 p-3.5 rounded-xl border text-left text-xs font-mono shadow-sm"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="flex items-center justify-between mb-2 pb-2 border-b"
                style={{ borderColor: "var(--border-faint)" }}
              >
                <span className="font-bold text-muted text-[10px] uppercase tracking-wider">
                  Diagnostic Telemetry
                </span>
                <button
                  type="button"
                  onClick={handleCopyDiagnostics}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] cursor-pointer hover:bg-raised transition-colors border"
                  style={{
                    color: copied ? "var(--green)" : "var(--text-secondary)",
                    borderColor: "var(--border)",
                  }}
                >
                  {copied ? (
                    <CheckIcon className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <CopyIcon className="w-3 h-3" />
                  )}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              <div className="space-y-1 text-muted text-[11px] overflow-x-auto">
                <div>
                  <span className="text-secondary font-semibold">Route Path:</span>{" "}
                  {location.pathname || "/"}
                </div>
                <div>
                  <span className="text-secondary font-semibold">Response:</span>{" "}
                  404 Not Found (ERR_INVALID_ROUTE)
                </div>
                <div>
                  <span className="text-secondary font-semibold">Timestamp:</span>{" "}
                  {new Date().toISOString()}
                </div>
                <div>
                  <span className="text-secondary font-semibold">Referrer:</span>{" "}
                  {typeof document !== "undefined" && document.referrer
                    ? document.referrer
                    : "Direct Navigation"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Platform Version Footer */}
        <p className="mt-6 text-xs text-muted select-none">
          Élasticease Web Platform &bull; v0.1.0
        </p>
      </div>
    </div>
  );
}
