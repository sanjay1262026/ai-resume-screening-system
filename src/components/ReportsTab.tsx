import React, { useState } from 'react';
import { FileDown, FileSpreadsheet, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Candidate } from '../types';
import { downloadCsvReport, downloadPdfReport } from '../utils/reportGenerator';

interface ReportsTabProps {
  candidates: Candidate[];
  jdTitle: string;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ candidates, jdTitle }) => {
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadCsv = () => {
    setDownloadingCsv(true);
    setTimeout(() => {
      downloadCsvReport(candidates, jdTitle);
      setDownloadingCsv(false);
    }, 400);
  };

  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    setTimeout(() => {
      downloadPdfReport(candidates, jdTitle);
      setDownloadingPdf(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
          <FileDown className="w-5 h-5 text-indigo-600" /> Export & Executive Reporting
        </h2>
        <p className="text-xs text-slate-500">
          Export candidate evaluation results, ranking tables, and skill gap summaries for hiring committee review
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Export Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Spreadsheet Data Export (.CSV)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full tabulated dataset including overall fit %, individual subscores (skill, semantic, experience, education), matched skills count, missing skills, and applicant contact information.
            </p>
            <ul className="text-xs text-slate-500 space-y-1 pt-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Compatible with Excel, Google Sheets, and ATS tools
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Instant client-side download
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100">
            <button
              onClick={handleDownloadCsv}
              disabled={candidates.length === 0 || downloadingCsv}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {downloadingCsv ? 'Generating CSV...' : `Download CSV Report (${candidates.length} records)`}
            </button>
          </div>
        </div>

        {/* PDF Executive Report Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Executive Summary PDF</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Clean, formatted hiring report with an executive summary banner, key cohort statistics, styled candidate rankings table, and top candidate spotlight review.
            </p>
            <ul className="text-xs text-slate-500 space-y-1 pt-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Formatted for leadership & recruiter presentations
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Includes top candidate profile summary
              </li>
            </ul>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100">
            <button
              onClick={handleDownloadPdf}
              disabled={candidates.length === 0 || downloadingPdf}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
            >
              <FileText className="w-4 h-4" />
              {downloadingPdf ? 'Compiling PDF...' : `Download Executive PDF (${candidates.length} records)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
