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
import { BarChart3, AlertTriangle } from 'lucide-react';
import { Candidate } from '../types';

interface AnalyticsTabProps {
  candidates: Candidate[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ candidates }) => {
  if (candidates.length === 0) {
    return (
      <div className="glass-card text-center py-12">
        <BarChart3 className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">No candidate analytics available</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Run screening first to see analytics.
        </p>
      </div>
    );
  }

  // Summary Metrics
  const total = candidates.length;
  const avgScore = candidates.reduce((acc, c) => acc + c.overall_score, 0) / total;
  const topCount = candidates.filter((c) => c.status === 'Top Match').length;
  const topRate = (topCount / total) * 100;
  const avgExp = candidates.reduce((acc, c) => acc + c.candidate_exp_years, 0) / total;

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

  // 2. Top Missing Skills & Gaps
  const missingSkillCount: Record<string, number> = {};
  for (const c of candidates) {
    for (const skill of c.missing_skills) {
      missingSkillCount[skill] = (missingSkillCount[skill] || 0) + 1;
    }
  }

  const missingSkillsData = Object.entries(missingSkillCount)
    .map(([name, count]) => ({ name, count, missingRate: ((count / total) * 100).toFixed(1) }))
    .sort((a, b) => b.count - a.count);

  // 3. Status Distribution
  const statusCounts = [
    { name: 'Top Match (≥75%)', value: candidates.filter(c => c.status === 'Top Match').length, color: '#10b981' },
    { name: 'Potential Fit (60-74%)', value: candidates.filter(c => c.status === 'Potential Fit').length, color: '#f59e0b' },
    { name: 'Low Match (<60%)', value: candidates.filter(c => c.status === 'Low Match').length, color: '#f43f5e' },
  ].filter(s => s.value > 0);

  // 4. Most Common Matched Skills
  const matchedSkillCount: Record<string, number> = {};
  for (const c of candidates) {
    for (const skill of c.matched_skills) {
      matchedSkillCount[skill] = (matchedSkillCount[skill] || 0) + 1;
    }
  }
  const matchedSkillsData = Object.entries(matchedSkillCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Subheader & Top Metrics */}
      <div className="glass-card">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Talent Pool Analytics</h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="metric-box-inner metric-card-1">
            <span className="metric-label">Total Candidates</span>
            <span className="metric-value">{total}</span>
          </div>
          <div className="metric-box-inner metric-card-2">
            <span className="metric-label">Avg Fit Score</span>
            <span className="metric-value">{avgScore.toFixed(1)}%</span>
          </div>
          <div className="metric-box-inner metric-card-3">
            <span className="metric-label">Top Fit Rate</span>
            <span className="metric-value">{topRate.toFixed(1)}%</span>
          </div>
          <div className="metric-box-inner metric-card-4">
            <span className="metric-label">Avg Experience</span>
            <span className="metric-value">{avgExp.toFixed(1)} Y</span>
          </div>
        </div>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Chart */}
        <div className="glass-card">
          <div className="mb-4">
            <h4 className="text-base font-bold text-slate-900">Score Distribution</h4>
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

        {/* Status Tier Allocation */}
        <div className="glass-card flex flex-col justify-between">
          <div className="mb-2">
            <h4 className="text-base font-bold text-slate-900">Candidate Status Breakdown</h4>
            <p className="text-xs text-slate-500">Proportion of top matches vs potential vs low fit</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
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

        {/* Most Frequent Matched Skills */}
        <div className="glass-card">
          <div className="mb-4">
            <h4 className="text-base font-bold text-slate-900">Top Matched Skills Frequency</h4>
            <p className="text-xs text-slate-500">Most commonly demonstrated skills across candidates</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={matchedSkillsData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={100} />
                <Tooltip
                  formatter={(val) => [`${val} candidates`, 'Frequency']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Missing Skills */}
        <div className="glass-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Most Missing Skills
              </h4>
              <p className="text-xs text-slate-500">Skills required by JD frequently lacking in resumes</p>
            </div>
          </div>

          {missingSkillsData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={missingSkillsData.slice(0, 8)} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={100} />
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

      {/* Skill Gap Analysis Table */}
      <div className="glass-card">
        <h4 className="text-lg font-bold text-slate-900 mb-2">Skill Gap Analysis</h4>
        <p className="text-xs text-slate-500 mb-4">Detailed breakdown of candidate deficiencies against job requirements</p>

        {missingSkillsData.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-100 to-slate-200/80 text-slate-800 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Missing Skill</th>
                  <th className="py-2.5 px-3">Candidates Lacking</th>
                  <th className="py-2.5 px-3">Deficit Rate (% of Pool)</th>
                  <th className="py-2.5 px-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {missingSkillsData.map((gap, i) => {
                  const rate = parseFloat(gap.missingRate);
                  const severity = rate >= 60 ? 'Critical Gap' : rate >= 30 ? 'Moderate Gap' : 'Minor Gap';
                  const badgeClass =
                    rate >= 60
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : rate >= 30
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{gap.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{gap.count} of {total}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{gap.missingRate}%</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeClass}`}>
                          {severity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 italic">No missing skills detected in the current cohort.</p>
        )}
      </div>
    </div>
  );
};

