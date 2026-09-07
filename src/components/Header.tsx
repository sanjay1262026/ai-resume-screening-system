import React from 'react';
import { Sparkles, Brain, Target, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 sm:p-10 shadow-xl shadow-indigo-500/15 mb-8 text-white">
      {/* Background ambient elements */}
      <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-12 w-48 h-48 rounded-full bg-purple-400/20 blur-xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-wrap gap-2.5 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-white/15 backdrop-blur-md border border-white/20 text-white">
            <Brain className="w-3.5 h-3.5 text-pink-200" /> NLP Parsing
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-white/15 backdrop-blur-md border border-white/20 text-white">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" /> TF-IDF Vector Engine
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-white/15 backdrop-blur-md border border-white/20 text-white">
            <Target className="w-3.5 h-3.5 text-emerald-200" /> Multi-Factor Scoring
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-white/15 backdrop-blur-md border border-white/20 text-white">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-200" /> Automated Recruiter AI
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3">
          AI Resume Screening & Ranking System
        </h1>
        <p className="text-base sm:text-lg text-white/85 max-w-3xl font-normal leading-relaxed">
          Production-grade candidate evaluation platform. Ingest job descriptions and multi-format resumes, extract technical skills across 250+ taxonomies, calculate semantic vector fit, and rank applicants in real time.
        </p>
      </div>
    </div>
  );
};
