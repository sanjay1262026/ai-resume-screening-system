import { Candidate, CandidateFeedback } from '../types';

export function generateCandidateFeedback(cand: Candidate): CandidateFeedback {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const interviewQuestions: string[] = [];

  // Strengths
  if (cand.matched_skills.length > 0) {
    strengths.push(`Strong skill alignment in key requirements: ${cand.matched_skills.slice(0, 5).join(', ')}.`);
  }
  if (cand.candidate_exp_years >= cand.jd_min_exp_years) {
    strengths.push(`Meets or exceeds required experience level with ${cand.candidate_exp_years} years of industry experience.`);
  }
  if (cand.semantic_score >= 70) {
    strengths.push('High contextual relevance between candidate resume and job responsibilities.');
  }

  // Weaknesses / Gaps
  if (cand.missing_skills.length > 0) {
    weaknesses.push(`Lacks explicit mentions of required key skills: ${cand.missing_skills.join(', ')}.`);
  }
  if (cand.candidate_exp_years < cand.jd_min_exp_years) {
    weaknesses.push(`Experience level (${cand.candidate_exp_years} yrs) is below recommended minimum (${cand.jd_min_exp_years} yrs).`);
  }
  if (cand.semantic_score < 50) {
    weaknesses.push('Low overall document vocabulary alignment with the target job description.');
  }

  // Generate Tailored Interview Questions
  if (cand.matched_skills.length > 0) {
    const topSkill = cand.matched_skills[0];
    interviewQuestions.push(
      `1. Could you describe a production project where you utilized ${topSkill} and how you optimized its performance?`
    );
  }
  if (cand.matched_skills.length > 1) {
    const secondSkill = cand.matched_skills[1];
    interviewQuestions.push(
      `2. How do you integrate ${cand.matched_skills[0]} with ${secondSkill} in real-world application architectures?`
    );
  }
  if (cand.missing_skills.length > 0) {
    const topMissing = cand.missing_skills[0];
    interviewQuestions.push(
      `3. The role requires ${topMissing}, which was not explicitly highlighted in your resume. What is your experience with ${topMissing} or similar technologies?`
    );
  }

  interviewQuestions.push(
    `4. Walk us through a complex technical challenge you faced during your ${cand.candidate_exp_years} years in the industry and how you resolved it.`
  );

  const summary = `Candidate ${cand.candidate_name} scored ${cand.overall_score}% overall fit. ${
    cand.overall_score >= 75
      ? 'Highly recommended for technical round.'
      : cand.overall_score >= 60
      ? 'Moderate fit, consider probing missing skills in interview.'
      : 'Low alignment with core criteria.'
  }`;

  return {
    summary,
    strengths: strengths.length > 0 ? strengths : ['Basic qualifications present.'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['No major skill gaps identified.'],
    interview_questions: interviewQuestions,
  };
}
