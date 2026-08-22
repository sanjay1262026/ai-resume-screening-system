# 🤖 AI-Powered Resume Screening & Candidate Ranking System

> **Python Internship Final Project Submission**  
> *A Production-Grade, Decision-Support HR Tech Platform Built with Python, Natural Language Processing (NLP), and Machine Learning.*

---

## 📌 Executive Summary & Problem Statement

In modern recruitment, HR teams and talent acquisition specialists face an overwhelming volume of job applications. Manually reviewing hundreds of resumes for a single job opening is time-consuming, repetitive, inconsistent, and highly prone to human error or recruiter fatigue. Qualified candidates are frequently missed due to keyword mismatch or unstructured formatting across PDF/Word documents.

**The Solution:**  
This **AI Resume Screening System** serves as an intelligent decision-support platform that automates candidate evaluation. It accepts a target Job Description (JD) and a batch of candidate resumes (PDF, DOCX, TXT), parses unstructured text, extracts technical skills and experience metrics, calculates semantic contextual similarity using TF-IDF and N-gram vectorization, computes a composite match score, and ranks candidates in an interactive recruiter dashboard.

---

## ✨ Key Features & Capabilities

- 📄 **Multi-Format Resume Ingestion**: Supports PDF (`pypdf`, `pdfminer.six`), Microsoft Word (`python-docx`), and plain text (`.txt`).
- 🧠 **NLP Entity & Skill Extraction**: Uses regular expressions, phrase boundaries, and token normalization across an exhaustive taxonomy of 250+ technical and soft skills.
- 📐 **TF-IDF & Cosine Similarity Engine**: Computes sublinear term-frequency contextual similarity between job requirements and resume text.
- 🎯 **Multi-Factor Composite Scoring**:
  - **Skill Match Score (40%)**: Weighted exact & fuzzy overlap of candidate skills vs required job skills.
  - **Semantic Similarity Score (35%)**: Vector-space cosine distance measuring vocabulary and contextual fit.
  - **Experience Score (15%)**: Evaluates candidate experience years against JD minimum threshold.
  - **Education Match Score (10%)**: Checks degree qualification requirements (B.S., M.S., Ph.D.).
- 📊 **Interactive Recruiter Dashboard**: Filter by minimum fit score, search candidates, view score breakdowns, and status classifications (`Top Match 🟢`, `Potential Fit 🟡`, `Low Match 🔴`).
- ⚔️ **Side-by-Side Candidate Comparison**: Compare candidates using dual Radar charts, missing skill matrices, and automated AI feedback summaries.
- ❓ **Automated Interview Question Generator**: Generates candidate-tailored technical questions targeting specific resume skill gaps.
- 📑 **Report Export**: Download full leaderboard summaries in **CSV** or **PDF Report** format.
- ⚡ **1-Click Pre-Loaded Showcase Data**: Pre-loaded with industry job descriptions and multi-format sample resumes for instant demonstration.

---

## 🏗 System Architecture & Pipeline Flow

```
+-------------------+       +-----------------------+
|  Job Description  |       |   Batch Resumes       |
|    (Text / File)  |       |  (PDF, DOCX, TXT)     |
+---------+---------+       +-----------+-----------+
          |                             |
          v                             v
+-------------------+       +-----------------------+
|  JD Skill & Exp   |       |  Text Extraction &    |
|   Requirements    |       | Contact/Skill Parser  |
|   Extractor       |       |  (Regex / SpaCy / PyPDF)|
+---------+---------+       +-----------+-----------+
          |                             |
          +--------------+--------------+
                         |
                         v
          +-----------------------------+
          |   NLP & Scoring Engine      |
          |  * Skill Match (40%)        |
          |  * TF-IDF Cosine Sim (35%)  |
          |  * Exp & Edu Score (25%)    |
          +--------------+--------------+
                         |
                         v
          +-----------------------------+
          |  Recruiter Dashboard        |
          |  * Candidate Leaderboard    |
          |  * Radar Charts & Matrix    |
          |  * Interview Question Gen   |
          |  * CSV / PDF Export         |
          +-----------------------------+
```

