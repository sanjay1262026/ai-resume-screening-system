import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Candidate } from '../types';

export function downloadCsvReport(candidates: Candidate[], jdTitle: string): void {
  if (candidates.length === 0) return;

  const headers = [
    'Rank',
    'Candidate Name',
    'Overall Fit (%)',
    'Skill Match (%)',
    'Semantic Fit (%)',
    'Experience Fit (%)',
    'Education Fit (%)',
    'Experience (Years)',
    'Education',
    'Status',
    'Email',
    'Phone',
    'Matched Skills Count',
    'Matched Skills',
    'Missing Skills',
  ];

  const rows = candidates.map((c, idx) => [
    `#${idx + 1}`,
    `"${c.candidate_name}"`,
    c.overall_score,
    c.skill_score,
    c.semantic_score,
    c.experience_score,
    c.education_score,
    c.candidate_exp_years,
    `"${c.candidate_edu}"`,
    `"${c.status}"`,
    `"${c.email}"`,
    `"${c.phone}"`,
    c.matched_skills.length,
    `"${c.matched_skills.join(', ')}"`,
    `"${c.missing_skills.join(', ')}"`,
  ]);

  const csvContent = [
    `# AI Resume Screening System - Candidate Leaderboard Report`,
    `# Job Title: ${jdTitle}`,
    `# Generated At: ${new Date().toLocaleString()}`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `candidates_${jdTitle.toLowerCase().replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadPdfReport(candidates: Candidate[], jdTitle: string): void {
  if (candidates.length === 0) return;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header banner
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('AI Resume Screening & Candidate Ranking', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Role: ${jdTitle}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 24);

  // Summary Metrics Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 38, 182, 22, 3, 3, 'F');

  const total = candidates.length;
  const topCount = candidates.filter(c => c.overall_score >= 75).length;
  const avgScore = (candidates.reduce((sum, c) => sum + c.overall_score, 0) / Math.max(total, 1)).toFixed(1);
  const topCandidate = candidates[0]?.candidate_name || 'N/A';

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Screened: ${total}`, 20, 48);
  doc.text(`Top Matches (>=75%): ${topCount}`, 65, 48);
  doc.text(`Avg Score: ${avgScore}%`, 120, 48);
  doc.text(`Rank #1: ${topCandidate}`, 155, 48);

  // Table
  const tableData = candidates.map((c, i) => [
    `#${i + 1}`,
    c.candidate_name,
    `${c.overall_score}%`,
    `${c.skill_score}%`,
    `${c.semantic_score}%`,
    `${c.candidate_exp_years} yrs`,
    c.status,
  ]);

  autoTable(doc, {
    startY: 66,
    head: [['Rank', 'Candidate Name', 'Overall', 'Skill Fit', 'Semantic', 'Exp', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [102, 126, 234],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 50 },
      2: { cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { cellWidth: 28 },
    },
  });

  // Top candidate detailed overview on remaining space or page 2
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 150;
  if (finalY < 230 && candidates.length > 0) {
    const top = candidates[0];
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Top Candidate Spotlight: ${top.candidate_name}`, 14, finalY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Email: ${top.email}  |  Phone: ${top.phone}  |  Education: ${top.candidate_edu}`, 14, finalY + 18);
    doc.text(`Matched Skills: ${top.matched_skills.slice(0, 10).join(', ')}`, 14, finalY + 24);
    if (top.missing_skills.length > 0) {
      doc.text(`Identified Gaps: ${top.missing_skills.slice(0, 6).join(', ')}`, 14, finalY + 30);
    }
  }

  doc.save(`screening_report_${jdTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`);
}
