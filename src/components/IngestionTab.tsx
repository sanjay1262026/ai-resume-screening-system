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
      <div className="glass-card">
        <h3 className="text-xl font-bold text-slate-900 mb-3">Job Description</h3>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Template:
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full bg-white border border-slate-300 text-sm rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          >
            <option value="custom">Custom Input</option>
            <option value="ai_ml">Senior AI / ML Engineer</option>
            <option value="fullstack">Full Stack Web Developer</option>
            <option value="data_analyst">Data Analyst</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Job Description:
          </label>
          <textarea
            rows={10}
            value={jdText}
            onChange={(e) => {
              onJdTextChange(e.target.value);
              setSelectedTemplate('custom');
            }}
            placeholder="Paste job description here..."
            className="w-full bg-white border border-slate-300 rounded-xl p-3.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs resize-y"
          />
        </div>

        {/* Real-time Extracted Requirements Preview */}
        {jdText.trim() && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-2">Job Criteria</h4>
            <p className="text-xs text-slate-700 mb-2">
              <strong>Experience:</strong> <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs">{reqs.min_experience_years}+ Years</code> | <strong>Education:</strong> <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs">{reqs.min_education}</code>
            </p>
            <p className="text-xs font-bold text-slate-800 mb-1.5">Target Skills:</p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {reqs.required_skills.length > 0 ? (
                reqs.required_skills.map((skill) => (
                  <span
                    key={skill}
                    className="skill-tag skill-tag-matched inline-flex items-center gap-1"
                  >
                    ✓ {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No recognized keywords yet. Enter skills like Python, React, SQL...</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Column 2: Candidate Resumes Ingestion */}
      <div className="glass-card flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Candidate Resumes</h3>

          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Upload (PDF, DOCX, TXT):
          </label>

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
                ? 'border-indigo-500 bg-indigo-50/60'
                : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/80'
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
            <p className="text-xs text-slate-500 mt-1">200MB per file • PDF, DOCX, DOC, TXT</p>
          </div>

          {/* File Queue List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
                <span>Queued Uploads ({uploadedFiles.length})</span>
                <button
                  onClick={() => setUploadedFiles([])}
                  className="text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
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
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Sample Candidates Checkbox & Clear Row */}
          <div className="grid grid-cols-2 gap-4 items-center mt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={includeSamples}
                onChange={(e) => setIncludeSamples(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span>Use Sample Resumes</span>
            </label>

            <button
              onClick={() => {
                setUploadedFiles([]);
                onScreeningComplete([]);
              }}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 px-3 rounded-lg border border-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>🗑️ Clear</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={handleRunScreening}
            disabled={isProcessing}
            className="btn-purple w-full py-3.5 text-base font-bold text-white shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing AI Screening...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Run AI Screening</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
