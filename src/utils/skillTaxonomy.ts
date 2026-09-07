import { JobRequirements } from '../types';

export const SKILL_TAXONOMY: Record<string, string[]> = {
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
};

export const CANONICAL_NAMES: Record<string, string> = {
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
};

const ALL_SKILLS_MAP: Record<string, string> = {};
for (const skills of Object.values(SKILL_TAXONOMY)) {
  for (const skill of skills) {
    ALL_SKILLS_MAP[skill] = CANONICAL_NAMES[skill] || (skill.length > 3 ? skill.charAt(0).toUpperCase() + skill.slice(1) : skill.toUpperCase());
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractSkillsFromText(text: string): string[] {
  if (!text) return [];
  const textLower = ' ' + text.toLowerCase() + ' ';
  const detected = new Set<string>();

  for (const [rawSkill, displayName] of Object.entries(ALL_SKILLS_MAP)) {
    let regex: RegExp;
    if (rawSkill === 'c++' || rawSkill === 'c#') {
      regex = new RegExp(escapeRegex(rawSkill), 'i');
    } else if (rawSkill.length <= 2) {
      regex = new RegExp(`(?<=[\\s,./();:-])${escapeRegex(rawSkill)}(?=[\\s,./();:-])`, 'i');
    } else {
      regex = new RegExp(`\\b${escapeRegex(rawSkill)}\\b`, 'i');
    }

    if (regex.test(textLower)) {
      detected.add(displayName);
    }
  }

  return Array.from(detected).sort();
}

export function parseJobRequirements(jdText: string): JobRequirements {
  const skills = extractSkillsFromText(jdText);

  // Extract min years of experience
  const expPattern = /(\d+)\+?\s*(?:years?|yrs)/gi;
  const matches = Array.from(jdText.matchAll(expPattern));
  let minExp = 0;
  if (matches.length > 0) {
    const years = matches
      .map(m => parseInt(m[1], 10))
      .filter(y => !isNaN(y) && y <= 20);
    if (years.length > 0) {
      minExp = Math.min(...years);
    }
  }

  // Education level required
  const jdLower = jdText.toLowerCase();
  let minEducation = "Bachelor's Degree";
  if (/(phd|ph\.d|doctorate)/i.test(jdLower)) {
    minEducation = "Ph.D. / Doctorate";
  } else if (/(master|m\.s\.|m\.tech|mca)/i.test(jdLower)) {
    minEducation = "Master's Degree";
  }

  // Job Title extraction if present
  let title = "Job Position";
  const titleMatch = jdText.match(/Job Title:\s*([^\n\r]+)/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  }

  return {
    title,
    min_experience_years: minExp,
    min_education: minEducation,
    required_skills: skills,
    raw_text: jdText
  };
}
