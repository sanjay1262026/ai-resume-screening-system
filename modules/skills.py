import re

SKILL_TAXONOMY = {
    "AI & Machine Learning": [
        "python", "pytorch", "tensorflow", "keras", "scikit-learn", "sklearn",
        "nlp", "natural language processing", "deep learning", "machine learning",
        "computer vision", "transformers", "bert", "gpt", "llm", "opencv",
        "spacy", "nltk", "hugging face", "mlops", "model deployment", "neural networks",
        "reinforcement learning", "feature engineering", "predictive modeling"
    ],
    "Data Science & Analytics": [
        "sql", "pandas", "numpy", "scipy", "r", "tableau", "power bi", "excel",
        "statistics", "data visualization", "data mining", "etl", "apache spark",
        "hadoop", "matplotlib", "seaborn", "business intelligence", "data cleaning",
        "big data", "data analysis", "data warehousing"
    ],
    "Web & Software Engineering": [
        "javascript", "typescript", "react", "next.js", "node.js", "express",
        "angular", "vue.js", "django", "flask", "fastapi", "html5", "css3",
        "rest api", "graphql", "microservices", "bootstrap", "tailwind",
        "c++", "c#", "java", "golang", "rust", "php", "web development",
        "frontend", "backend", "full stack"
    ],
    "Databases & Cloud DevOps": [
        "postgresql", "mysql", "mongodb", "redis", "sqlite", "oracle",
        "aws", "azure", "google cloud", "gcp", "docker", "kubernetes",
        "ci/cd", "git", "github", "linux", "bash", "terraform", "jenkins",
        "cloud computing", "system design"
    ],
    "Methodologies & Soft Skills": [
        "agile", "scrum", "project management", "problem solving",
        "communication", "teamwork", "analytical thinking", "critical thinking",
        "leadership", "code review", "collaboration", "time management"
    ]
}

# Flatten skill list with display names
ALL_SKILLS = {}
for category, skills in SKILL_TAXONOMY.items():
    for skill in skills:
        ALL_SKILLS[skill] = skill.title() if len(skill) > 3 else skill.upper()

# Explicit formatting fixes for canonical display names
CANONICAL_NAMES = {
    "python": "Python",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "scikit-learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "nlp": "NLP",
    "natural language processing": "Natural Language Processing",
    "deep learning": "Deep Learning",
    "machine learning": "Machine Learning",
    "llm": "LLM",
    "spacy": "SpaCy",
    "nltk": "NLTK",
    "sql": "SQL",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "power bi": "Power BI",
    "tableau": "Tableau",
    "excel": "Excel",
    "etl": "ETL",
    "react": "React",
    "next.js": "Next.js",
    "node.js": "Node.js",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "html5": "HTML5",
    "css3": "CSS3",
    "rest api": "REST API",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "c++": "C++",
    "c#": "C#",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "Google Cloud (GCP)",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "ci/cd": "CI/CD",
    "git": "Git",
    "github": "GitHub",
    "linux": "Linux",
    "agile": "Agile",
    "scrum": "Scrum"
}

def extract_skills_from_text(text):
    """
    Extracts canonical skills from input text using regex boundaries and phrase matching.
    Returns set of formatted skill names.
    """
    if not text:
        return set()

    text_lower = " " + text.lower() + " "
    detected_skills = set()

    for raw_skill in ALL_SKILLS.keys():
        # Special boundary checks for short words like C++, C#, R, SQL, Git
        if raw_skill in ['c++', 'c#']:
            pattern = re.escape(raw_skill)
        elif len(raw_skill) <= 2:
            pattern = r'(?<=[\s,./();:-])' + re.escape(raw_skill) + r'(?=[\s,./();:-])'
        else:
            pattern = r'\b' + re.escape(raw_skill) + r'\b'

        if re.search(pattern, text_lower):
            display_name = CANONICAL_NAMES.get(raw_skill, ALL_SKILLS[raw_skill])
            detected_skills.add(display_name)

    return detected_skills

def parse_job_requirements(jd_text):
    """
    Extracts required skills, education requirements, and experience requirements from JD text.
    """
    skills = extract_skills_from_text(jd_text)
    
    # Extract minimum required experience
    exp_pattern = r'(\d+)\+?\s*(?:years?|yrs)'
    matches = re.findall(exp_pattern, jd_text, re.IGNORECASE)
    min_exp = 0
    if matches:
        valid_exp = [int(m) for m in matches if int(m) <= 20]
        if valid_exp:
            min_exp = min(valid_exp)

    # Education level required
    jd_lower = jd_text.lower()
    min_education = "Bachelor's Degree"
    if any(k in jd_lower for k in ['phd', 'ph.d', 'doctorate']):
        min_education = "Ph.D. / Doctorate"
    elif any(k in jd_lower for k in ['master', 'm.s.', 'm.tech', 'mca']):
        min_education = "Master's Degree"

    return {
        "required_skills": list(skills),
        "min_experience_years": min_exp,
        "min_education": min_education
    }
