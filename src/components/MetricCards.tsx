import React from 'react';
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
      {/* Card 1: Total Applicants */}
      <div className="metric-box-inner metric-card-1">
        <div className="metric-val">{total}</div>
        <div className="metric-lbl">Total Applicants</div>
      </div>

      {/* Card 2: Top Matches */}
      <div className="metric-box-inner metric-card-2">
        <div className="metric-val">{topMatches}</div>
        <div className="metric-lbl">Top Matches (≥75%)</div>
      </div>

      {/* Card 3: Avg Fit Score */}
      <div className="metric-box-inner metric-card-3">
        <div className="metric-val">{avgScore}%</div>
        <div className="metric-lbl">Average Fit Score</div>
      </div>

      {/* Card 4: Top Candidate */}
      <div className="metric-box-inner metric-card-4">
        <div className="metric-val">
          {topCandidate ? `${topCandidate.overall_score.toFixed(1)}%` : '0.0%'}
        </div>
        <div className="metric-lbl">
          {topCandidate ? topCandidate.candidate_name : 'Top Candidate'}
        </div>
      </div>
    </div>
  );
};

