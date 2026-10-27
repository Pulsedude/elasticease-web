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

// Backend API Base URL from Vite config (config.yaml)
const API_BASE_URL = typeof __API_BASE_URL__ !== "undefined"
  ? __API_BASE_URL__
  : (typeof __BACKEND_BASE_URL__ !== "undefined" ? __BACKEND_BASE_URL__ : "http://localhost:8000");

/**
 * Safely extracts human-readable error messages and technical details from API error payloads.
 * Handles FastAPI HTTPException wrappers, detail objects, Elasticsearch root_cause/reason structures,
 * arrays of validation errors, and strings without ever displaying "[object Object]".
 */
function extractErrorDetails(data) {
  if (!data) return { message: "", raw: null };
  if (typeof data === "string") return { message: data.trim(), raw: data };

  let target = data;

  // Handle FastAPI HTTPException standard structure: { detail: ... }
  if (data.detail !== undefined && data.detail !== null) {
    if (typeof data.detail === "string") {
      return { message: data.detail.trim(), raw: data.detail };
    }
    // Handle array of validation errors (e.g. FastAPI 422 Unprocessable Entity)
    if (Array.isArray(data.detail)) {
      const messages = data.detail
        .map((item) => {
          if (typeof item === "string") return item;
          const loc = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : "";
          const msg = item?.msg || "Validation error";
          return loc ? `${loc}: ${msg}` : msg;
        })
        .filter(Boolean)
        .join("; ");
      return { message: messages || "Validation error", raw: data.detail };
    }
    if (typeof data.detail === "object") {
      target = data.detail.error !== undefined ? data.detail.error : data.detail;
    }
  } else if (data.error !== undefined && data.error !== null) {
    target = data.error;
  }

  // If target resolved to a string (e.g. str(e) from connection error or config error)
  if (typeof target === "string") {
    return { message: target.trim(), raw: target };
  }

  if (target && typeof target === "object") {
    // Nested Elasticsearch error wrapper: { error: { root_cause: [...], reason: "...", type: "..." }, status: 401 }
    const nested = target.error && typeof target.error === "object" ? target.error : target;

    // 1. Elasticsearch root_cause is the most diagnostic message
    if (Array.isArray(nested.root_cause) && nested.root_cause.length > 0) {
      const rootReason = nested.root_cause[0]?.reason;
      if (typeof rootReason === "string" && rootReason.trim()) {
        return { message: rootReason.trim(), raw: target };
      }
    }

    // 2. Direct reason field
    if (typeof nested.reason === "string" && nested.reason.trim()) {
      return { message: nested.reason.trim(), raw: target };
    }

    // 3. String error field
    if (typeof target.error === "string" && target.error.trim()) {
      return { message: target.error.trim(), raw: target };
    }

    // 4. Message field
    if (typeof nested.message === "string" && nested.message.trim()) {
      return { message: nested.message.trim(), raw: target };
    }
    if (typeof target.message === "string" && target.message.trim()) {
      return { message: target.message.trim(), raw: target };
    }

    // 5. Response field
    if (typeof target.response === "string" && target.response.trim()) {
      return { message: target.response.trim(), raw: target };
    }
  }

  return { message: "", raw: target };
}

/**
 * Resolves an accurate, human-readable error message according to the response
 * from /v1/core/auth and the underlying Elasticsearch/network status.
 *
 * NOTE: The backend route /v1/core/auth raises HTTPException(status_code=401, detail={"error": ...})
 * on ANY failure returned by coreops.authenticate. Therefore, HTTP 401 status may represent:
 *  1. Elasticsearch connectivity issue (connection refused / timed out / DNS failure)
 *  2. SSL/TLS Certificate validation error
 *  3. Configuration error (missing Elasticsearch base_url or verify_certs in config.yaml)
 *  4. Permission / forbidden error (HTTP 403 from cluster)
 *  5. Invalid credentials / unauthorized (actual 401 from Elasticsearch)
 */
