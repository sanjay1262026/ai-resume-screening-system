import React, { useState } from 'react';
import {
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
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
  const [expandedCandidates, setExpandedCandidates] = useState<Record<string, boolean>>({});

  const toggleExpander = (candidateName: string) => {
    setExpandedCandidates((prev) => ({
      ...prev,
      [candidateName]: !prev[candidateName],
    }));
  };

  const filteredCandidates = candidates.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.candidate_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.matched_skills.some((s) => s.toLowerCase().includes(q)) ||
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
      <div className="glass-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Candidate Leaderboard</h3>
            <p className="text-xs text-slate-500">
              Ranked by multi-factor composite alignment against target job criteria
            </p>
          </div>

          <div className="flex items-center gap-3">
            {candidates.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors font-semibold border border-rose-200 cursor-pointer"
              >
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Search by Name, Email, or Skill:
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
          </div>
        </div>

        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No candidates match current criteria or filters.</p>
            <p className="text-xs text-slate-500 mt-1">Adjust sidebar filters or ingest candidate resumes to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-100 to-slate-200/80 text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-3">Overall</th>
                  <th className="py-3 px-3">Skill</th>
                  <th className="py-3 px-3">Semantic</th>
                  <th className="py-3 px-3">Exp</th>
                  <th className="py-3 px-3">Edu</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Skills</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs bg-white">
                {filteredCandidates.map((c, index) => (
                  <tr
                    key={c.candidate_name}
                    className="hover:bg-indigo-50/40 transition-colors group cursor-pointer"
                    onClick={() => toggleExpander(c.candidate_name)}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 font-bold text-slate-700">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                        #{index + 1}
                      </span>
                    </td>

                    {/* Candidate Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {c.candidate_name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {c.email}
                      </div>
                    </td>

                    {/* Overall Score */}
                    <td className="py-3.5 px-3">
                      <span className={`font-extrabold px-2 py-0.5 rounded-md text-xs font-mono ${getScoreColor(c.overall_score)}`}>
                        {c.overall_score.toFixed(1)}%
                      </span>
                    </td>

                    {/* Skill Score */}
                    <td className="py-3.5 px-3 font-semibold text-slate-700 font-mono">
                      {c.skill_score.toFixed(1)}%
                    </td>

                    {/* Semantic Score */}
                    <td className="py-3.5 px-3 font-semibold text-slate-700 font-mono">
                      {c.semantic_score.toFixed(1)}%
                    </td>

                    {/* Experience */}
                    <td className="py-3.5 px-3 text-slate-700 font-semibold">
                      {c.candidate_exp_years} Y
                    </td>

                    {/* Education */}
                    <td className="py-3.5 px-3 text-slate-700 truncate max-w-[120px]">
                      {c.candidate_edu}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>

                    {/* Matched skills count */}
                    <td className="py-3.5 px-3 text-center font-bold text-slate-600">
                      {c.matched_skills.length}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCandidate(c);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
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

        {/* Candidate Profiles Expanders Section */}
        {filteredCandidates.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="text-lg font-bold text-slate-900 mb-4">Candidate Profiles</h4>

            <div className="space-y-3">
              {filteredCandidates.map((c, rank) => {
                const isExpanded = !!expandedCandidates[c.candidate_name];
                const radarData = [
                  { metric: 'Skill Match', score: c.skill_score, fullMark: 100 },
                  { metric: 'Semantic Similarity', score: c.semantic_score, fullMark: 100 },
                  { metric: 'Experience Match', score: c.experience_score, fullMark: 100 },
                  { metric: 'Education Match', score: c.education_score, fullMark: 100 },
                ];

                return (
                  <div
                    key={c.candidate_name}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs"
                  >
                    {/* Expander Header */}
                    <button
                      onClick={() => toggleExpander(c.candidate_name)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors cursor-pointer font-bold text-slate-800 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-600 font-bold">#{rank + 1}</span>
                        <span>|</span>
                        <span>{c.candidate_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getStatusBadge(c.status)}`}>
                          {c.status}
                        </span>
                        <span>—</span>
                        <span className="text-indigo-600 font-mono">{c.overall_score.toFixed(1)}%</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>

                    {/* Expander Content */}
                    {isExpanded && (
                      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left Column: Candidate Info & Skills */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-base font-bold text-slate-900">{c.candidate_name}</h4>
                              <p className="text-xs text-slate-600 mt-1">
                                <strong>Email:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{c.email}</code> | <strong>Phone:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{c.phone}</code>
                              </p>
                              <p className="text-xs text-slate-600 mt-1">
                                <strong>Experience:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{c.candidate_exp_years} Years</code> | <strong>Education:</strong> <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{c.candidate_edu}</code>
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-200">
                              <p className="text-xs font-bold text-slate-800 mb-1.5">Matched Skills:</p>
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {c.matched_skills.length > 0 ? (
                                  c.matched_skills.map((s) => (
                                    <span key={s} className="skill-tag skill-tag-matched">
                                      ✓ {s}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400 italic">None</span>
                                )}
                              </div>

                              <p className="text-xs font-bold text-slate-800 mb-1.5">Missing Skills:</p>
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {c.missing_skills.length > 0 ? (
                                  c.missing_skills.map((s) => (
                                    <span key={s} className="skill-tag skill-tag-missing">
                                      ✗ {s}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400 italic">None</span>
                                )}
                              </div>

                              {c.extra_skills.length > 0 && (
                                <>
                                  <p className="text-xs font-bold text-slate-800 mb-1.5">Additional Skills:</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {c.extra_skills.slice(0, 8).map((s) => (
                                      <span key={s} className="skill-tag skill-tag-matched">
                                        + {s}
                                      </span>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Right Column: Radar Chart */}
                          <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-slate-200">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Skill Radar Profile</h5>
                            <div className="w-full h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                  <PolarGrid stroke="#e2e8f0" />
                                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#374151', fontSize: 10, fontWeight: 600 }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" tick={{ fontSize: 9 }} />
                                  <Radar
                                    name={c.candidate_name}
                                    dataKey="score"
                                    stroke="#667EEA"
                                    fill="#667EEA"
                                    fillOpacity={0.35}
                                  />
                                  <Tooltip />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

