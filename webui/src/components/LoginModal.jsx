import React, { useState } from 'react';
import {
  LockIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
  SunIcon,
  MoonIcon,
  SparklesIcon,
  ShieldIcon,
  ChevronRightIcon
} from './Icons';

export default function LoginModal({ onLoginSuccess, theme, toggleTheme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim()) { setErrorMsg('Please enter your username.'); return; }
    if (!password.trim()) { setErrorMsg('Please enter your password.'); return; }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        name: username.trim(),
        role: 'Cluster Administrator',
        email: `${username.trim().toLowerCase().replace(/\s+/g, '')}@elasticease.io`,
      });
    }, 700);
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({ name: 'admin_user', role: 'Cluster Administrator', email: 'admin@elasticease.io' });
    }, 400);
  };

  return (
    <div
      style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', backgroundColor: '#070b14' }}
    >
      {/* ── Background ── */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/login-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(7,11,20,0.75)', backdropFilter: 'blur(3px)', zIndex: 1 }} />

      {/* Ambient orbs */}
      <div className="animate-glow" style={{ position: 'absolute', top: '15%', left: '10%', width: 420, height: 420, background: 'radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)', borderRadius: '50%', zIndex: 2, pointerEvents: 'none' }} />
      <div className="animate-glow" style={{ position: 'absolute', bottom: '10%', right: '8%', width: 380, height: 380, background: 'radial-gradient(circle, rgba(168,85,247,0.16), transparent 70%)', borderRadius: '50%', zIndex: 2, pointerEvents: 'none', animationDelay: '-3.5s' }} />

      {/* ── Theme toggle top-right ── */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 20 }}>
        <button
          onClick={toggleTheme}
          type="button"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 999,
            background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(100,116,139,0.4)',
            color: '#cbd5e1', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            backdropFilter: 'blur(8px)', transition: 'all 0.2s',
          }}
        >
          {theme === 'dark'
            ? <><SunIcon className="w-4 h-4" style={{ color: '#fbbf24' }} /><span>Light</span></>
            : <><MoonIcon className="w-4 h-4" style={{ color: '#818cf8' }} /><span>Dark</span></>
          }
        </button>
      </div>

      {/* ── Login Card ── */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440, padding: '16px' }}>
        <div style={{
          background: 'rgba(10,14,30,0.88)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(30,41,59,0.9)', borderRadius: 24,
          padding: '40px 36px', boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}>
          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
              padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '100%', height: '100%', background: '#070b14',
                borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
              }}>
                <img src="/elasticease-logo.png" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain' }}
                  onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                />
                <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldIcon className="w-8 h-8" style={{ color: '#818cf8' }} />
                </div>
              </div>
            </div>
            <h1 className="gradient-text" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 8, display: 'inline-block' }}>
              Élasticease
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
              Sign in to manage your Elasticsearch cluster
            </p>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div style={{
              marginBottom: 20, padding: '12px 16px', borderRadius: 12,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
              color: '#fca5a5', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} />
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}>
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  style={{
                    width: '100%', padding: '12px 16px 12px 40px',
                    background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(30,41,59,0.9)',
                    borderRadius: 12, color: '#f1f5f9', fontSize: 13,
                    outline: 'none', transition: 'border 0.2s',
                  }}
                  onFocus={e => e.currentTarget.style.border = '1px solid #6366f1'}
                  onBlur={e => e.currentTarget.style.border = '1px solid rgba(30,41,59,0.9)'}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Password
                </label>
                <button type="button" onClick={() => alert('Contact system admin to reset password.')}
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                  Forgot?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}>
                  <LockIcon className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: '100%', padding: '12px 44px 12px 40px',
                    background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(30,41,59,0.9)',
                    borderRadius: 12, color: '#f1f5f9', fontSize: 13,
                    outline: 'none', transition: 'border 0.2s',
                  }}
                  onFocus={e => e.currentTarget.style.border = '1px solid #6366f1'}
                  onBlur={e => e.currentTarget.style.border = '1px solid rgba(30,41,59,0.9)'}
                  required
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}>
                  {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer', fontSize: 12, color: '#94a3b8', userSelect: 'none' }}>
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: '#6366f1' }} />
              Keep me signed in
            </label>

            {/* Sign In button */}
            <button
              type="submit" disabled={isLoading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: isLoading ? 0.75 : 1,
                boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                transition: 'opacity 0.2s, transform 0.15s',
              }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {isLoading
                ? <span className="animate-spin" style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                : <><span>Sign In</span><ChevronRightIcon className="w-4 h-4" /></>
              }
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(30,41,59,0.9)' }} />
              <span style={{ color: '#475569', fontSize: 11, whiteSpace: 'nowrap' }}>or quick access</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(30,41,59,0.9)' }} />
            </div>

            {/* Demo login */}
            <button
              type="button" onClick={handleDemoLogin}
              style={{
                width: '100%', padding: '12px', borderRadius: 12,
                background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(30,41,59,0.9)',
                color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = '#f1f5f9'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.6)'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <SparklesIcon className="w-4 h-4" style={{ color: '#fbbf24' }} />
              Quick Demo Sign In
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 28, color: '#334155', fontSize: 11 }}>
            Élasticease Core Platform &bull; v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