function formatAuthErrorMessage(status, data) {
  const { message, raw } = extractErrorDetails(data);

  // Build a lowercased search corpus combining all available text
  const searchCorpus = [
    typeof message === "string" ? message : "",
    typeof raw === "string" ? raw : "",
    typeof data?.detail === "string" ? data.detail : "",
    typeof data?.error === "string" ? data.error : "",
  ].join(" ").toLowerCase();

  // 1. Connection / unreachable cluster errors (takes precedence even if status is 401)
  if (
    searchCorpus.includes("connection") ||
    searchCorpus.includes("refused") ||
    searchCorpus.includes("actively refused") ||
    searchCorpus.includes("10061") ||
    searchCorpus.includes("111") ||
    searchCorpus.includes("failed to establish a new connection") ||
    searchCorpus.includes("max retries exceeded") ||
    searchCorpus.includes("newconnectionerror") ||
    searchCorpus.includes("connectionerror") ||
    searchCorpus.includes("connecttimeout") ||
    searchCorpus.includes("read timed out") ||
    searchCorpus.includes("timed out") ||
    searchCorpus.includes("nameresolutionerror") ||
    searchCorpus.includes("getaddrinfo failed") ||
    searchCorpus.includes("failed to resolve") ||
    searchCorpus.includes("remote disconnected") ||
    searchCorpus.includes("connection reset")
  ) {
    return "Cannot connect to Elasticsearch cluster. Please check if Elasticsearch is running and accessible at the configured URL.";
  }

  // 2. SSL/TLS Certificate verification errors
  if (
    searchCorpus.includes("certificate verify failed") ||
    searchCorpus.includes("sslcertverificationerror") ||
    searchCorpus.includes("sslerror") ||
    searchCorpus.includes("self-signed certificate") ||
    searchCorpus.includes("certificate_verify_failed")
  ) {
    return "SSL certificate verification failed. Check the verify_certs setting in config.yaml or your Elasticsearch SSL certificates.";
  }

  // 3. Elasticsearch configuration issues (missing URL or verify_certs in config.yaml)
  if (
    searchCorpus.includes("please check the elasticsearch configurations") ||
    searchCorpus.includes("config.yaml") ||
    searchCorpus.includes("failed to read config")
  ) {
    return "Elasticsearch configuration error: please verify your base URL and connection settings in config.yaml.";
  }

  // 4. Access forbidden / insufficient permissions (HTTP 403 or security_exception with unauthorized action)
  if (
    status === 403 ||
    raw?.status === 403 ||
    searchCorpus.includes("forbidden") ||
    searchCorpus.includes("is unauthorized for user") ||
    searchCorpus.includes("action [cluster:monitor/main] is unauthorized")
  ) {
    return "Access denied. Your Elasticsearch account does not have sufficient permissions to access the cluster.";
  }

  // 5. FastAPI Pydantic Validation error (HTTP 422)
  if (status === 422) {
    return message ? `Validation error: ${message}` : "Please provide a valid username and password.";
  }

  // 6. Authentication failure (Invalid username or password)
  if (
    status === 401 ||
    raw?.status === 401 ||
    searchCorpus.includes("unable to authenticate") ||
    searchCorpus.includes("security_exception") ||
    searchCorpus.includes("unauthorized") ||
    searchCorpus.includes("failed to authorize") ||
    searchCorpus.includes("bad credentials") ||
    searchCorpus.includes("invalid credentials")
  ) {
    if (message && message.toLowerCase().includes("unable to authenticate user")) {
      return `Invalid username or password (${message.trim()}).`;
    }
    return "Invalid username or password. Please check your Elasticsearch credentials.";
  }

  // 7. Internal Server Error (500, 502, 503, 504)
  if (status >= 500) {
    if (message) {
      return `Backend server error: ${message}`;
    }
    return "Cannot connect to Elasticsearch cluster due to an internal server error. Please check backend logs.";
  }

  // 8. General fallback
  if (message) {
    return `Authentication failed: ${message}`;
  }

  return "Authentication failed. Please check your credentials and Elasticsearch cluster status.";
}

export default function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMsg("");

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    
    // Client-side validation
    if (!trimmedUsername) {
      setErrorMsg("Please enter your username.");
      return;
    }
    if (!trimmedPassword) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Calling auth API:", `${API_BASE_URL}/v1/core/auth`);
      console.log("Sending credentials:", { username: trimmedUsername, password: "***" });
      
      // Call backend auth API with POST and credentials
      const response = await fetch(`${API_BASE_URL}/v1/core/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password: trimmedPassword,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      let data = null;
      try {
        data = await response.json();
      } catch {
        // Non-JSON response body
      }
      console.log("Response data:", data);

      if (response.ok && data?.success === true) {
        console.log("Login SUCCESS - redirecting");
        // Success: Elasticsearch is running and credentials are correct
        onLoginSuccess({
          name: trimmedUsername,
          role: "Cluster Administrator",
          email: `${trimmedUsername.toLowerCase().replace(/\s+/g, "")}@elasticease.io`,
          clusterInfo: data.response || null,
          metadata: data.response || {},
        });
        return;
      }

      // Handle all failure responses with accurate classification
      const formattedError = formatAuthErrorMessage(response.status, data);
      console.log("Login FAILED -", formattedError);
      setErrorMsg(formattedError);
    } catch (error) {
      console.log("Login FAILED - Network error:", error);
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
    transition: "border 0.2s, opacity 0.2s",
    background: "rgba(15,23,42,0.7)",
    border: "1px solid rgba(42,42,58,0.9)",
    boxSizing: "border-box",
    opacity: isLoading ? 0.65 : 1,
    cursor: isLoading ? "not-allowed" : "text",
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
                padding: "12px 14px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "10px",
                fontSize: "12px",
                lineHeight: "1.5",
                color: "#fca5a5",
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.35)",
                wordBreak: "break-word",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", flex: "1" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#ef4444",
                    display: "inline-block",
                    flexShrink: "0",
                    marginTop: "5px",
                  }}
                />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg("")}
                aria-label="Dismiss error message"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#f87171",
                  cursor: "pointer",
                  fontSize: "16px",
                  lineHeight: "1",
                  padding: "0 2px",
                  flexShrink: "0",
                }}
              >
                &times;
              </button>
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
                  disabled={isLoading}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
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
                  disabled={isLoading}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
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
                  disabled={isLoading}
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
                    cursor: isLoading ? "not-allowed" : "pointer",
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
                <>
                  <span
                    className="animate-spin"
                    style={{
                      display: "inline-block",
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                    }}
                  />
                  <span>Signing in...</span>
                </>
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
