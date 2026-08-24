import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeIcon, ChevronRightIcon } from './Icons';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      {/* Ambient orbs — use % sizes so they never exceed viewport */}
      <div
        className="absolute top-[10%] right-[5%] w-[40vw] max-w-[450px] h-[40vw] max-h-[450px] rounded-full pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)' }}
      />
      <div
        className="absolute bottom-[10%] left-[5%] w-[35vw] max-w-[380px] h-[35vw] max-h-[380px] rounded-full pointer-events-none opacity-15"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)' }}
      />

      <div className="relative z-10 text-center px-6 max-w-lg mx-auto w-full">
        {/* Giant 404 — clamped so it never overflows on small screens */}
        <p
          className="font-extrabold leading-none mb-2 select-none"
          style={{
            fontSize: 'clamp(72px, 20vw, 160px)',
            background: 'linear-gradient(135deg, #1e293b, #334155)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          404
        </p>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
          Page Not Found
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Oops! Wrong{' '}
          <span className="gradient-text">Route</span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved. Head back to the dashboard.
        </p>

        <button
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-white font-bold text-sm cursor-pointer border-none transition-all hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
          }}
        >
          <HomeIcon className="w-4 h-4" />
          Back to Dashboard
          <ChevronRightIcon className="w-4 h-4" />
        </button>

        <p className="mt-8 text-slate-700 text-xs">
          Élasticease Core Platform &bull; v1.0.0
        </p>
      </div>
    </div>
  );
}
