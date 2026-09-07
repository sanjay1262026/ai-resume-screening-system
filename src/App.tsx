import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Trophy,
  Swords,
  BarChart3,
  FileDown,
  Cpu,
  Sparkles,
  Layers
} from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { IngestionTab } from './components/IngestionTab';
import { LeaderboardTab } from './components/LeaderboardTab';
import { ComparisonTab } from './components/ComparisonTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { ReportsTab } from './components/ReportsTab';
import { EngineTab } from './components/EngineTab';
import { CandidateModal } from './components/CandidateModal';
import { Candidate, ScoringWeights, ScreeningSession, User } from './types';
import { SAMPLE_JOB_DESCRIPTIONS, SAMPLE_CANDIDATES } from './data/sampleData';
import { evaluateCandidate } from './utils/scoringEngine';
import { fetchUserCloudData, autoSaveUserCloudData } from './utils/api';

export const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<
    'ingest' | 'leaderboard' | 'compare' | 'analytics' | 'reports' | 'engine'
  >('leaderboard');

  // Job Description
  const defaultJd = SAMPLE_JOB_DESCRIPTIONS[0];
  const [jdText, setJdText] = useState<string>(defaultJd.content);
  const [jdTitle, setJdTitle] = useState<string>(defaultJd.title);

  // Scoring weights
  const [weights, setWeights] = useState<ScoringWeights>({
    skill: 0.40,
    semantic: 0.35,
    experience: 0.15,
    education: 0.10,
  });

  // Filters
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [statusFilters, setStatusFilters] = useState({
    topMatch: true,
    potentialFit: true,
    lowMatch: true,
  });

  // User & Sessions
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 1,
    username: 'admin',
    full_name: 'Lead Recruiter',
  });
  const [sessions, setSessions] = useState<ScreeningSession[]>([]);
  const [isCloudSaving, setIsCloudSaving] = useState<boolean>(false);
  const [hasInitializedFromCloud, setHasInitializedFromCloud] = useState<boolean>(false);

  // Selected candidate modal
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Candidate Pool
  const [rawCandidatePool, setRawCandidatePool] = useState<Candidate[]>(() => {
    return SAMPLE_CANDIDATES.map((sample) =>
      evaluateCandidate(
        {
          candidate_name: sample.name,
          filename: sample.filename,
          email: sample.email,
          phone: sample.phone,
          text: sample.rawText,
          experience_years: sample.experience_years,
          education: sample.education,
        },
        defaultJd.content,
        { skill: 0.40, semantic: 0.35, experience: 0.15, education: 0.10 }
      )
    ).sort((a, b) => b.overall_score - a.overall_score);
  });

  // Load cloud data on mount or when user changes
  useEffect(() => {
    if (!currentUser?.username) return;
    let isCancelled = false;

    async function loadCloud() {
      if (!currentUser) return;
      const cloudData = await fetchUserCloudData(currentUser.username);
      if (cloudData && !isCancelled) {
        if (cloudData.jdTitle) setJdTitle(cloudData.jdTitle);
        if (cloudData.jdText) setJdText(cloudData.jdText);
        if (cloudData.weights) setWeights(cloudData.weights);
        if (cloudData.candidates && cloudData.candidates.length > 0) {
          setRawCandidatePool(cloudData.candidates);
        }
        if (cloudData.sessions && cloudData.sessions.length > 0) {
          setSessions(cloudData.sessions);
        }
      }
      setHasInitializedFromCloud(true);
    }

    loadCloud();
    return () => {
      isCancelled = true;
    };
  }, [currentUser?.username]);

  // Auto-save changes to the cloud backend
  useEffect(() => {
    if (!hasInitializedFromCloud || !currentUser?.username) return;

    setIsCloudSaving(true);
    autoSaveUserCloudData(currentUser.username, {
      jdTitle,
      jdText,
      weights,
      candidates: rawCandidatePool,
      sessions,
    });
    const timer = setTimeout(() => setIsCloudSaving(false), 800);
    return () => clearTimeout(timer);
  }, [hasInitializedFromCloud, currentUser?.username, jdTitle, jdText, weights, rawCandidatePool, sessions]);

  // Dynamically re-evaluate scores when weights change
  const candidatesWithUpdatedWeights = useMemo(() => {
    return rawCandidatePool.map((c) =>
      evaluateCandidate(
        {
          candidate_name: c.candidate_name,
          filename: c.filename,
          email: c.email,
          phone: c.phone,
          text: c.raw_text,
          experience_years: c.candidate_exp_years,
          education: c.candidate_edu,
        },
        jdText,
        weights
      )
    ).sort((a, b) => b.overall_score - a.overall_score);
  }, [rawCandidatePool, weights, jdText]);

  // Apply sidebar filters
  const filteredCandidates = useMemo(() => {
    return candidatesWithUpdatedWeights.filter((c) => {
      if (c.overall_score < minScoreFilter) return false;
      if (c.status === 'Top Match' && !statusFilters.topMatch) return false;
      if (c.status === 'Potential Fit' && !statusFilters.potentialFit) return false;
      if (c.status === 'Low Match' && !statusFilters.lowMatch) return false;
      return true;
    });
  }, [candidatesWithUpdatedWeights, minScoreFilter, statusFilters]);

  // Handle Loading Demo Data
  const handleLoadSampleData = () => {
    const defaultJ = SAMPLE_JOB_DESCRIPTIONS[0];
    setJdText(defaultJ.content);
    setJdTitle(defaultJ.title);

    const evaluated = SAMPLE_CANDIDATES.map((sample) =>
      evaluateCandidate(
        {
          candidate_name: sample.name,
          filename: sample.filename,
          email: sample.email,
          phone: sample.phone,
          text: sample.rawText,
          experience_years: sample.experience_years,
          education: sample.education,
        },
        defaultJ.content,
        weights
      )
    ).sort((a, b) => b.overall_score - a.overall_score);

    setRawCandidatePool(evaluated);
    setActiveTab('leaderboard');
  };

  // Sessions Management
  const handleSaveSession = () => {
    const newSession: ScreeningSession = {
      id: Date.now(),
      jd_title: jdTitle,
      jd_text: jdText,
      created_at: new Date().toLocaleString(),
      candidates: candidatesWithUpdatedWeights,
    };
    setSessions((prev) => [newSession, ...prev]);
  };

  const handleLoadSession = (sessionId: number) => {
    const found = sessions.find((s) => s.id === sessionId);
    if (found) {
      setJdTitle(found.jd_title);
      setJdText(found.jd_text);
      setRawCandidatePool(found.candidates);
      setActiveTab('leaderboard');
    }
  };

  // Ingestion complete callback
  const handleScreeningComplete = (newList: Candidate[]) => {
    setRawCandidatePool(newList);
    setActiveTab('leaderboard');
  };

  const handleClearAll = () => {
    setRawCandidatePool([]);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                AI Resume Screening System
              </span>
            </div>

            {/* Quick Status / Candidate Counter */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Layers className="w-3.5 h-3.5" />
                {candidatesWithUpdatedWeights.length} Candidates Evaluated
              </span>
              <button
                onClick={handleLoadSampleData}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
              >
                ⚡ Reset Demo
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Header />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Sidebar */}
          <Sidebar
            weights={weights}
            onWeightsChange={setWeights}
            minScoreFilter={minScoreFilter}
            onMinScoreChange={setMinScoreFilter}
            statusFilters={statusFilters}
            onStatusFilterChange={setStatusFilters}
            onLoadSampleData={handleLoadSampleData}
            currentUser={currentUser}
            onLogin={(user) => setCurrentUser(user)}
            onLogout={() => setCurrentUser(null)}
            sessions={sessions}
            onSaveSession={handleSaveSession}
            onLoadSession={handleLoadSession}
            hasResults={candidatesWithUpdatedWeights.length > 0}
            isCloudSaving={isCloudSaving}
          />

          {/* Right Workspace Area */}
          <div className="flex-1 w-full space-y-6">
            {/* Tabs Navigation Header */}
            <div className="glass-card !p-1.5 flex flex-wrap gap-1 mb-6">
              <button
                onClick={() => setActiveTab('ingest')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ingest'
                    ? 'btn-purple text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <span>📥</span>
                <span>Ingestion & Screening</span>
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'leaderboard'
                    ? 'btn-purple text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <span>🏆</span>
                <span>Leaderboard</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'leaderboard' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {filteredCandidates.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('compare')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'compare'
                    ? 'btn-purple text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <span>⚔️</span>
                <span>Head-to-Head Comparison</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'btn-purple text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <span>📊</span>
                <span>Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'reports'
                    ? 'btn-purple text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <span>📑</span>
                <span>Reports & Export</span>
              </button>

              <button
                onClick={() => setActiveTab('engine')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'engine'
                    ? 'btn-purple text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <span>⚙️</span>
                <span>Scoring Engine</span>
              </button>
            </div>

            {/* Active Tab View */}
            {activeTab === 'leaderboard' && (
              <LeaderboardTab
                candidates={filteredCandidates}
                onSelectCandidate={setSelectedCandidate}
                onClearAll={handleClearAll}
              />
            )}

            {activeTab === 'ingest' && (
              <IngestionTab
                jdText={jdText}
                onJdTextChange={setJdText}
                jdTitle={jdTitle}
                onJdTitleChange={setJdTitle}
                onScreeningComplete={handleScreeningComplete}
                weights={weights}
              />
            )}

            {activeTab === 'compare' && (
              <ComparisonTab candidates={candidatesWithUpdatedWeights} />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsTab candidates={candidatesWithUpdatedWeights} />
            )}

            {activeTab === 'reports' && (
              <ReportsTab
                candidates={candidatesWithUpdatedWeights}
                jdTitle={jdTitle}
              />
            )}

            {activeTab === 'engine' && <EngineTab />}
          </div>
        </div>
      </main>

      {/* Candidate Profile Modal */}
      <CandidateModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
};

export default App;
