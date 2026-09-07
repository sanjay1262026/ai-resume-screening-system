export interface SampleJobDescription {
  id: string;
  name: string;
  title: string;
  filename: string;
  content: string;
}

export interface SampleCandidate {
  filename: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  experience_years: number;
  education: string;
  summary: string;
  skills: string[];
  experience: string[];
  rawText: string;
}

export const SAMPLE_JOB_DESCRIPTIONS: SampleJobDescription[] = [
  {
    id: "ai_ml",
    name: "Senior AI / ML Engineer",
    title: "Senior AI / Machine Learning Engineer",
    filename: "AI_ML_Engineer_JD.txt",
    content: `Job Title: Senior AI / Machine Learning Engineer
Department: Artificial Intelligence & Data Science
Location: Remote / San Francisco, CA
Experience Required: 3+ Years
Education: Bachelor's or Master's in Computer Science, AI, Data Science, or related field

Job Overview:
We are seeking an experienced AI/ML Engineer to build state-of-the-art NLP and machine learning models. You will be responsible for end-to-end model development, deployment, and optimization.

Key Responsibilities:
- Design, train, and deploy machine learning models using Python, PyTorch, or TensorFlow.
- Process large unstructured text datasets using Natural Language Processing (NLP) techniques.
- Build RESTful APIs using FastAPI or Flask to serve AI models in production.
- Containerize applications using Docker and deploy on AWS or Cloud infrastructure.
- Implement CI/CD pipelines and monitor model performance in production.
- Collaborate with cross-functional teams to integrate AI capabilities into product features.

Required Skills & Qualifications:
- Technical Skills: Python, Machine Learning, Deep Learning, PyTorch, TensorFlow, NLP, Scikit-Learn, Pandas, NumPy, SQL, Docker, FastAPI, AWS, Git.
- Experience: Minimum 3 years of hands-on experience in AI/ML software development.
- Education: B.Tech / B.S. or M.Tech / M.S. in Computer Science or Data Science.
- Soft Skills: Problem solving, Communication, Teamwork, Analytical thinking.`
  },
  {
    id: "fullstack",
    name: "Full Stack Web Developer",
    title: "Full Stack Web Developer",
    filename: "Full_Stack_Developer_JD.txt",
    content: `Job Title: Full Stack Web Developer
Department: Engineering
Location: Hybrid / New York, NY
Experience Required: 2+ Years
Education: Bachelor's degree in Computer Science, Software Engineering, or equivalent experience

Job Overview:
We are looking for a talented Full Stack Web Developer to design and implement robust, scalable web applications. You will work across the entire stack, from modern frontend interfaces to backend microservices.

Key Responsibilities:
- Develop responsive, user-friendly frontend web interfaces using React, JavaScript, HTML5, and CSS3.
- Build performant RESTful APIs and backend services using Python, Node.js, and Express.
- Manage relational and NoSQL databases including PostgreSQL, MySQL, and MongoDB.
- Write unit tests and maintain continuous integration and deployment pipelines.
- Optimize web applications for maximum speed and scalability.

Required Skills & Qualifications:
- Technical Skills: Python, React, JavaScript, Node.js, Express, HTML5, CSS3, PostgreSQL, MongoDB, REST API, Git, Docker, TypeScript.
- Experience: 2+ years of full stack web development experience.
- Soft Skills: Agile methodology, Collaboration, Code review, Problem solving.`
  },
  {
    id: "data_analyst",
    name: "Data Analyst Specialist",
    title: "Data Analyst & Business Intelligence Specialist",
    filename: "Data_Analyst_JD.txt",
    content: `Job Title: Data Analyst & Business Intelligence Specialist
Department: Data Analytics
Location: Remote
Experience Required: 1+ Years
Education: Bachelor's degree in Statistics, Computer Science, Economics, or Data Analytics

Job Overview:
We are hiring a Data Analyst to transform complex data into actionable insights for business decision-making. You will create interactive dashboards, write SQL queries, and perform statistical data analysis.

Key Responsibilities:
- Query and analyze large datasets using SQL and Python (Pandas, NumPy).
- Create interactive dashboards and visual reports using Tableau or PowerBI.
- Conduct statistical analysis and data cleaning to identify trends and metrics.
- Present findings to leadership and stakeholders in clear, actionable visual reports.

Required Skills & Qualifications:
- Technical Skills: SQL, Python, Pandas, NumPy, Tableau, Power BI, Excel, Data Visualization, Statistics, Data Cleaning, ETL.
- Experience: 1+ years in data analysis, reporting, or business intelligence.
- Soft Skills: Data storytelling, Presentation skills, Attention to detail.`
  }
];

