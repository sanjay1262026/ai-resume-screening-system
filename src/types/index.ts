export interface Candidate {
  candidate_name: string;
  filename: string;
  email: string;
  phone: string;
  overall_score: number;
  skill_score: number;
  semantic_score: number;
  experience_score: number;
  education_score: number;
  candidate_exp_years: number;
  candidate_edu: string;
  status: 'Top Match' | 'Potential Fit' | 'Low Match';
  matched_skills: string[];
  missing_skills: string[];
  extra_skills: string[];
  raw_text: string;
  jd_min_exp_years: number;
}

export interface JobRequirements {
  title: string;
  min_experience_years: number;
  min_education: string;
  required_skills: string[];
  raw_text: string;
}

export interface ScoringWeights {
  skill: number;
  semantic: number;
  experience: number;
  education: number;
}

export interface CandidateFeedback {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  interview_questions: string[];
}

export interface ScreeningSession {
  id: number;
  jd_title: string;
  jd_text: string;
  created_at: string;
  candidates: Candidate[];
}

export interface User {
  id: number;
  username: string;
  full_name: string;
}
