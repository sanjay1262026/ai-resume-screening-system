import React, { useState } from 'react';
import {
  Sliders,
  Filter,
  User,
  Bookmark,
  Sparkles,
  RefreshCw,
  LogOut,
  Save,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { ScoringWeights, ScreeningSession, User as UserType } from '../types';

interface SidebarProps {
  weights: ScoringWeights;
  onWeightsChange: (weights: ScoringWeights) => void;
  minScoreFilter: number;
  onMinScoreChange: (score: number) => void;
  statusFilters: {
    topMatch: boolean;
    potentialFit: boolean;
    lowMatch: boolean;
  };
  onStatusFilterChange: (filters: { topMatch: boolean; potentialFit: boolean; lowMatch: boolean }) => void;
  onLoadSampleData: () => void;
  currentUser: UserType | null;
  onLogin: (username: string) => void;
  onLogout: () => void;
  sessions: ScreeningSession[];
  onSaveSession: () => void;
  onLoadSession: (id: number) => void;
  hasResults: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  weights,
  onWeightsChange,
  minScoreFilter,
  onMinScoreChange,
  statusFilters,
  onStatusFilterChange,
  onLoadSampleData,
  currentUser,
  onLogin,
  onLogout,
  sessions,
  onSaveSession,
  onLoadSession,
  hasResults,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | ''>('');

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      onLogin(usernameInput.trim());
    }
  };

  const handleSaveClick = () => {
    onSaveSession();
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  return (
    <aside className="w-full lg:w-80 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6 shrink-0 h-fit">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <span className="text-xl">🤖</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">Screening Engine</h2>
          <p className="text-xs text-slate-500">Recruiter Decision Support</p>
        </div>
      </div>

      {/* Account Section */}
      <div className="space-y-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <User className="w-3.5 h-3.5 text-indigo-500" /> Account & Sessions
        </div>

        {currentUser ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{currentUser.full_name}</p>
                <p className="text-xs text-indigo-600 font-medium">@{currentUser.username}</p>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {hasResults && (
              <button
                onClick={handleSaveClick}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors border border-indigo-200"
              >
                {saveSuccessMsg ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save Session to DB
                  </>
                )}
              </button>
            )}

            {sessions.length > 0 && (
              <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                <label className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-slate-400" /> Load Saved Session:
                </label>
                <div className="flex gap-1.5">
                  <select
                    className="flex-1 bg-white border border-slate-200 text-xs rounded-lg px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(Number(e.target.value) || '')}
                  >
                    <option value="">Choose session...</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        #{s.id} - {s.jd_title.slice(0, 18)}...
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={!selectedSessionId}
                    onClick={() => {
                      if (selectedSessionId) onLoadSession(Number(selectedSessionId));
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 transition-colors flex items-center"
                    title="Open Session"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-2.5">
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold text-slate-600">
              <button
                type="button"
                className={`flex-1 py-1 rounded-md transition-all ${authMode === 'login' ? 'bg-white shadow text-indigo-600' : ''}`}
                onClick={() => setAuthMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={`flex-1 py-1 rounded-md transition-all ${authMode === 'register' ? 'bg-white shadow text-indigo-600' : ''}`}
                onClick={() => setAuthMode('register')}
              >
                Register
              </button>
            </div>
            <input
              type="text"
              placeholder="Username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="w-full py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
            >
              {authMode === 'login' ? 'Sign In (admin/admin123)' : 'Create Account'}
            </button>
          </form>
        )}
      </div>

      {/* Demo Data Quick Action */}
      <div className="space-y-2 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Instant Demo
        </div>
        <p className="text-xs text-slate-500">Pre-load 6 multi-format candidate resumes & AI role requirements.</p>
        <button
          onClick={onLoadSampleData}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/20 active:scale-98 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> ⚡ Load Sample Data
        </button>
      </div>

      {/* Dynamic Algorithm Weights */}
      <div className="space-y-3 pb-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Sliders className="w-3.5 h-3.5 text-purple-500" /> Scoring Weights
          </span>
          <button
            onClick={() => onWeightsChange({ skill: 0.40, semantic: 0.35, experience: 0.15, education: 0.10 })}
            className="text-[10px] text-indigo-600 hover:underline font-semibold"
          >
            Reset
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Skill Match</span>
              <span className="text-indigo-600 font-bold">{Math.round(weights.skill * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.skill}
              onChange={(e) => onWeightsChange({ ...weights, skill: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Semantic Similarity</span>
              <span className="text-purple-600 font-bold">{Math.round(weights.semantic * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.semantic}
              onChange={(e) => onWeightsChange({ ...weights, semantic: parseFloat(e.target.value) })}
              className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Experience Match</span>
              <span className="text-teal-600 font-bold">{Math.round(weights.experience * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.experience}
              onChange={(e) => onWeightsChange({ ...weights, experience: parseFloat(e.target.value) })}
              className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Education Match</span>
              <span className="text-amber-600 font-bold">{Math.round(weights.education * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.education}
              onChange={(e) => onWeightsChange({ ...weights, education: parseFloat(e.target.value) })}
              className="w-full accent-amber-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Candidate Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Filter className="w-3.5 h-3.5 text-teal-500" /> Leaderboard Filters
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Minimum Fit Score</span>
              <span className="text-indigo-600 font-bold">{minScoreFilter}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minScoreFilter}
              onChange={(e) => onMinScoreChange(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status Tiers</span>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilters.topMatch}
                onChange={(e) => onStatusFilterChange({ ...statusFilters, topMatch: e.target.checked })}
                className="accent-emerald-600 rounded"
              />
              <span className="text-slate-700">Top Match 🟢 (≥75%)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilters.potentialFit}
                onChange={(e) => onStatusFilterChange({ ...statusFilters, potentialFit: e.target.checked })}
                className="accent-amber-500 rounded"
              />
              <span className="text-slate-700">Potential Fit 🟡 (60-74%)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={statusFilters.lowMatch}
                onChange={(e) => onStatusFilterChange({ ...statusFilters, lowMatch: e.target.checked })}
                className="accent-rose-500 rounded"
              />
              <span className="text-slate-700">Low Match 🔴 (&lt;60%)</span>
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
};
