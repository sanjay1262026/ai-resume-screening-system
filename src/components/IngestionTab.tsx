import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Briefcase,
  GraduationCap,
  Clock,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { parseJobRequirements } from '../utils/skillTaxonomy';
import { SAMPLE_JOB_DESCRIPTIONS, SAMPLE_CANDIDATES } from '../data/sampleData';
import { parseUploadedResumeFile } from '../utils/resumeParser';
import { evaluateCandidate } from '../utils/scoringEngine';
import { Candidate, ScoringWeights } from '../types';

interface IngestionTabProps {
  jdText: string;
  onJdTextChange: (text: string) => void;
  jdTitle: string;
  onJdTitleChange: (title: string) => void;
  onScreeningComplete: (candidates: Candidate[]) => void;
  weights: ScoringWeights;
}

export const IngestionTab: React.FC<IngestionTabProps> = ({
  jdText,
  onJdTextChange,
  jdTitle,
  onJdTitleChange,
  onScreeningComplete,
  weights,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('ai_ml');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [includeSamples, setIncludeSamples] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reqs = parseJobRequirements(jdText);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === 'custom') return;
    const found = SAMPLE_JOB_DESCRIPTIONS.find(j => j.id === templateId);
    if (found) {
      onJdTextChange(found.content);
      onJdTitleChange(found.title);
    }
  };

  const handleFilesAdded = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => {
      const ext = f.name.toLowerCase().split('.').pop();
      return ['pdf', 'docx', 'doc', 'txt'].includes(ext || '');
    });
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRunScreening = async () => {
    if (!jdText.trim()) {
      alert('Please enter or select a Job Description first.');
      return;
    }

    setIsProcessing(true);

    try {
      const candidateList: Candidate[] = [];
      const evaluatedNames = new Set<string>();

      // 1. Process custom uploaded files if any
      for (const file of uploadedFiles) {
        const parsed = await parseUploadedResumeFile(file);
        const evalRes = evaluateCandidate(
          {
            candidate_name: parsed.candidate_name,
            filename: parsed.filename,
            email: parsed.email,
            phone: parsed.phone,
            text: parsed.text,
            experience_years: parsed.experience_years,
            education: parsed.education,
          },
          jdText,
          weights
        );
        candidateList.push(evalRes);
        evaluatedNames.add(evalRes.candidate_name);
      }

      // 2. Process sample candidates if checked
      if (includeSamples) {
        for (const sample of SAMPLE_CANDIDATES) {
          if (!evaluatedNames.has(sample.name)) {
            const evalRes = evaluateCandidate(
              {
                candidate_name: sample.name,
                filename: sample.filename,
                email: sample.email,
                phone: sample.phone,
                text: sample.rawText,
                experience_years: sample.experience_years,
                education: sample.education,
              },
              jdText,
              weights
            );
            candidateList.push(evalRes);
          }
        }
      }

      candidateList.sort((a, b) => b.overall_score - a.overall_score);
      onScreeningComplete(candidateList);
    } catch (err) {
      console.error('Error screening resumes:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Column 1: Job Description Specification */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Job Description (JD)</h2>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
              Step 1
            </span>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Select Industry Template or Custom:
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl px-3.5 py-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ai_ml">Senior AI / ML Engineer</option>
              <option value="fullstack">Full Stack Web Developer</option>
              <option value="data_analyst">Data Analyst Specialist</option>
              <option value="custom">Custom Job Description</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Job Requirements Text:
            </label>
            <textarea
              rows={8}
              value={jdText}
              onChange={(e) => {
                onJdTextChange(e.target.value);
                setSelectedTemplate('custom');
              }}
              placeholder="Paste target job responsibilities, required skills, and qualification thresholds here..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
          </div>

          {/* Real-time Extracted Requirements Preview */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Extracted Target Criteria
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200/60">
                <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  Experience: <strong className="text-slate-900">{reqs.min_experience_years}+ Years</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200/60">
                <GraduationCap className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="truncate">
                  Edu: <strong className="text-slate-900">{reqs.min_education}</strong>
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-600 block mb-1.5">
                Target Skills Detected ({reqs.required_skills.length}):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {reqs.required_skills.length > 0 ? (
                  reqs.required_skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      ✓ {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No recognized keywords yet. Enter skills like Python, React, SQL...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Candidate Resumes Ingestion */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Candidate Resumes</h2>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">
              Step 2
            </span>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFilesAdded(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={(e) => handleFilesAdded(e.target.files)}
            />
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              Drag & drop resume documents, or <span className="text-indigo-600 hover:underline">browse files</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Supports PDF, Word (.docx), and plain text (.txt)</p>
          </div>

          {/* File Queue List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
                <span>Queued Uploads ({uploadedFiles.length})</span>
                <button
                  onClick={() => setUploadedFiles([])}
                  className="text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear Uploads
                </button>
              </div>
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{file.name}</span>
                    <span className="text-slate-400 text-[10px]">({(file.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Sample Candidates Checkbox */}
          <div className="mt-5 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSamples}
                onChange={(e) => setIncludeSamples(e.target.checked)}
                className="mt-0.5 accent-indigo-600 w-4 h-4 rounded"
              />
              <div className="text-xs">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" /> Include 6 Showcase Candidates
                </span>
                <p className="text-slate-600 mt-0.5">
                  Pre-loads Alex Rivera (Senior AI), Priya Sharma (ML Dev), Marcus Chen (Data Scientist), Sophia Taylor (FullStack), David Miller (Junior), and Emily Watson (Marketing).
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={handleRunScreening}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 shadow-lg shadow-indigo-500/25 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Evaluating Resumes & Vector Similarities...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run AI Screening & Rank Candidates</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
