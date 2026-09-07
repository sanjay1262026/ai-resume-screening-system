import React, { useState } from 'react';
import { Cpu, BookOpen, Layers, Target, CheckCircle2, ChevronRight } from 'lucide-react';
import { SKILL_TAXONOMY, CANONICAL_NAMES } from '../utils/skillTaxonomy';

export const EngineTab: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>(Object.keys(SKILL_TAXONOMY)[0]);

  const categories = Object.keys(SKILL_TAXONOMY);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" /> Scoring Engine & Algorithm Architecture
        </h2>
        <p className="text-xs text-slate-500">
          Transparent multi-factor methodology, vector mathematics, and canonical technical skill taxonomy
        </p>
      </div>

      {/* Math & Logic Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Composite Score Formula */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" /> Multi-Factor Composite Scoring
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Rather than relying solely on naive keyword counting, candidates are evaluated across 4 weighted dimensions with user-configurable weights:
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-mono text-xs text-indigo-900">
            <strong>Composite Score</strong> = (Skill_Match × W_s) + (Semantic_Sim × W_v) + (Exp_Match × W_e) + (Edu_Match × W_ed)
          </div>

          <div className="space-y-2 text-xs text-slate-700">
            <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
              <span className="font-bold text-indigo-950">1. Skill Match (Default 40%):</span> Ratio of target job skills present in candidate resume evaluated via boundary regex matching.
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50/50 border border-purple-100">
              <span className="font-bold text-purple-950">2. Semantic Similarity (Default 35%):</span> Cosine similarity in sublinear TF-IDF vector space with bi-gram n-gram modeling.
            </div>
            <div className="p-2.5 rounded-lg bg-teal-50/50 border border-teal-100">
              <span className="font-bold text-teal-950">3. Experience Fit (Default 15%):</span> Evaluates extracted years of professional experience against JD minimum requirement.
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
              <span className="font-bold text-amber-950">4. Education Match (Default 10%):</span> Compares highest degree attainment against baseline degree thresholds.
            </div>
          </div>
        </div>

        {/* Vector Similarity Explanation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" /> Sublinear TF-IDF & Cosine Similarity
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Text from both the job specification and candidate resumes is normalized, filtered for stop words, and transformed into high-dimensional vector representations.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs text-slate-800 font-mono">
            <div>
              <strong>Sublinear TF:</strong> <span className="text-slate-600">tf = 1 + ln(f) if f &gt; 0 else 0</span>
            </div>
            <div>
              <strong>IDF:</strong> <span className="text-slate-600">idf = ln((1 + |D|) / (1 + df)) + 1</span>
            </div>
            <div>
              <strong>Cosine Sim:</strong> <span className="text-slate-600">cos(θ) = (v_jd · v_res) / (||v_jd|| ||v_res||)</span>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2">
            <p>
              • <strong>Bi-gram tokens:</strong> Captures compound terms like "deep learning", "rest api", and "machine learning" without fragmentation.
            </p>
            <p>
              • <strong>Sublinear scaling:</strong> Prevents keyword stuffing by applying logarithmic dampening to repetitive words.
            </p>
          </div>
        </div>
      </div>

      {/* Skill Taxonomy Browser */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" /> 250+ Technical Skill Taxonomy
          </h3>
          <p className="text-xs text-slate-500">
            Categorized technical skills with canonical formatting and boundary-safe extraction
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-100 pb-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat} ({SKILL_TAXONOMY[cat].length})
            </button>
          ))}
        </div>

        {/* Skill badges list */}
        <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-100">
          {SKILL_TAXONOMY[activeCategory].map((rawSkill) => {
            const displayName = CANONICAL_NAMES[rawSkill] || (rawSkill.length > 3 ? rawSkill.charAt(0).toUpperCase() + rawSkill.slice(1) : rawSkill.toUpperCase());
            return (
              <span
                key={rawSkill}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-white text-slate-800 border border-slate-200/80 shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                {displayName}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