---

## 📂 Project Directory Structure

```text
ai_resume_screening_system/
├── app.py                      # Main Streamlit Web Application
├── generate_samples.py          # Script to generate sample PDF/DOCX resumes
├── zip_project.py              # Script to package project as downloadable ZIP
├── requirements.txt            # Dependencies for deployment
├── README.md                   # Complete project documentation
├── assets/
│   └── style.css               # Custom Glassmorphism UI CSS theme
├── components/
│   └── ui.py                   # Reusable UI widgets, banners, and Plotly charts
├── modules/
│   ├── __init__.py
│   ├── parser.py               # Document text, contact info, and exp extractor
│   ├── skills.py               # 250+ skill taxonomy and requirement parser
│   ├── scorer.py               # TF-IDF Cosine Similarity & Multi-Factor Scoring
│   ├── feedback.py             # AI Feedback & Interview Question Generator
│   └── reporter.py             # CSV and PDF report generation modules
└── sample_data/
    ├── job_descriptions/       # Sample AI/ML, Full Stack, Data Analyst JDs
    └── resumes/                # Pre-loaded PDF & DOCX candidate resumes
```

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
Ensure Python **3.9+** is installed on your machine.

### 2. Clone / Extract Project
```bash
git clone <repository_url>
cd ai_resume_screening_system
```

### 3. Create Virtual Environment & Install Dependencies
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate

# Install required packages
pip install -r requirements.txt
```

### 4. Run Sample Data Generator (Optional)
```bash
python generate_samples.py
```

### 5. Launch Web Application
```bash
streamlit run app.py
```
Open your browser and navigate to `http://localhost:8501`.

---

## ☁️ Deployment Instructions

### Deploy to Streamlit Community Cloud (Recommended & Free)
1. Push this repository to GitHub.
2. Sign in to [Streamlit Community Cloud](https://share.streamlit.io).
3. Click **New app**, select your GitHub repository and branch.
4. Set **Main file path** to `app.py`.
5. Click **Deploy**!

### Deploy with Docker
Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 8501
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
```
Build & run:
```bash
docker build -t ai-resume-screener .
docker run -p 8501:8501 ai-resume-screener
```

---

## 💡 Model & Math Explainability

### 1. TF-IDF Contextual Similarity
TF-IDF measures how important a word $t$ is to a document $d$ relative to a collection of documents $D$:
$$\text{TF}(t, d) = \frac{f_{t,d}}{\sum_{t'} f_{t',d}}$$
$$\text{IDF}(t, D) = \log \left( \frac{1 + |D|}{1 + |\{d \in D : t \in d\}|} \right) + 1$$
$$\text{Cosine Similarity}(\vec{a}, \vec{b}) = \frac{\vec{a} \cdot \vec{b}}{\|\vec{a}\| \|\vec{b}\|}$$

### 2. Composite Score Weight Matrix
$$\text{Overall Fit} = (W_{\text{skill}} \times S_{\text{skill}}) + (W_{\text{semantic}} \times S_{\text{semantic}}) + (W_{\text{exp}} \times S_{\text{exp}}) + (W_{\text{edu}} \times S_{\text{edu}})$$

Default weights: $W_{\text{skill}}=0.40$, $W_{\text{semantic}}=0.35$, $W_{\text{exp}}=0.15$, $W_{\text{edu}}=0.10$.

---

## 🏆 Internship Project Highlights & Key Takeaways

1. **Production Quality**: Built with modular clean architecture (`modules/`, `components/`, `assets/`).
2. **Robust Error Handling**: Degrades gracefully across messy PDF text formatting, missing sections, and encoding anomalies.
3. **User Centricity**: Allows HR recruiters to tweak algorithm scoring weights dynamically based on specific role preferences.

---

*Developed with ❤️ as a Python Internship Showcase Project.*
