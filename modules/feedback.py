def generate_candidate_feedback(eval_result):
    """
    Generates actionable feedback, strengths, missing critical skills, 
    and customized technical interview questions for a candidate.
    """
    cand_name = eval_result["candidate_name"]
    score = eval_result["overall_score"]
    matched = eval_result["matched_skills"]
    missing = eval_result["missing_skills"]
    exp_years = eval_result["candidate_exp_years"]
    min_exp = eval_result["jd_min_exp_years"]

    strengths = []
    weaknesses = []
    interview_questions = []

    # Strengths
    if matched:
        strengths.append(f"Strong skill alignment in key requirements: {', '.join(matched[:5])}.")
    if exp_years >= min_exp:
        strengths.append(f"Meets or exceeds required experience level with {exp_years} years of industry experience.")
    if eval_result["semantic_score"] >= 70:
        strengths.append("High contextual relevance between candidate resume and job responsibilities.")

    # Weaknesses / Skill Gaps
    if missing:
        weaknesses.append(f"Lacks explicit mentions of required key skills: {', '.join(missing)}.")
    if exp_years < min_exp:
        weaknesses.append(f"Experience level ({exp_years} yrs) is below recommended minimum ({min_exp} yrs).")
    if eval_result["semantic_score"] < 50:
        weaknesses.append("Low overall document vocabulary alignment with the target job description.")

    # Generate Tailored Interview Questions
    if matched:
        top_skill = matched[0]
        interview_questions.append(
            f"1. Could you describe a production project where you utilized {top_skill} and how you optimized its performance?"
        )
    if len(matched) > 1:
        second_skill = matched[1]
        interview_questions.append(
            f"2. How do you integrate {matched[0]} with {second_skill} in real-world application architectures?"
        )

    if missing:
        top_missing = missing[0]
        interview_questions.append(
            f"3. The role requires {top_missing}, which was not explicitly highlighted in your resume. What is your experience with {top_missing} or similar technologies?"
        )
    
    interview_questions.append(
        f"4. Walk us through a complex technical challenge you faced during your {exp_years} years in the industry and how you resolved it."
    )

    summary = (
        f"Candidate {cand_name} scored {score}% overall fit. "
        f"{'Highly recommended for technical round.' if score >= 75 else 'Moderate fit, consider probing missing skills.' if score >= 60 else 'Low alignment with core criteria.'}"
    )

    return {
        "summary": summary,
        "strengths": strengths if strengths else ["Basic qualifications present."],
        "weaknesses": weaknesses if weaknesses else ["No major skill gaps identified."],
        "interview_questions": interview_questions
    }
