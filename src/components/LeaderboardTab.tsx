import React, { useState } from 'react';
import {
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  GraduationCap,
  Sparkles,
  Award
} from 'lucide-react';
import { Candidate } from '../types';
import { MetricCards } from './MetricCards';

interface LeaderboardTabProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onClearAll: () => void;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  candidates,
  onSelectCandidate,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCandidates = candidates.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.candidate_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.matched_skills.some(s => s.toLowerCase().includes(q)) ||
      c.candidate_edu.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Top Match':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Potential Fit':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-700 bg-emerald-50';
    if (score >= 60) return 'text-amber-700 bg-amber-50';
    return 'text-rose-700 bg-rose-50';
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <MetricCards candidates={candidates} />

      {/* Leaderboard Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Candidate Leaderboard</h2>
            <p className="text-xs text-slate-500">
              Ranked by multi-factor composite alignment against target job criteria
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 sm:w-64 pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {candidates.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors font-semibold"
              >
                Clear Results
              </button>
            )}
          </div>
        </div>

        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No candidates match current criteria or filters.</p>
            <p className="text-xs text-slate-500 mt-1">Adjust sidebar filters or ingest candidate resumes to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-3">Overall Fit</th>
                  <th className="py-3 px-3">Skill Match</th>
                  <th className="py-3 px-3">Semantic Sim</th>
                  <th className="py-3 px-3">Experience</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCandidates.map((c, index) => (
                  <tr
                    key={c.candidate_name}
                    className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                    onClick={() => onSelectCandidate(c)}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 font-bold text-slate-700">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-800 text-xs font-mono">
                        #{index + 1}
                      </span>
                    </td>

                    {/* Candidate Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {c.candidate_name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {c.email} • {c.candidate_edu}
                      </div>
                    </td>

                    {/* Overall Score with Progress Bar */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-extrabold px-2 py-0.5 rounded-md text-xs font-mono ${getScoreColor(c.overall_score)}`}>
                          {c.overall_score}%
                        </span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              c.overall_score >= 75 ? 'bg-emerald-500' : c.overall_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, c.overall_score)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Skill Score */}
                    <td className="py-3.5 px-3 font-semibold text-slate-700">
                      <div className="flex items-center gap-1">
                        <span>{c.skill_score}%</span>
                        <span className="text-[10px] text-slate-400">({c.matched_skills.length} skills)</span>
                      </div>
                    </td>

                    {/* Semantic Score */}
                    <td className="py-3.5 px-3 font-semibold text-slate-700">
                      {c.semantic_score}%
                    </td>

                    {/* Experience */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.candidate_exp_years} Years</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCandidate(c);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        Profile <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Profile Highlights Cards */}
      {filteredCandidates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">Candidate Deep-Dive Summaries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCandidates.slice(0, 6).map((c, idx) => (
              <div
                key={c.candidate_name}
                onClick={() => onSelectCandidate(c)}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Rank #{idx + 1}</span>
                      <h4 className="font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                        {c.candidate_name}
                      </h4>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md font-mono ${getScoreColor(c.overall_score)}`}>
                      {c.overall_score}%
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1 mb-3">
                    <p className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {c.candidate_exp_years} yrs experience
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {c.candidate_edu}
                    </p>
                  </div>

                  {/* Skills tags preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>Matched Skills ({c.matched_skills.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {c.matched_skills.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                        >
                          ✓ {s}
                        </span>
                      ))}
                      {c.matched_skills.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-600 font-medium">
                          +{c.matched_skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(c.status)}`}>
                    {c.status}
                  </span>
                  <span className="text-indigo-600 font-semibold hover:underline flex items-center gap-1 text-[11px]">
                    View Analysis →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
