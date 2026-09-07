import React, { useState } from 'react';
import { Eye, EyeOff, ChevronsLeft, ChevronsRight, CheckCircle2 } from 'lucide-react';
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
}) => {
  const [authAction, setAuthAction] = useState<'login' | 'register' | 'forgot'>('login');
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [fullNameInput, setFullNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | ''>('');
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setAuthMessage({ type: 'error', text: 'Please enter username and password.' });
      return;
    }

    // Default admin check or simulated user auth
    if (
      (usernameInput.toLowerCase() === 'admin' && passwordInput === 'admin123') ||
      passwordInput.length >= 4
    ) {
      const user: UserType = {
        id: 1,
        username: usernameInput.toLowerCase().trim(),
        full_name: fullNameInput.trim() || (usernameInput.toLowerCase() === 'admin' ? 'Admin Recruiter' : usernameInput),
      };
      onLogin(user);
      setAuthMessage({ type: 'success', text: `Welcome back, ${user.full_name}!` });
    } else {
      setAuthMessage({ type: 'error', text: 'Invalid Username or Password.' });
    }
  };

  // Handle Register
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim() || !fullNameInput.trim()) {
      setAuthMessage({ type: 'error', text: 'Please fill in all registration fields.' });
      return;
    }
    const user: UserType = {
      id: Date.now(),
      username: usernameInput.toLowerCase().trim(),
      full_name: fullNameInput.trim(),
    };
    onLogin(user);
    setAuthMessage({ type: 'success', text: 'User registered successfully! Logged in now.' });
  };

  // Handle Password Reset
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setAuthMessage({ type: 'error', text: 'Please enter username and new password.' });
      return;
    }
    setAuthMessage({ type: 'success', text: `Password for @${usernameInput} reset successfully! You can now log in.` });
    setAuthAction('login');
  };

  const handleSaveClick = () => {
    onSaveSession();
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  if (isCollapsed) {
    return (
      <aside className="w-16 bg-white border-r-2 border-[#F0F4F9] p-3 flex flex-col items-center justify-between min-h-[calc(100vh-4rem)]">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
          title="Expand Sidebar"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
        <span className="text-2xl" title="TailAdmin">🎯</span>
        <div />
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-72 xl:w-80 bg-white border-r-2 border-[#F0F4F9] p-5 shadow-xs shrink-0 flex flex-col space-y-5">
      {/* Sidebar Header with Collapse button */}
      <div className="relative flex flex-col items-center justify-center pt-1 pb-2">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute right-0 top-0 p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}
        <span className="text-4xl">🎯</span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">TailAdmin</h2>
      </div>

      <hr className="border-slate-200" />

      {/* Account Section */}
      <div>
        {!currentUser ? (
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>🔑</span> Account Login
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Default: <span className="bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded font-mono text-[11px]">admin</span> / <span className="bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded font-mono text-[11px]">admin123</span>
            </p>

            {/* Select Action Radio Buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Select Action:</label>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-800">
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="authAction"
                    value="login"
                    checked={authAction === 'login'}
                    onChange={() => {
                      setAuthAction('login');
                      setAuthMessage(null);
                    }}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Login</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="authAction"
                    value="register"
                    checked={authAction === 'register'}
                    onChange={() => {
                      setAuthAction('register');
                      setAuthMessage(null);
                    }}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Register</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium w-full mt-1">
                  <input
                    type="radio"
                    name="authAction"
                    value="forgot"
                    checked={authAction === 'forgot'}
                    onChange={() => {
                      setAuthAction('forgot');
                      setAuthMessage(null);
                    }}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Forgot Password?</span>
                </label>
              </div>
            </div>

            {/* Auth Form */}
            {authAction === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username:</label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-white text-slate-900 text-sm border-2 border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password:</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-white text-slate-900 text-sm border-2 border-slate-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-purple w-full py-2.5 px-4 text-xs font-bold shadow-md cursor-pointer"
                >
                  Login to Account
                </button>
              </form>
            )}

            {authAction === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Recruiter"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className="w-full bg-white text-slate-900 text-sm border-2 border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username:</label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-white text-slate-900 text-sm border-2 border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password:</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-white text-slate-900 text-sm border-2 border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-purple w-full py-2.5 px-4 text-xs font-bold shadow-md cursor-pointer"
                >
                  Register Account
                </button>
              </form>
            )}

            {authAction === 'forgot' && (
              <form onSubmit={handleResetPassword} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Username:</label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-white text-slate-900 text-sm border-2 border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Password:</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-white text-slate-900 text-sm border-2 border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-purple w-full py-2.5 px-4 text-xs font-bold shadow-md cursor-pointer"
                >
                  Reset Password
                </button>
              </form>
            )}

            {authMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold ${
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-slate-900">👤 {currentUser.full_name}</p>
                <p className="text-xs text-slate-500">@{currentUser.username}</p>
              </div>
              <button
                onClick={onLogout}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>

            <hr className="border-slate-100" />

            <h4 className="text-xs font-bold text-slate-700">💾 Saved Sessions</h4>

            {hasResults && (
              <button
                onClick={handleSaveClick}
                className="btn-purple w-full py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {saveSuccessMsg ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Session Saved!
                  </>
                ) : (
                  'Save Current Results'
                )}
              </button>
            )}

            {sessions.length > 0 ? (
              <div className="space-y-2">
                <label className="block text-xs text-slate-600 font-medium">Load Session:</label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(Number(e.target.value) || '')}
                  className="w-full bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select saved session...</option>
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
                  className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Load Selected
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">No saved sessions yet.</p>
            )}
          </div>
        )}
      </div>

      <hr className="border-slate-200" />

      {/* Demo Data Section */}
      <div className="space-y-2.5">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
          <span>⚡</span> Demo Data
        </h3>
        <button
          onClick={onLoadSampleData}
          className="btn-purple w-full py-2.5 px-4 text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          Load Sample Data
        </button>
      </div>

      <hr className="border-slate-200" />

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