export const SAMPLE_CANDIDATES: SampleCandidate[] = [
  {
    filename: "Alex_Rivera_Senior_AI_Engineer.pdf",
    name: "Alex Rivera",
    title: "Senior AI / Machine Learning Engineer",
    email: "alex.rivera@email.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    experience_years: 5,
    education: "Master of Science (M.S.) in Computer Science - Stanford University",
    summary: "Innovative Senior AI Engineer with 5+ years of experience designing and deploying production NLP and deep learning models. Expert in PyTorch, Python, Transformers, Docker, and AWS cloud deployment.",
    skills: [
      "Python", "PyTorch", "TensorFlow", "NLP", "Machine Learning", "Deep Learning",
      "Scikit-Learn", "Pandas", "NumPy", "SQL", "FastAPI", "Docker", "AWS", "Git",
      "BERT", "Transformers", "CI/CD", "MLOps", "REST API"
    ],
    experience: [
      "Lead AI Engineer at TechCore Inc. (2021 - Present): Developed LLM and NLP screening pipelines processing 100k+ documents daily. Deployed microservices using FastAPI, Docker, and AWS SageMaker.",
      "Machine Learning Developer at DataVision (2019 - 2021): Trained PyTorch deep learning models for text classification and NER extraction, improving accuracy by 18%."
    ],
    rawText: `Alex Rivera
Senior AI / Machine Learning Engineer | 5 Years Experience
Email: alex.rivera@email.com | Phone: +1 (555) 234-5678 | Location: San Francisco, CA

SUMMARY
Innovative Senior AI Engineer with 5+ years of experience designing and deploying production NLP and deep learning models. Expert in PyTorch, Python, Transformers, Docker, and AWS cloud deployment.

EDUCATION
Master of Science (M.S.) in Computer Science - Stanford University (2019)

SKILLS
Python, PyTorch, TensorFlow, NLP, Machine Learning, Deep Learning, Scikit-Learn, Pandas, NumPy, SQL, FastAPI, Docker, AWS, Git, BERT, Transformers, CI/CD, MLOps, REST API

WORK EXPERIENCE
- Lead AI Engineer at TechCore Inc. (2021 - Present): Developed LLM and NLP screening pipelines processing 100k+ documents daily. Deployed microservices using FastAPI, Docker, and AWS SageMaker.
- Machine Learning Developer at DataVision (2019 - 2021): Trained PyTorch deep learning models for text classification and NER extraction, improving accuracy by 18%.`
  },
  {
    filename: "Priya_Sharma_ML_Developer.pdf",
    name: "Priya Sharma",
    title: "Machine Learning Engineer",
    email: "priya.sharma@email.com",
    phone: "+1 (555) 876-5432",
    location: "Seattle, WA",
    experience_years: 3,
    education: "Bachelor of Technology (B.Tech) in Computer Engineering - IIT Delhi",
    summary: "Dedicated Machine Learning Engineer with 3 years of hands-on experience building NLP text analytics engines, predictive models, and REST microservices in Python.",
    skills: [
      "Python", "Machine Learning", "Scikit-Learn", "NLP", "Pandas", "NumPy",
      "SQL", "Flask", "Docker", "Git", "PostgreSQL", "Data Science", "Natural Language Processing"
    ],
    experience: [
      "ML Engineer at Nexus Systems (2022 - Present): Designed NLP keyword extraction and text classification workflows using Scikit-Learn and SpaCy.",
      "Data Science Associate at Analytics Hub (2021 - 2022): Built SQL pipelines and automated feature extraction scripts in Python."
    ],
    rawText: `Priya Sharma
Machine Learning Engineer | 3 Years Experience
Email: priya.sharma@email.com | Phone: +1 (555) 876-5432 | Location: Seattle, WA

SUMMARY
Dedicated Machine Learning Engineer with 3 years of hands-on experience building NLP text analytics engines, predictive models, and REST microservices in Python.

EDUCATION
Bachelor of Technology (B.Tech) in Computer Engineering - IIT Delhi (2021)

SKILLS
Python, Machine Learning, Scikit-Learn, NLP, Pandas, NumPy, SQL, Flask, Docker, Git, PostgreSQL, Data Science, Natural Language Processing, SpaCy

WORK EXPERIENCE
- ML Engineer at Nexus Systems (2022 - Present): Designed NLP keyword extraction and text classification workflows using Scikit-Learn and SpaCy.
- Data Science Associate at Analytics Hub (2021 - 2022): Built SQL pipelines and automated feature extraction scripts in Python.`
  },
  {
    filename: "Marcus_Chen_Data_Scientist.pdf",
    name: "Marcus Chen",
    title: "Data Scientist & Analytics Specialist",
    email: "marcus.chen@email.com",
    phone: "+1 (555) 345-6789",
    location: "Austin, TX",
    experience_years: 2,
    education: "Bachelor of Science (B.S.) in Data Science - UT Austin",
    summary: "Data Scientist passionate about extracting business insights from complex datasets using Python, SQL, statistical modeling, and Tableau visualization.",
    skills: [
      "Python", "SQL", "Pandas", "NumPy", "Tableau", "Power BI", "Statistics",
      "Data Visualization", "Data Cleaning", "R", "Excel", "Scikit-Learn"
    ],
    experience: [
      "Data Scientist at Horizon Analytics (2022 - Present): Created automated BI dashboards in Tableau and conducted statistical modeling in Python for client growth strategies."
    ],
    rawText: `Marcus Chen
Data Scientist & Analytics Specialist | 2 Years Experience
Email: marcus.chen@email.com | Phone: +1 (555) 345-6789 | Location: Austin, TX

SUMMARY
Data Scientist passionate about extracting business insights from complex datasets using Python, SQL, statistical modeling, and Tableau visualization.

EDUCATION
Bachelor of Science (B.S.) in Data Science - UT Austin (2022)

SKILLS
Python, SQL, Pandas, NumPy, Tableau, Power BI, Statistics, Data Visualization, Data Cleaning, R, Excel, Scikit-Learn

WORK EXPERIENCE
- Data Scientist at Horizon Analytics (2022 - Present): Created automated BI dashboards in Tableau and conducted statistical modeling in Python for client growth strategies.`
  },
  {
    filename: "Sophia_Taylor_FullStack_Dev.docx",
    name: "Sophia Taylor",
    title: "Senior Full Stack Web Developer",
    email: "sophia.taylor@email.com",
    phone: "+1 (555) 456-7890",
    location: "New York, NY",
    experience_years: 4,
    education: "B.S. in Software Engineering - Columbia University",
    summary: "Creative Full Stack Developer with 4 years of experience building modern web applications using React, Node.js, Python, TypeScript, and Docker.",
    skills: [
      "Python", "React", "JavaScript", "TypeScript", "Node.js", "Express",
      "HTML5", "CSS3", "PostgreSQL", "MongoDB", "REST API", "Docker", "Git"
    ],
    experience: [
      "Full Stack Developer at WebSphere Tech (2021 - Present): Developed high-traffic web applications with React frontend and FastAPI backend.",
      "Frontend Engineer at CloudApps (2020 - 2021): Built interactive React components and RESTful API integrations."
    ],
    rawText: `Sophia Taylor
Senior Full Stack Web Developer | 4 Years Experience
Email: sophia.taylor@email.com | Phone: +1 (555) 456-7890 | Location: New York, NY

SUMMARY
Creative Full Stack Developer with 4 years of experience building modern web applications using React, Node.js, Python, TypeScript, and Docker.

EDUCATION
B.S. in Software Engineering - Columbia University (2020)

SKILLS
Python, React, JavaScript, TypeScript, Node.js, Express, HTML5, CSS3, PostgreSQL, MongoDB, REST API, Docker, Git

WORK EXPERIENCE
- Full Stack Developer at WebSphere Tech (2021 - Present): Developed high-traffic web applications with React frontend and FastAPI backend.
- Frontend Engineer at CloudApps (2020 - 2021): Built interactive React components and RESTful API integrations.`
  },
  {
    filename: "David_Miller_Junior_Developer.docx",
    name: "David Miller",
    title: "Junior Web Developer",
    email: "david.miller@email.com",
    phone: "+1 (555) 567-8901",
    location: "Chicago, IL",
    experience_years: 1,
    education: "Bachelor of Science in Information Technology",
    summary: "Enthusiastic Junior Web Developer with 1 year of experience creating responsive landing pages and basic web utilities.",
    skills: [
      "HTML5", "CSS3", "JavaScript", "Python", "Git", "Bootstrap", "SQL"
    ],
    experience: [
      "Junior Web Intern at DigitalCraft (2023 - Present): Assisted in front-end HTML/CSS layouts and simple Python scripting."
    ],
    rawText: `David Miller
Junior Web Developer | 1 Year Experience
Email: david.miller@email.com | Phone: +1 (555) 567-8901 | Location: Chicago, IL

SUMMARY
Enthusiastic Junior Web Developer with 1 year of experience creating responsive landing pages and basic web utilities.

EDUCATION
Bachelor of Science in Information Technology (2023)

SKILLS
HTML5, CSS3, JavaScript, Python, Git, Bootstrap, SQL

WORK EXPERIENCE
- Junior Web Intern at DigitalCraft (2023 - Present): Assisted in front-end HTML/CSS layouts and simple Python scripting.`
  },
  {
    filename: "Emily_Watson_Marketing_Manager.pdf",
    name: "Emily Watson",
    title: "Digital Marketing & Brand Specialist",
    email: "emily.watson@email.com",
    phone: "+1 (555) 678-9012",
    location: "Boston, MA",
    experience_years: 4,
    education: "B.A. in Communications & Marketing - Boston University",
    summary: "Results-driven Digital Marketing Lead specializing in social media campaigns, SEO content creation, brand growth, and public relations.",
    skills: [
      "Digital Marketing", "SEO", "Content Strategy", "Social Media", "Copywriting",
      "Google Analytics", "Brand Management", "Public Relations", "Communication"
    ],
    experience: [
      "Marketing Manager at MediaPro (2021 - Present): Led digital ad strategy and social media content campaigns across 5 major brands."
    ],
    rawText: `Emily Watson
Digital Marketing & Brand Specialist | 4 Years Experience
Email: emily.watson@email.com | Phone: +1 (555) 678-9012 | Location: Boston, MA

SUMMARY
Results-driven Digital Marketing Lead specializing in social media campaigns, SEO content creation, brand growth, and public relations.

EDUCATION
B.A. in Communications & Marketing - Boston University (2020)

SKILLS
Digital Marketing, SEO, Content Strategy, Social Media, Copywriting, Google Analytics, Brand Management, Public Relations, Communication

WORK EXPERIENCE
- Marketing Manager at MediaPro (2021 - Present): Led digital ad strategy and social media content campaigns across 5 major brands.`
  }
];
