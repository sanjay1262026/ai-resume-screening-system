import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { BarChart3, PieChart as PieIcon, AlertTriangle, Users } from 'lucide-react';
import { Candidate } from '../types';

interface AnalyticsTabProps {
  candidates: Candidate[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ candidates }) => {
  if (candidates.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
        <BarChart3 className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No candidate analytics available</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Ingest resumes or load sample candidates to view pool distributions and skill gap analysis.
        </p>
      </div>
    );
  }

  // 1. Score Distribution Data
  const scoreBuckets = [
    { range: '< 50%', count: 0, color: '#f43f5e' },
    { range: '50 - 64%', count: 0, color: '#f97316' },
    { range: '65 - 74%', count: 0, color: '#f59e0b' },
    { range: '75 - 84%', count: 0, color: '#10b981' },
    { range: '85 - 100%', count: 0, color: '#059669' },
  ];

  for (const c of candidates) {
    if (c.overall_score < 50) scoreBuckets[0].count++;
    else if (c.overall_score < 65) scoreBuckets[1].count++;
    else if (c.overall_score < 75) scoreBuckets[2].count++;
    else if (c.overall_score < 85) scoreBuckets[3].count++;
    else scoreBuckets[4].count++;
  }

  // 2. Top Missing Skills
  const missingSkillCount: Record<string, number> = {};
  for (const c of candidates) {
    for (const skill of c.missing_skills) {
      missingSkillCount[skill] = (missingSkillCount[skill] || 0) + 1;
    }
  }

  const missingSkillsData = Object.entries(missingSkillCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // 3. Status Distribution
  const statusCounts = [
    { name: 'Top Match (≥75%)', value: candidates.filter(c => c.status === 'Top Match').length, color: '#10b981' },
    { name: 'Potential Fit (60-74%)', value: candidates.filter(c => c.status === 'Potential Fit').length, color: '#f59e0b' },
    { name: 'Low Match (<60%)', value: candidates.filter(c => c.status === 'Low Match').length, color: '#f43f5e' },
  ].filter(s => s.value > 0);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" /> Talent Pool & Gap Analytics
        </h2>
        <p className="text-xs text-slate-500">
          Cohort-level insights, score distributions, and most frequent skill deficiencies
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Score Distribution</h3>
            <p className="text-xs text-slate-500">Applicant frequency grouped by fit score bracket</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreBuckets}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {scoreBuckets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Tier Proportion */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-base font-bold text-slate-900">Status Tier Allocation</h3>
            <p className="text-xs text-slate-500">Proportion of top matches vs potential vs low fit</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Missing Skills */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Most Common Skill Deficiencies
            </h3>
            <p className="text-xs text-slate-500">Skills required by the JD that candidates frequently miss</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
            Pool Gap Indicator
          </span>
        </div>

        {missingSkillsData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missingSkillsData} layout="vertical" margin={{ left: 30, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={110} />
                <Tooltip
                  formatter={(val) => [`${val} candidates missing`, 'Count']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#f43f5e" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-8 text-center italic">No skill deficiencies found in current pool.</p>
        )}
      </div>
    </div>
  );
};
