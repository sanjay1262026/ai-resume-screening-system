import React from 'react';
import { Users, Award, TrendingUp, UserCheck } from 'lucide-react';
import { Candidate } from '../types';

interface MetricCardsProps {
  candidates: Candidate[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ candidates }) => {
  const total = candidates.length;
  const topMatches = candidates.filter(c => c.overall_score >= 75).length;
  const avgScore = total > 0
    ? (candidates.reduce((sum, c) => sum + c.overall_score, 0) / total).toFixed(1)
    : '0.0';
  const topCandidate = candidates.length > 0 ? candidates[0] : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Total Candidates */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200 rounded-xl p-5 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Total Screened</span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-indigo-900 tracking-tight">{total}</div>
        <p className="text-xs text-indigo-600/80 mt-1">Processed applicant profiles</p>
      </div>

      {/* Card 2: Top Matches */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-50 to-teal-100/60 border border-teal-200 rounded-xl p-5 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Top Matches (≥75%)</span>
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600">
            <Award className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-teal-900 tracking-tight">{topMatches}</div>
        <p className="text-xs text-teal-600/80 mt-1">
          {total > 0 ? `${((topMatches / total) * 100).toFixed(0)}% of candidate pool` : '0% of pool'}
        </p>
      </div>

      {/* Card 3: Avg Fit Score */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100/60 border border-purple-200 rounded-xl p-5 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Average Fit</span>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-purple-900 tracking-tight">{avgScore}%</div>
        <p className="text-xs text-purple-600/80 mt-1">Weighted composite mean</p>
      </div>

      {/* Card 4: Top Rank */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200 rounded-xl p-5 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Rank #1 Applicant</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-700">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="text-xl font-extrabold text-amber-950 truncate tracking-tight">
          {topCandidate ? topCandidate.candidate_name : 'None'}
        </div>
        <p className="text-xs text-amber-700/80 mt-1">
          {topCandidate ? `${topCandidate.overall_score}% match score` : 'No evaluation yet'}
        </p>
      </div>
    </div>
  );
};
