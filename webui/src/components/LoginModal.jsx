import { useState } from "react";
import loginBgBanner from "../assets/login_bg_banner.png";
import logo from "../assets/logo.png";
import {
  LockIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
  ChevronRightIcon,
} from "./Icons";

export default function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Get backend config from Vite define (set in vite.config.js from config.yaml)
  const BACKEND_HOST = typeof __BACKEND_HOST__ !== 'undefined' ? __BACKEND_HOST__ : '127.0.0.1';
  const BACKEND_PORT = typeof __BACKEND_PORT__ !== 'undefined' ? __BACKEND_PORT__ : '8000';
  const API_BASE_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    // Client-side validation
    if (!username.trim()) {
      setErrorMsg("Please enter your username.");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Calling auth API:", `${API_BASE_URL}/v1/core/auth`);
      console.log("Sending credentials:", { username: username.trim(), password: "***" });
      
      // Call backend auth API with POST and credentials
      const response = await fetch(`${API_BASE_URL}/v1/core/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok && data.success === true) {
        console.log("Login SUCCESS - redirecting");
        // Success: Elasticsearch is running and credentials are correct
        onLoginSuccess({
          name: username.trim(),
          role: "Cluster Administrator",
          email: `${username.trim().toLowerCase().replace(/\s+/g, "")}@elasticease.io`,
          metadata: data.response || {},
        });
      } else if (response.status === 401) {
        console.log("Login FAILED - 401 Unauthorized");
        // Wrong credentials
        setErrorMsg("Invalid username or password. Please check your Elasticsearch credentials.");
      } else if (response.status === 500) {
        console.log("Login FAILED - 500 Server Error");
        // Elasticsearch is not accessible
        const errorDetail = data.detail?.error || "Unknown error";
        setErrorMsg(`Cannot connect to Elasticsearch cluster. Please check if Elasticsearch is running. Error: ${errorDetail}`);
      } else {
        console.log("Login FAILED - Unexpected response");
        // Other errors or unexpected response
        setErrorMsg(`Authentication failed: ${data.detail?.error || "Unexpected response from server"}`);
      }
    } catch (error) {
      console.log("Login FAILED - Network error:", error);
      // Network error or backend not running
      setErrorMsg(`Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend is running.`);
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100dvh",      /* dynamic viewport height — respects mobile browser UI */
    minHeight: "100vh",    /* fallback for browsers without dvh support */
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflowY: "auto",     /* allows scrolling if card is taller than viewport (landscape mobile) */
    overflowX: "hidden",
    backgroundColor: "#000",
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    zIndex: "9999",
  };

  const backgroundStyle = {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    zIndex: "0",
    backgroundColor: "#0f172a",
    backgroundImage: `url(${loginBgBanner})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  const overlayStyle = {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    zIndex: "1",
    backgroundColor: "rgba(0,0,0,0.82)",
  };

  const glowOrb1Style = {
    position: "absolute",
    top: "15%",
    left: "10%",
    width: "420px",
    height: "420px",
    borderRadius: "50%",
    zIndex: "2",
    pointerEvents: "none",
    background:
      "radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)",
    animation: "pulseGlow 7s ease-in-out infinite",
  };

  const glowOrb2Style = {
    position: "absolute",
    bottom: "10%",
    right: "8%",
    width: "380px",
    height: "380px",
    borderRadius: "50%",
    zIndex: "2",
    pointerEvents: "none",
    background:
      "radial-gradient(circle, rgba(168,85,247,0.16), transparent 70%)",
    animation: "pulseGlow 7s ease-in-out infinite",
    animationDelay: "-3.5s",
  };

  const cardContainerStyle = {
    position: "relative",
    zIndex: "10",
    width: "100%",
    maxWidth: "440px",
    padding: "0 20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  const cardStyle = {
    borderRadius: "24px",
    padding: "40px 36px",
    background: "rgba(5,5,8,0.95)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(42,42,58,0.9)",
    boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
    width: "100%",
    maxWidth: "440px",
  };

  const logoContainerStyle = {
    width: "clamp(96px, 25vw, 132px)",
    height: "clamp(96px, 25vw, 132px)",
    borderRadius: "100px",
    margin: "0 auto 8px",
    padding: "2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const logoInnerStyle = {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    borderRadius: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  };

  const logoImageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    transform: "scale(2.25)",
    transformOrigin: "center",
  };

  const titleStyle = {
    fontSize: "28px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
    marginBottom: "6px",
    display: "inline-block",
    fontFamily: '"Open Sans", sans-serif',
    background: "linear-gradient(135deg, #1f09e0, #095fe0, #09b5e0)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  const subtitleStyle = {
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: "1.6",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px 12px 40px",
    borderRadius: "12px",
    fontSize: "13px",
    color: "#f8fafc",
    outline: "none",
    transition: "border 0.2s",
    background: "rgba(15,23,42,0.7)",
    border: "1px solid rgba(42,42,58,0.9)",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    color: "white",
    fontWeight: "bold",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "opacity 0.2s, transform 0.2s",
    background: "linear-gradient(135deg, #0a97c2, #0a59c2)",
    cursor: isLoading ? "not-allowed" : "pointer",
    opacity: isLoading ? 0.75 : 1,
    boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
    boxSizing: "border-box",
  };

  return (
    <div style={containerStyle}>
      {/* Add keyframe animations and responsive styles */}
      <style>{`
        /* Responsive adjustments for login card */
        @media (max-width: 480px) {
          .login-card {
            padding: 28px 20px !important;
            margin: 16px !important;
            border-radius: 16px !important;
          }
          .login-title {
            font-size: 22px !important;
          }
          .glow-orb {
            display: none !important;
          }
        }

        /* Landscape mobile — ensure card is scrollable */
        @media (max-height: 600px) and (orientation: landscape) {
          .login-card {
            padding: 20px 24px !important;
          }
        }

        @media (max-width: 768px) {
          .glow-orb-1 {
            width: 240px !important;
            height: 240px !important;
          }
          .glow-orb-2 {
            width: 200px !important;
            height: 200px !important;
          }
        }
      `}</style>

      {/* Background image */}
      <div style={backgroundStyle} />

      {/* Dark overlay */}
      <div style={overlayStyle} />

      {/* Glow orb top-left */}
      <div className="glow-orb glow-orb-1" style={glowOrb1Style} />

      {/* Glow orb bottom-right */}
      <div className="glow-orb glow-orb-2" style={glowOrb2Style} />

      {/* Card container */}
      <div style={cardContainerStyle}>
        <div className="login-card" style={cardStyle}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            {/* Logo  */}
            <div style={logoContainerStyle}>
              <div style={logoInnerStyle}>
                <img
                  src={logo}
                  alt="Logo"
                  style={logoImageStyle}
                />
              </div>
            </div>
            <h1 className="login-title" style={titleStyle}>
              elasticease
            </h1>
            <p style={subtitleStyle}>
              Sign in to manage your Elasticsearch cluster
            </p>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                marginBottom: "20px",
                padding: "12px 16px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "#fca5a5",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.35)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                  display: "inline-block",
                  flexShrink: "0",
                }}
              />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username field */}
            <div style={{ marginBottom: "16px" }}>
              <label
                htmlFor="login-username-input"
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "8px",
                }}
              >
                USERNAME
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b",
                    pointerEvents: "none",
                  }}
                >
                  <UserIcon style={{ width: "16px", height: "16px" }} />
                </span>
                <input
                  id="login-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  style={inputStyle}
                  autoComplete="username"
                  onFocus={(e) =>
                    (e.currentTarget.style.border = "1px solid #6366f1")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border =
                      "1px solid rgba(42,42,58,0.9)")
                  }
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label
                  htmlFor="login-password-input"
                  style={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  PASSWORD
                </label>
              </div>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b",
                    pointerEvents: "none",
                  }}
                >
                  <LockIcon style={{ width: "16px", height: "16px" }} />
                </span>
                <input
                  id="login-password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ ...inputStyle, paddingRight: "44px" }}
                  autoComplete="current-password"
                  onFocus={(e) =>
                    (e.currentTarget.style.border = "1px solid #6366f1")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border =
                      "1px solid rgba(42,42,58,0.9)")
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: "0",
                  }}
                >
                  {showPassword ? (
                    <EyeOffIcon style={{ width: "16px", height: "16px" }} />
                  ) : (
                    <EyeIcon style={{ width: "16px", height: "16px" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isLoading}
              style={buttonStyle}
              aria-label={isLoading ? "Signing in..." : "Sign In"}
              onMouseEnter={(e) => {
                if (!isLoading)
                  e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {isLoading ? (
                <span
                  className="animate-spin"
                  style={{
                    display: "inline-block",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: "2.5px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                  }}
                />
              ) : (
                <>
                  <span>Sign In</span>
                  <ChevronRightIcon style={{ width: "16px", height: "16px" }} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p
            style={{
              textAlign: "center",
              marginTop: "28px",
              color: "#475569",
              fontSize: "11px",
            }}
          >
            elasticease Core Platform &bull; v0.1.0
          </p>
        </div>
      </div>
    </div>
  );
}
