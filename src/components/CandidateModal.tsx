import React from 'react';
import {
  X,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Candidate } from '../types';
import { generateCandidateFeedback } from '../utils/feedbackGenerator';

interface CandidateModalProps {
  candidate: Candidate | null;
  onClose: () => void;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({ candidate, onClose }) => {
  if (!candidate) return null;

  const feedback = generateCandidateFeedback(candidate);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{candidate.candidate_name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(candidate.status)}`}>
                {candidate.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {candidate.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {candidate.phone}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {candidate.candidate_exp_years} Years Experience
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> {candidate.candidate_edu}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Score breakdown metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">Overall Fit</span>
              <span className="text-2xl font-extrabold text-indigo-900">{candidate.overall_score}%</span>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Skill Match</span>
              <span className="text-2xl font-extrabold text-emerald-900">{candidate.skill_score}%</span>
            </div>
            <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">Semantic Sim</span>
              <span className="text-2xl font-extrabold text-purple-900">{candidate.semantic_score}%</span>
            </div>
            <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-3 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 block">Experience</span>
              <span className="text-2xl font-extrabold text-teal-900">{candidate.experience_score}%</span>
            </div>
          </div>

          {/* Matched Skills */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Matched Skills ({candidate.matched_skills.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {candidate.matched_skills.length > 0 ? (
                candidate.matched_skills.map((s) => (
                  <span
                    key={s}
                    className="skill-tag skill-tag-matched"
                  >
                    ✓ {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No exact skill matches with job description.</span>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          {candidate.missing_skills.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Missing Requirements ({candidate.missing_skills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {candidate.missing_skills.map((s) => (
                  <span
                    key={s}
                    className="skill-tag skill-tag-missing"
                  >
                    ✕ {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional Skills */}
          {candidate.extra_skills.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-500" /> Additional Skills Not in JD ({candidate.extra_skills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {candidate.extra_skills.slice(0, 15).map((s) => (
                  <span
                    key={s}
                    className="skill-tag skill-tag-matched"
                  >
                    + {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Feedback & Interview Questions */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600" /> Tailored Interview Questions
            </h4>
            <p className="text-xs text-slate-600 italic">{feedback.summary}</p>
            <div className="space-y-2">
              {feedback.interview_questions.map((q, i) => (
                <div key={i} className="text-xs font-medium text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200/80">
                  {q}
                </div>
              ))}
            </div>
          </div>

          {/* Raw Text Extract */}
          {candidate.raw_text && (
            <details className="text-xs text-slate-600">
              <summary className="font-semibold text-slate-700 cursor-pointer flex items-center gap-1 hover:text-indigo-600">
                <FileText className="w-3.5 h-3.5" /> View Extracted Resume Plaintext
              </summary>
              <pre className="mt-2 p-3 bg-slate-100 rounded-lg text-[11px] font-mono text-slate-800 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {candidate.raw_text}
              </pre>
            </details>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
