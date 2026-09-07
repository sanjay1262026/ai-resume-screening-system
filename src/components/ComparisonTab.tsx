import React, { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Swords, HelpCircle, CheckCircle2, AlertCircle, Award } from 'lucide-react';
import { Candidate } from '../types';
import { generateCandidateFeedback } from '../utils/feedbackGenerator';

interface ComparisonTabProps {
  candidates: Candidate[];
}

export const ComparisonTab: React.FC<ComparisonTabProps> = ({ candidates }) => {
  if (candidates.length < 2) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
        <Swords className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">At least 2 candidates required for comparison</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Please ingest resumes or load the showcase dataset to enable side-by-side radar analysis and question generation.
        </p>
      </div>
    );
  }

  const [candAName, setCandAName] = useState<string>(candidates[0].candidate_name);
  const [candBName, setCandBName] = useState<string>(candidates[1]?.candidate_name || candidates[0].candidate_name);

  const candA = candidates.find(c => c.candidate_name === candAName) || candidates[0];
  const candB = candidates.find(c => c.candidate_name === candBName) || candidates[1];

  const fbA = generateCandidateFeedback(candA);
  const fbB = generateCandidateFeedback(candB);

  // Radar chart data structure
  const radarData = [
    { metric: 'Skill Match', A: candA.skill_score, B: candB.skill_score, fullMark: 100 },
    { metric: 'Semantic Fit', A: candA.semantic_score, B: candB.semantic_score, fullMark: 100 },
    { metric: 'Experience', A: candA.experience_score, B: candB.experience_score, fullMark: 100 },
    { metric: 'Education', A: candA.education_score, B: candB.education_score, fullMark: 100 },
    { metric: 'Overall Fit', A: candA.overall_score, B: candB.overall_score, fullMark: 100 },
  ];

  const comparisonRows = [
    { label: 'Overall Match Score', valA: `${candA.overall_score}%`, valB: `${candB.overall_score}%`, winner: candA.overall_score > candB.overall_score ? 'A' : candA.overall_score < candB.overall_score ? 'B' : 'Tie' },
    { label: 'Skill Match Alignment', valA: `${candA.skill_score}%`, valB: `${candB.skill_score}%`, winner: candA.skill_score > candB.skill_score ? 'A' : candA.skill_score < candB.skill_score ? 'B' : 'Tie' },
    { label: 'Semantic TF-IDF Fit', valA: `${candA.semantic_score}%`, valB: `${candB.semantic_score}%`, winner: candA.semantic_score > candB.semantic_score ? 'A' : candA.semantic_score < candB.semantic_score ? 'B' : 'Tie' },
    { label: 'Experience Score', valA: `${candA.experience_score}%`, valB: `${candB.experience_score}%`, winner: candA.experience_score > candB.experience_score ? 'A' : candA.experience_score < candB.experience_score ? 'B' : 'Tie' },
    { label: 'Years of Experience', valA: `${candA.candidate_exp_years} Years`, valB: `${candB.candidate_exp_years} Years`, winner: candA.candidate_exp_years > candB.candidate_exp_years ? 'A' : candA.candidate_exp_years < candB.candidate_exp_years ? 'B' : 'Tie' },
    { label: 'Education Qualification', valA: candA.candidate_edu, valB: candB.candidate_edu, winner: 'Tie' },
    { label: 'Matched Skills Count', valA: `${candA.matched_skills.length} skills`, valB: `${candB.matched_skills.length} skills`, winner: candA.matched_skills.length > candB.matched_skills.length ? 'A' : candA.matched_skills.length < candB.matched_skills.length ? 'B' : 'Tie' },
    { label: 'Classification Status', valA: candA.status, valB: candB.status, winner: 'Tie' },
  ];

  return (
    <div className="space-y-6">
      {/* Selection Row */}
      <div className="glass-card">
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Swords className="w-5 h-5 text-indigo-600" /> Head-to-Head Comparison
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl">
            <label className="block text-xs font-bold uppercase tracking-wider text-indigo-800 mb-1.5">
              Candidate A:
            </label>
            <select
              value={candAName}
              onChange={(e) => setCandAName(e.target.value)}
              className="w-full bg-white border border-indigo-200 text-sm font-bold text-slate-900 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            >
              {candidates.map((c) => (
                <option key={c.candidate_name} value={c.candidate_name}>
                  {c.candidate_name} ({c.overall_score.toFixed(1)}%)
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl">
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-800 mb-1.5">
              Candidate B:
            </label>
            <select
              value={candBName}
              onChange={(e) => setCandBName(e.target.value)}
              className="w-full bg-white border border-purple-200 text-sm font-bold text-slate-900 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
            >
              {candidates.map((c) => (
                <option key={c.candidate_name} value={c.candidate_name}>
                  {c.candidate_name} ({c.overall_score.toFixed(1)}%)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visual Comparison: Radar Chart & Metrics Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="glass-card flex flex-col items-center justify-between">
          <div className="w-full mb-2">
            <h4 className="text-base font-bold text-slate-900">Skill Radar</h4>
            <p className="text-xs text-slate-500">Overlay of 5 core qualification dimensions</p>
          </div>

          <div className="w-full h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
                <Radar
                  name={candA.candidate_name}
                  dataKey="A"
                  stroke="#4f46e5"
                  fill="#6366f1"
                  fillOpacity={0.35}
                />
                <Radar
                  name={candB.candidate_name}
                  dataKey="B"
                  stroke="#9333ea"
                  fill="#a855f7"
                  fillOpacity={0.35}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="glass-card overflow-x-auto">
          <div className="mb-4">
            <h4 className="text-base font-bold text-slate-900">Score Breakdown</h4>
            <p className="text-xs text-slate-500">Side-by-side metric comparison</p>
          </div>

          <table className="w-full text-xs text-left border-collapse rounded-xl overflow-hidden border border-slate-200 shadow-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-100 to-slate-200/80 text-slate-800 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Metric</th>
                <th className="py-2.5 px-3 text-indigo-700">A ({candA.candidate_name})</th>
                <th className="py-2.5 px-3 text-purple-700">B ({candB.candidate_name})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {comparisonRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-700">{row.label}</td>
                  <td className={`py-2.5 px-3 font-mono font-bold ${row.winner === 'A' ? 'text-indigo-600 bg-indigo-50/40' : 'text-slate-800'}`}>
                    {row.valA} {row.winner === 'A' && '★'}
                  </td>
                  <td className={`py-2.5 px-3 font-mono font-bold ${row.winner === 'B' ? 'text-purple-600 bg-purple-50/40' : 'text-slate-800'}`}>
                    {row.valB} {row.winner === 'B' && '★'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Feedback & Questions Comparison */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-slate-900 mb-4">AI Feedback</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Candidate A Card */}
          <div className="glass-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-indigo-900">{candA.candidate_name}</h3>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                {candA.overall_score.toFixed(1)}% Fit
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-700">
                <strong>Assessment:</strong> {fbA.summary}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1">
                Strengths
              </h4>
              <ul className="text-xs text-slate-700 space-y-1 pl-1">
                {fbA.strengths.map((s, i) => (
                  <li key={i}>- {s}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1">
                Gaps
              </h4>
              <ul className="text-xs text-slate-700 space-y-1 pl-1">
                {fbA.weaknesses.map((w, i) => (
                  <li key={i}>- {w}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1">
                Interview Questions
              </h4>
              <div className="space-y-1.5">
                {fbA.interview_questions.map((q, i) => (
                  <div key={i} className="text-xs font-bold text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                    {q}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Candidate B Card */}
          <div className="glass-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-purple-900">{candB.candidate_name}</h3>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                {candB.overall_score.toFixed(1)}% Fit
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-700">
                <strong>Assessment:</strong> {fbB.summary}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1">
                Strengths
              </h4>
              <ul className="text-xs text-slate-700 space-y-1 pl-1">
                {fbB.strengths.map((s, i) => (
                  <li key={i}>- {s}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1">
                Gaps
              </h4>
              <ul className="text-xs text-slate-700 space-y-1 pl-1">
                {fbB.weaknesses.map((w, i) => (
                  <li key={i}>- {w}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1">
                Interview Questions
              </h4>
              <div className="space-y-1.5">
                {fbB.interview_questions.map((q, i) => (
                  <div key={i} className="text-xs font-bold text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                    {q}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
