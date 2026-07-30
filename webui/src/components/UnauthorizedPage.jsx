import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldIcon, LockIcon, ChevronRightIcon } from './Icons';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      {/* Ambient orbs */}
      <div
        className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.2), transparent 70%)' }}
      />
      <div
        className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full pointer-events-none opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)' }}
      />

      <div className="relative z-10 text-center px-6 max-w-lg mx-auto">
        {/* Icon */}
        <div className="flex items-center justify-center mb-8">
          <div
            className="w-24 h-24 rounded-[24px] flex items-center justify-center p-0.5"
            style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}
          >
            <div className="w-full h-full bg-black rounded-[22px] flex items-center justify-center">
              <LockIcon className="w-10 h-10 text-red-400" />
            </div>
          </div>
        </div>

        {/* 401 badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold uppercase tracking-widest mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
          401 — Unauthorized
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
          Access{' '}
          <span style={{
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Denied
          </span>
        </h1>

        <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-sm mx-auto">
          You need to be signed in to access this page. Please log in with your credentials to continue.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-white font-bold text-sm cursor-pointer border-none transition-all hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
          }}
        >
          <ShieldIcon className="w-4 h-4" />
          Go to Login
          <ChevronRightIcon className="w-4 h-4" />
        </button>

        <p className="mt-8 text-slate-700 text-xs">
          Élasticease Core Platform &bull; v1.0.0
        </p>
      </div>
    </div>
  );
}
