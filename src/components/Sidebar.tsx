import React, { useState } from 'react';
import { Eye, EyeOff, ChevronsLeft, ChevronsRight, Sparkles, Cloud, CloudCheck, UserCheck, LogOut } from 'lucide-react';
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
  onLogin: (user: UserType) => void;
  onLogout: () => void;
  sessions: ScreeningSession[];
  onSaveSession: () => void;
  onLoadSession: (id: number) => void;
  hasResults: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isCloudSaving?: boolean;
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
  isCollapsed = false,
  onToggleCollapse,
  isCloudSaving = false,
}) => {
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | ''>('');
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle Login
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthMessage(null);
    if (!usernameInput.trim()) {
      setAuthMessage({ type: 'error', text: 'Please enter a username.' });
      return;
    }

    const clean = usernameInput.toLowerCase().trim();
    const user: UserType = {
      id: clean === 'admin' ? 1 : Date.now(),
      username: clean,
      full_name: clean === 'admin' ? 'Lead Recruiter' : clean.charAt(0).toUpperCase() + clean.slice(1),
    };
    onLogin(user);
    setAuthMessage({ type: 'success', text: `Signed in as @${user.username}` });
  };

  if (isCollapsed) {
    return (
      <aside className="w-16 bg-white border-r border-slate-200 p-3 flex flex-col items-center justify-between min-h-[calc(100vh-4rem)]">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
          title="Expand Sidebar"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div />
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-72 xl:w-80 bg-white border-r border-slate-200 p-5 shadow-xs shrink-0 flex flex-col space-y-5 rounded-2xl">
      {/* Sidebar Brand Header */}
      <div className="relative flex items-center justify-between pt-1 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
              Recruiter Hub
            </h2>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Auto-Sync Workspace
            </p>
          </div>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Account Section */}
      <div>
        {!currentUser ? (
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Recruiter Sign In
              </h3>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                Cloud Sync
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Sign in to automatically sync your candidate evaluations across all devices.
            </p>

            <form onSubmit={handleLogin} className="space-y-2.5 pt-0.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full bg-white text-slate-900 text-xs border border-slate-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-white text-slate-900 text-xs border border-slate-300 rounded-lg px-2.5 py-2 pr-8 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-purple w-full py-2 px-3 text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                Sign In &amp; Sync Data
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsernameInput('admin');
                  setPasswordInput('admin123');
                  const user: UserType = { id: 1, username: 'admin', full_name: 'Lead Recruiter' };
                  onLogin(user);
                }}
                className="w-full py-1.5 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors border border-dashed border-slate-300 cursor-pointer"
              >
                ⚡ Quick Demo (Admin)
              </button>
            </form>

            {authMessage && (
              <div
                className={`p-2 rounded-lg text-xs font-semibold ${
                  authMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {authMessage.text}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {currentUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser.full_name}</p>
                  <p className="text-[10px] text-slate-500">@{currentUser.username}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-100/60 px-2 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                title="Sign Out"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-indigo-100/80 text-[11px]">
              <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto-saved to cloud</span>
              </div>
              {isCloudSaving && (
                <span className="text-[10px] text-indigo-500 italic">Syncing...</span>
              )}
            </div>

            {sessions.length > 0 && (
              <div className="pt-2 border-t border-indigo-100/80 space-y-1.5">
                <label className="block text-[11px] text-slate-600 font-bold">Saved Screening History:</label>
                <div className="flex gap-1.5">
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(Number(e.target.value) || '')}
                    className="flex-1 bg-white border border-slate-200 text-xs rounded-lg px-2 py-1.5 text-slate-800 focus:outline-none"
                  >
                    <option value="">Select past session...</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.jd_title.slice(0, 20)}... ({s.created_at || 'Saved'})
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={!selectedSessionId}
                    onClick={() => {
                      if (selectedSessionId) onLoadSession(Number(selectedSessionId));
                    }}
                    className="px-2 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Load
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Demo Data Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <span>⚡</span> Showcase Demo Data
        </h3>
        <button
          onClick={onLoadSampleData}
          className="btn-purple w-full py-2 px-3 text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-2"
        >
          Load 6 Sample Resumes &amp; JD
        </button>
      </div>

      <hr className="border-slate-100" />

      {/* Scoring Weights Section */}
      <div className="space-y-3.5">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
          <span>⚙️</span> Scoring Weights
        </h3>

        {/* Weight 1: Skill Match */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>Skill Match</span>
            <span className="font-mono text-indigo-600 font-bold">{weights.skill.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.skill}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              const remaining = 1 - val;
              const subTotal = weights.semantic + weights.experience + weights.education;
              if (subTotal > 0) {
                onWeightsChange({
                  skill: val,
                  semantic: (weights.semantic / subTotal) * remaining,
                  experience: (weights.experience / subTotal) * remaining,
                  education: (weights.education / subTotal) * remaining,
                });
              } else {
                onWeightsChange({ skill: val, semantic: remaining / 3, experience: remaining / 3, education: remaining / 3 });
              }
            }}
            className="w-full accent-[#667EEA] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Weight 2: Semantic Similarity */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>Semantic Similarity</span>
            <span className="font-mono text-indigo-600 font-bold">{weights.semantic.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.semantic}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              const remaining = 1 - val;
              const subTotal = weights.skill + weights.experience + weights.education;
              if (subTotal > 0) {
                onWeightsChange({
                  semantic: val,
                  skill: (weights.skill / subTotal) * remaining,
                  experience: (weights.experience / subTotal) * remaining,
                  education: (weights.education / subTotal) * remaining,
                });
              }
            }}
            className="w-full accent-[#667EEA] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Weight 3: Experience */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>Experience</span>
            <span className="font-mono text-indigo-600 font-bold">{weights.experience.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.experience}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              const remaining = 1 - val;
              const subTotal = weights.skill + weights.semantic + weights.education;
              if (subTotal > 0) {
                onWeightsChange({
                  experience: val,
                  skill: (weights.skill / subTotal) * remaining,
                  semantic: (weights.semantic / subTotal) * remaining,
                  education: (weights.education / subTotal) * remaining,
                });
              }
            }}
            className="w-full accent-[#667EEA] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Weight 4: Education */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>Education</span>
            <span className="font-mono text-indigo-600 font-bold">{weights.education.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={weights.education}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              const remaining = 1 - val;
              const subTotal = weights.skill + weights.semantic + weights.experience;
              if (subTotal > 0) {
                onWeightsChange({
                  education: val,
                  skill: (weights.skill / subTotal) * remaining,
                  semantic: (weights.semantic / subTotal) * remaining,
                  experience: (weights.experience / subTotal) * remaining,
                });
              }
            }}
            className="w-full accent-[#667EEA] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Filters Section */}
      <div className="space-y-3.5">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
          <span>🎯</span> Filters
        </h3>

        {/* Min Fit Score */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>Min Fit Score (%)</span>
            <span className="font-mono text-indigo-600 font-bold">{minScoreFilter}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={minScoreFilter}
            onChange={(e) => onMinScoreChange(parseInt(e.target.value, 10))}
            className="w-full accent-[#667EEA] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Match Status Multiselect / Checkboxes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Match Status</label>
          <div className="space-y-1.5 text-xs">
            <label className="flex items-center gap-2 font-medium text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={statusFilters.topMatch}
                onChange={(e) =>
                  onStatusFilterChange({ ...statusFilters, topMatch: e.target.checked })
                }
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">🟢 Top Match (≥75%)</span>
            </label>

            <label className="flex items-center gap-2 font-medium text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={statusFilters.potentialFit}
                onChange={(e) =>
                  onStatusFilterChange({ ...statusFilters, potentialFit: e.target.checked })
                }
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">🟡 Potential Fit (60-74%)</span>
            </label>

            <label className="flex items-center gap-2 font-medium text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={statusFilters.lowMatch}
                onChange={(e) =>
                  onStatusFilterChange({ ...statusFilters, lowMatch: e.target.checked })
                }
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">🔴 Low Match (&lt;60%)</span>
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
};

