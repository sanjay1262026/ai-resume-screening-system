import { Candidate, ScoringWeights } from '../types';
import { extractSkillsFromText, parseJobRequirements } from './skillTaxonomy';

const ENGLISH_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'aren', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both',
  'but', 'by', 'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each',
  'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
  'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

function cleanTextForNlp(text: string): string[] {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !ENGLISH_STOP_WORDS.has(w));
  return words;
}

function extractNgrams(words: string[], minN = 1, maxN = 2): string[] {
  const ngrams: string[] = [];
  for (let n = minN; n <= maxN; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(' '));
    }
  }
  return ngrams;
}

export function calculateSemanticSimilarity(jdText: string, resumeText: string): number {
  const jdWords = cleanTextForNlp(jdText);
  const resWords = cleanTextForNlp(resumeText);

  if (jdWords.length === 0 || resWords.length === 0) return 0.0;

  const jdNgrams = extractNgrams(jdWords, 1, 2);
  const resNgrams = extractNgrams(resWords, 1, 2);

  // Frequency count for doc 1 (JD) and doc 2 (Resume)
  const tf1: Record<string, number> = {};
  const tf2: Record<string, number> = {};
  const vocab = new Set<string>();

  for (const ng of jdNgrams) {
    tf1[ng] = (tf1[ng] || 0) + 1;
    vocab.add(ng);
  }
  for (const ng of resNgrams) {
    tf2[ng] = (tf2[ng] || 0) + 1;
    vocab.add(ng);
  }

  // Document count D = 2
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const term of vocab) {
    const count1 = tf1[term] || 0;
    const count2 = tf2[term] || 0;
    
    // Doc frequency df in [1, 2]
    const df = (count1 > 0 ? 1 : 0) + (count2 > 0 ? 1 : 0);
    // Sublinear TF-IDF formula
    const idf = Math.log((1 + 2) / (1 + df)) + 1;

    const w1 = count1 > 0 ? (1 + Math.log(count1)) * idf : 0;
    const w2 = count2 > 0 ? (1 + Math.log(count2)) * idf : 0;

    dotProduct += w1 * w2;
    norm1 += w1 * w1;
    norm2 += w2 * w2;
  }

  if (norm1 === 0 || norm2 === 0) return 0.0;

  const cosine = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  // Scaled similarity calibrated with Python's sklearn TF-IDF multiplier (sim * 250)
  const scaled = Math.min(100.0, Math.max(0.0, cosine * 250.0));
  return parseFloat(scaled.toFixed(1));
}

export function evaluateCandidate(
  candidateData: {
    candidate_name: string;
    filename?: string;
    email?: string;
    phone?: string;
    text?: string;
    experience_years?: number;
    education?: string;
  },
  jdText: string,
  weights: ScoringWeights = { skill: 0.40, semantic: 0.35, experience: 0.15, education: 0.10 }
): Candidate {
  const jdReqs = parseJobRequirements(jdText);
  const jdSkills = new Set(jdReqs.required_skills);
  const minExp = jdReqs.min_experience_years;

  const rawText = candidateData.text || '';
  const candSkillsList = extractSkillsFromText(rawText);
  const candSkills = new Set(candSkillsList);
  const candExp = candidateData.experience_years ?? 1;
  const candEdu = candidateData.education || "Bachelor's Degree";

  // 1. Skill Match Calculation
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const extraSkills: string[] = [];

  if (jdSkills.size > 0) {
    for (const skill of jdSkills) {
      if (candSkills.has(skill)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }
    for (const skill of candSkills) {
      if (!jdSkills.has(skill)) {
        extraSkills.push(skill);
      }
    }
  } else {
    matchedSkills.push(...candSkills);
  }

  const skillScore = jdSkills.size > 0
    ? parseFloat(((matchedSkills.length / jdSkills.size) * 100.0).toFixed(1))
    : (candSkills.size > 0 ? 100.0 : 50.0);

  // 2. Semantic Similarity Score
  const semanticScore = calculateSemanticSimilarity(jdText, rawText);

  // 3. Experience Match Score
  let expScore = 100.0;
  if (minExp === 0) {
    expScore = 100.0;
  } else if (candExp >= minExp) {
    expScore = Math.min(100.0, 100.0 + (candExp - minExp) * 5);
  } else {
    expScore = parseFloat(((candExp / minExp) * 100.0).toFixed(1));
  }

  // 4. Education Score
  let eduScore = 100.0;
  if (jdReqs.min_education.includes('Master') && !candEdu.includes('Master') && !candEdu.includes('Ph.D') && !candEdu.includes('M.S.')) {
    eduScore = 75.0;
  } else if (jdReqs.min_education.includes('Ph.D') && !candEdu.includes('Ph.D')) {
    eduScore = 60.0;
  }

  // Normalize weights
  const totalW = weights.skill + weights.semantic + weights.experience + weights.education;
  const wNorm = totalW > 0 ? {
    skill: weights.skill / totalW,
    semantic: weights.semantic / totalW,
    experience: weights.experience / totalW,
    education: weights.education / totalW,
  } : { skill: 0.4, semantic: 0.35, experience: 0.15, education: 0.1 };

  // 5. Composite Score
  const overallScore = parseFloat((
    (skillScore * wNorm.skill) +
    (semanticScore * wNorm.semantic) +
    (expScore * wNorm.experience) +
    (eduScore * wNorm.education)
  ).toFixed(1));

  // Classification
  let status: 'Top Match' | 'Potential Fit' | 'Low Match' = 'Low Match';
  if (overallScore >= 75) {
    status = 'Top Match';
  } else if (overallScore >= 60) {
    status = 'Potential Fit';
  }

  return {
    candidate_name: candidateData.candidate_name,
    filename: candidateData.filename || `${candidateData.candidate_name.replace(/\s+/g, '_')}.pdf`,
    email: candidateData.email || 'N/A',
    phone: candidateData.phone || 'N/A',
    overall_score: overallScore,
    skill_score: skillScore,
    semantic_score: semanticScore,
    experience_score: expScore,
    education_score: eduScore,
    candidate_exp_years: candExp,
    candidate_edu: candEdu,
    status,
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    extra_skills: extraSkills,
    raw_text: rawText,
    jd_min_exp_years: minExp
  };
}
