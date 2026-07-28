import React, { useState } from 'react';
import { SettingsIcon, ServerIcon, CheckIcon } from './Icons';

export default function SettingsPage({ theme }) {
  const isDark = theme === 'dark';
  const textPri  = isDark ? '#f1f5f9' : '#0f172a';
  const textSec  = isDark ? '#94a3b8' : '#475569';
  const textMuted= isDark ? '#64748b' : '#94a3b8';
  const cardBg   = isDark ? '#0f1629' : '#fff';
  const cardBdr  = isDark ? '#1e293b' : '#e2e8f0';
  const inputBg  = isDark ? '#070b14' : '#f8fafc';
  const shadow   = isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)';

  const [backendUrl, setBackendUrl] = useState('http://localhost:8000/api');
  const [esHost, setEsHost] = useState('http://localhost:9200');
  const [saved, setSaved] = useState(false);

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    background: inputBg, border: `1px solid ${cardBdr}`,
    borderRadius: 12, color: textPri,
    fontFamily: 'monospace', fontSize: 13, outline: 'none',
    transition: 'border 0.2s',
  };

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${cardBdr}`, paddingBottom: 20, marginBottom: 28 }}>
        <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: textPri, letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <SettingsIcon className="w-7 h-7" style={{ color: '#6366f1' }} /> Backend Connection Settings
        </h1>
        <p style={{ fontSize: 14, color: textSec, lineHeight: 1.65 }}>
          Configure how the frontend communicates with your Python backend (<code style={{ fontSize: 12, background: isDark ? '#1e293b' : '#f1f5f9', padding: '1px 6px', borderRadius: 4, color: '#818cf8' }}>run.py</code> & API runner).
        </p>
      </div>

      {/* Success banner */}
      {saved && (
        <div style={{
          marginBottom: 20, padding: '14px 18px', borderRadius: 14,
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          color: '#34d399', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckIcon className="w-4 h-4" style={{ color: '#10b981', flexShrink: 0 }} />
          Settings saved! Ready for backend API integration.
        </div>
      )}

      {/* Form card */}
      <div style={{ background: cardBg, border: `1px solid ${cardBdr}`, borderRadius: 20, padding: 'clamp(22px, 4vw, 36px)', boxShadow: shadow }}>
        <form onSubmit={handleSave}>
          {/* Backend URL */}
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>Python Backend API Base Endpoint</label>
            <input
              type="text" value={backendUrl} onChange={e => setBackendUrl(e.target.value)}
              style={inputStyle} required
              onFocus={e => e.currentTarget.style.border = '1px solid #6366f1'}
              onBlur={e => e.currentTarget.style.border = `1px solid ${cardBdr}`}
            />
            <p style={{ fontSize: 11, color: textMuted, marginTop: 6 }}>
              Points to your Python server configured in <code style={{ fontSize: 11, background: isDark ? '#1e293b' : '#f1f5f9', padding: '1px 5px', borderRadius: 4, color: '#818cf8' }}>config.yaml</code>.
            </p>
          </div>

          {/* ES Host */}
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>Elasticsearch Node URL</label>
            <input
              type="text" value={esHost} onChange={e => setEsHost(e.target.value)}
              style={inputStyle} required
              onFocus={e => e.currentTarget.style.border = '1px solid #6366f1'}
              onBlur={e => e.currentTarget.style.border = `1px solid ${cardBdr}`}
            />
            <p style={{ fontSize: 11, color: textMuted, marginTop: 6 }}>
              Direct Elasticsearch REST API endpoint for the Console App.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit"
              style={{
                padding: '12px 28px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(99,102,241,0.3)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(99,102,241,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.3)'; }}
            >
              Save Connection Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
