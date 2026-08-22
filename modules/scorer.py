import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    from modules.skills import extract_skills_from_text, parse_job_requirements
except ImportError:
    from skills import extract_skills_from_text, parse_job_requirements

def clean_text_for_nlp(text):
    """Clean text by removing special chars and standardizing whitespace."""
    if not text:
        return ""
    text = re.sub(r'[^\w\s]', ' ', text.lower())
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def calculate_semantic_similarity(jd_text, resume_text):
    """
    Computes TF-IDF N-Gram Cosine Similarity between Job Description and Resume.
    Returns float score between 0.0 and 100.0.
    """
    clean_jd = clean_text_for_nlp(jd_text)
    clean_resume = clean_text_for_nlp(resume_text)

    if not clean_jd or not clean_resume:
        return 0.0

    try:
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words='english',
            sublinear_tf=True
        )
        tfidf_matrix = vectorizer.fit_transform([clean_jd, clean_resume])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        # Calibrated scaling for document-to-resume TF-IDF cosine similarity
        scaled_sim = float(np.clip(sim * 250.0, 0, 100))
        return round(scaled_sim, 1)
    except Exception as e:
        print(f"Error in TF-IDF similarity calculation: {e}")
        return 0.0

def evaluate_candidate(candidate_data, jd_text, weights=None):
    """
    Full evaluation pipeline for a candidate against a job description.
    weights: dict with 'skill', 'semantic', 'experience', 'education' sum to 1.0.
    """
    if weights is None:
        weights = {
            'skill': 0.40,
            'semantic': 0.35,
            'experience': 0.15,
            'education': 0.10
        }

    jd_reqs = parse_job_requirements(jd_text)
    jd_skills = set(jd_reqs["required_skills"])
    min_exp = jd_reqs["min_experience_years"]

    candidate_text = candidate_data.get("text", "")
    cand_skills = extract_skills_from_text(candidate_text)
    cand_exp = candidate_data.get("experience_years", 1)
    cand_edu = candidate_data.get("education", "Bachelor's Degree")

    # 1. Skill Match Calculation
    if jd_skills:
        matched_skills = cand_skills.intersection(jd_skills)
        missing_skills = jd_skills - cand_skills
        extra_skills = cand_skills - jd_skills
        skill_score = round((len(matched_skills) / len(jd_skills)) * 100.0, 1)
    else:
        matched_skills = cand_skills
        missing_skills = set()
        extra_skills = set()
        skill_score = 100.0 if cand_skills else 50.0

    # 2. Semantic Similarity Score
    semantic_score = calculate_semantic_similarity(jd_text, candidate_text)

    # 3. Experience Match Score
    if min_exp == 0:
        exp_score = 100.0
    elif cand_exp >= min_exp:
        exp_score = min(100.0, 100.0 + (cand_exp - min_exp) * 5)
    else:
        exp_score = round((cand_exp / min_exp) * 100.0, 1)

    # 4. Education Score
    edu_score = 100.0
    if "Master" in jd_reqs["min_education"] and "Master" not in cand_edu and "Ph.D" not in cand_edu:
        edu_score = 75.0
    elif "Ph.D" in jd_reqs["min_education"] and "Ph.D" not in cand_edu:
        edu_score = 60.0

    # 5. Composite Score
    total_score = (
        (skill_score * weights['skill']) +
        (semantic_score * weights['semantic']) +
        (exp_score * weights['experience']) +
        (edu_score * weights['education'])
    )
    total_score = round(min(100.0, max(0.0, total_score)), 1)

    # Classification thresholds
    if total_score >= 75.0:
        status = "Top Match 🟢"
        badge_color = "#10B981"
    elif total_score >= 55.0:
        status = "Potential Fit 🟡"
        badge_color = "#F59E0B"
    else:
        status = "Low Match 🔴"
        badge_color = "#EF4444"

    return {
        "candidate_name": candidate_data.get("candidate_name", "Candidate"),
        "filename": candidate_data.get("filename", ""),
        "email": candidate_data.get("email", "N/A"),
        "phone": candidate_data.get("phone", "N/A"),
        "overall_score": total_score,
        "skill_score": skill_score,
        "semantic_score": semantic_score,
        "experience_score": round(exp_score, 1),
        "education_score": round(edu_score, 1),
        "candidate_exp_years": cand_exp,
        "jd_min_exp_years": min_exp,
        "candidate_edu": cand_edu,
        "status": status,
        "badge_color": badge_color,
        "matched_skills": list(sorted(matched_skills)),
        "missing_skills": list(sorted(missing_skills)),
        "extra_skills": list(sorted(extra_skills)),
        "all_candidate_skills": list(sorted(cand_skills)),
        "jd_required_skills": list(sorted(jd_skills)),
        "raw_text": candidate_text
    }
