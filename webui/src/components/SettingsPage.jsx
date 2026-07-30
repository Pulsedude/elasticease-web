import React, { useState } from 'react';
import { SettingsIcon, CheckIcon } from './Icons';

export default function SettingsPage({ theme }) {
  const isDark = theme === 'dark';
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000/api');
  const [esHost, setEsHost] = useState('http://localhost:9200');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputClass = `w-full px-4 py-3 font-mono text-[13px] rounded-xl outline-none transition-colors border ${
    isDark
      ? 'bg-black text-slate-100 border-slate-800 focus:border-indigo-500'
      : 'bg-slate-50 text-slate-900 border-slate-200 focus:border-indigo-500'
  }`;

  const labelClass = `block text-[11px] font-bold uppercase tracking-[0.08em] mb-2 ${
    isDark ? 'text-slate-500' : 'text-slate-400'
  }`;

  return (
    <div className="settings-page max-w-[680px]">
      <div className={`section-heading border-b pb-5 mb-7 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <h1 className={`text-2xl md:text-[30px] font-extrabold tracking-tight flex items-center gap-2.5 flex-wrap mb-1.5 ${
          isDark ? 'text-slate-100' : 'text-slate-900'
        }`}>
          <SettingsIcon className="w-7 h-7 text-indigo-500" /> Backend Connection Settings
        </h1>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Configure how the frontend communicates with your Python backend (<code className={`text-xs px-1.5 py-0.5 rounded text-indigo-400 ${
            isDark ? 'bg-slate-800' : 'bg-slate-100'
          }`}>run.py</code> &amp; API runner).
        </p>
      </div>

      {saved && (
        <div className="mb-5 px-4 py-3.5 rounded-[14px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[13px] font-semibold flex items-center gap-2">
          <CheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          Settings saved! Ready for backend API integration.
        </div>
      )}

      <div className={`settings-card rounded-[20px] border ${
        isDark
          ? 'bg-[#0d0d0d] border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
          : 'bg-white border-slate-200 shadow-sm'
      } p-6 md:p-9`}>
        <form className="settings-form" onSubmit={handleSave}>
          <div className="settings-field mb-5">
            <label className={labelClass}>Python Backend API Base Endpoint</label>
            <input
              type="text" value={backendUrl} onChange={e => setBackendUrl(e.target.value)}
              className={inputClass} required
            />
            <p className={`text-[11px] mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Points to your Python server configured in <code className={`text-[11px] px-1 py-0.5 rounded-sm text-indigo-400 ${
                isDark ? 'bg-slate-800' : 'bg-slate-100'
              }`}>config.yaml</code>.
            </p>
          </div>
          <div className="settings-field mb-7">
            <label className={labelClass}>Elasticsearch Node URL</label>
            <input
              type="text" value={esHost} onChange={e => setEsHost(e.target.value)}
              className={inputClass} required
            />
            <p className={`text-[11px] mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Direct Elasticsearch REST API endpoint for the Console App.
            </p>
          </div>
          <div className="settings-actions flex justify-end">
            <button type="submit"
              className="px-7 py-3 rounded-xl text-white font-bold text-[13px] cursor-pointer transition-all hover:-translate-y-0.5 border-none"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}
            >
              Save Connection Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
