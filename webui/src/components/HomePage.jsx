import {
  SparklesIcon, TerminalIcon, DatabaseIcon, CpuIcon,
  ActivityIcon, ServerIcon, ChevronRightIcon, CheckIcon, LayersIcon, ShieldIcon
} from './Icons';
import ConsoleTerminal from './ConsoleTerminal';

export default function HomePage({ user, onNavigateToTab, theme }) {
  const isDark = theme === 'dark';

  const stats = [
    { label: 'Active Nodes',    value: '3 / 3 Online',     sub: '100% operational',      icon: ServerIcon,   color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Managed Indices', value: '24 Indices',        sub: '6.3M total docs',       icon: DatabaseIcon, color: 'text-indigo-500',  bg: 'bg-indigo-500/10' },
    { label: 'Query Latency',   value: '1.2 ms avg',        sub: 'Sub-ms peak response',  icon: ActivityIcon, color: 'text-purple-500',  bg: 'bg-purple-500/10' },
    { label: 'Cluster Health',  value: 'Green',             sub: '0 unassigned shards',   icon: ShieldIcon,   color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  const features = [
    { title: 'Interactive CLI Terminal',         desc: 'Execute native ES REST queries (GET/POST/PUT/DELETE) with formatted JSON responses and syntax highlighting.',              icon: TerminalIcon },
    { title: 'Real-Time Health Telemetry',       desc: 'Monitor node CPU, heap memory, GC events, and shard distribution across your entire Elasticsearch cluster.',             icon: ActivityIcon },
    { title: 'Automated Index Orchestration',    desc: 'Create, reindex, alias, and update mapping schemas with built-in validation before any destructive mutations.',          icon: LayersIcon   },
    { title: 'Python Backend Integration Ready', desc: 'Fully wired to your run.py backend service — async requests, API proxying, and secure cluster authentication.',          icon: CpuIcon      },
  ];

  return (
    <div className="page-stack">
      {/* HERO */}
      <div className={`hero-panel relative overflow-hidden rounded-[24px] border mb-7 ${
        isDark
          ? 'bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
          : 'bg-gradient-to-br from-indigo-500/7 via-purple-500/4 to-transparent border-slate-200 shadow-sm'
      } p-7 md:p-12`}>
        <div className="absolute -top-14 -right-14 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)' }} />
        <div className="hero-content relative max-w-[680px]">
          <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full mb-5 text-xs font-bold border ${
            isDark ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          }`}>
            <SparklesIcon className="w-3.5 h-3.5 text-yellow-400" />
            Welcome back, {user?.name || 'Admin'}!
          </div>
          <h1 className={`text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.15] mb-4 ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}>
            Simplify Elasticsearch<br />
            Management with{' '}
            <span className="gradient-text">elasticease</span>
          </h1>
          <p className={`text-sm md:text-base leading-[1.7] mb-7 max-w-[560px] ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            A unified, high-performance web and console management platform built to monitor, query, and orchestrate your Elasticsearch nodes with maximum clarity.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => onNavigateToTab('console')} type="button"
              data-variant="primary"
              className="flex items-center gap-2 px-6 py-3.5 rounded-[14px] border-none text-white font-bold text-sm cursor-pointer transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #5d60e6, #5599f7)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}
            >
              <TerminalIcon className="w-5 h-5" /> Launch Console <ChevronRightIcon className="w-4 h-4" />
            </button>
            <button onClick={() => onNavigateToTab('cluster')} type="button"
              data-variant="secondary"
              className={`flex items-center gap-2 px-6 py-3.5 rounded-[14px] font-semibold text-sm cursor-pointer transition-all hover:-translate-y-0.5 border ${
                isDark ? 'bg-[#0d0d0d] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              View Cluster Status
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stat-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-9">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`metric-card rounded-[18px] px-5 py-5 border transition-all hover:-translate-y-1 ${
              isDark
                ? 'bg-[#0d0d0d] border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]'
                : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
            }`}>
              <div className="flex items-center justify-between mb-3.5">
                <span className={`text-[11px] font-bold uppercase tracking-[0.07em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</span>
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${s.bg}`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
              <p className={`text-xl font-extrabold mb-1 tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{s.value}</p>
              <p className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <CheckIcon className="w-3 h-3 text-emerald-500" /> {s.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* CONSOLE SECTION */}
      <div className="content-section mb-9">
        <div className={`section-heading border-b pb-4 mb-6 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-500 uppercase tracking-[0.08em] mb-1.5">
            <TerminalIcon className="w-4 h-4" /> Core Feature
          </div>
          <h2 className={`text-xl md:text-[28px] font-extrabold tracking-tight ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}>Elasticease Console App</h2>
          <p className={`text-[13px] mt-1.5 max-w-[520px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Full CLI power inside your browser — execute REST commands, inspect indices, and manage node operations in real-time.
          </p>
        </div>
        <ConsoleTerminal theme={theme} />
        <div className="feature-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className={`feature-card rounded-[18px] p-5 flex items-start gap-3.5 border transition-all hover:-translate-y-0.5 ${
                isDark
                  ? 'bg-[#0d0d0d] border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-indigo-500/10">
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className={`text-[13px] font-bold mb-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{f.title}</h3>
                  <p className={`text-xs leading-[1.65] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BACKEND BANNER */}
      <div className={`backend-banner rounded-[20px] px-7 py-6 flex flex-wrap items-center justify-between gap-4 border ${
        isDark ? 'bg-[#0d0d0d] border-slate-800' : 'bg-[#1e1b4b] border-[#312e81]'
      }`}>
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-1">
            <CpuIcon className="w-5 h-5 text-indigo-400" /> Backend Connection Ready
          </h3>
          <p className="text-xs text-slate-500">Frontend is configured to sync with your Python backend (run.py).</p>
        </div>
        <button onClick={() => onNavigateToTab('settings')} type="button"
          className="backend-config-button px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[13px] cursor-pointer transition-colors border-none"
        >
          Configure Endpoints
        </button>
      </div>
    </div>
  );
}
