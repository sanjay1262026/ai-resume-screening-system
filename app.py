import os
import glob
import io
import re
import json
import sqlite3
import hashlib
from datetime import datetime

import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

# 1. INTEGRATED SQLITE DATABASE ENGINE
DB_PATH = "database.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS screenings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            jd_title TEXT NOT NULL,
            jd_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            screening_id INTEGER NOT NULL,
            candidate_name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            overall_score REAL NOT NULL,
            skill_score REAL NOT NULL,
            semantic_score REAL NOT NULL,
            experience_score REAL NOT NULL,
            education_score REAL NOT NULL,
            candidate_exp_years INTEGER NOT NULL,
            candidate_edu TEXT NOT NULL,
            status TEXT NOT NULL,
            matched_skills_json TEXT,
            missing_skills_json TEXT,
            extra_skills_json TEXT,
            raw_text TEXT,
            FOREIGN KEY (screening_id) REFERENCES screenings (id)
        )
    """)

    cursor.execute("SELECT * FROM users WHERE username = ?", ("admin",))
    if not cursor.fetchone():
        admin_pass_hash = hashlib.sha256("admin123".encode()).hexdigest()
        cursor.execute(
            "INSERT INTO users (username, password_hash, full_name) VALUES (?, ?, ?)",
            ("admin", admin_pass_hash, "Admin Recruiter")
        )

    conn.commit()
    conn.close()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def db_register_user(username, password, full_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        p_hash = hash_password(password)
        cursor.execute(
            "INSERT INTO users (username, password_hash, full_name) VALUES (?, ?, ?)",
            (username.lower().strip(), p_hash, full_name.strip())
        )
        conn.commit()
        return True, "User registered successfully! Please log in now."
    except sqlite3.IntegrityError:
        return False, "Username already exists. Please log in or choose a different username."
    finally:
        conn.close()

def db_authenticate_user(username, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    p_hash = hash_password(password)
    cursor.execute(
        "SELECT * FROM users WHERE username = ? AND password_hash = ?",
        (username.lower().strip(), p_hash)
    )
    user = cursor.fetchone()
    conn.close()
    if user:
        return dict(user)
    return None

def db_reset_password(username, new_password):
    conn = get_db_connection()
    cursor = conn.cursor()
    p_hash = hash_password(new_password)
    cursor.execute("SELECT * FROM users WHERE username = ?", (username.lower().strip(),))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return False, "Username not found in database."
    
    cursor.execute("UPDATE users SET password_hash = ? WHERE username = ?", (p_hash, username.lower().strip()))
    conn.commit()
    conn.close()
    return True, f"Password for @{username} reset successfully! Please log in with your new password."

def db_save_screening_session(user_id, jd_title, jd_text, eval_results):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO screenings (user_id, jd_title, jd_text) VALUES (?, ?, ?)",
        (user_id, jd_title, jd_text)
    )
    screening_id = cursor.lastrowid

    for cand in eval_results:
        cursor.execute("""
            INSERT INTO candidates (
                screening_id, candidate_name, email, phone,
                overall_score, skill_score, semantic_score, experience_score, education_score,
                candidate_exp_years, candidate_edu, status,
                matched_skills_json, missing_skills_json, extra_skills_json, raw_text
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            screening_id,
            cand["candidate_name"],
            cand.get("email", "N/A"),
            cand.get("phone", "N/A"),
            float(cand["overall_score"]),
            float(cand["skill_score"]),
            float(cand["semantic_score"]),
            float(cand["experience_score"]),
            float(cand["education_score"]),
            int(cand["candidate_exp_years"]),
            cand["candidate_edu"],
            cand["status"],
            json.dumps(cand.get("matched_skills", [])),
            json.dumps(cand.get("missing_skills", [])),
            json.dumps(cand.get("extra_skills", [])),
            cand.get("raw_text", "")
        ))

    conn.commit()
    conn.close()
    return screening_id

def db_get_user_screenings(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM screenings WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    )
    screenings = cursor.fetchall()
    conn.close()
    return [dict(s) for s in screenings]

def db_get_latest_user_screening(user_id):
    screenings = db_get_user_screenings(user_id)
    if screenings:
        latest_id = screenings[0]["id"]
        return db_load_screening_details(latest_id)
    return None, []

def db_load_screening_details(screening_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM screenings WHERE id = ?", (screening_id,))
    screening = cursor.fetchone()

    if not screening:
        conn.close()
        return None, []

    cursor.execute("SELECT * FROM candidates WHERE screening_id = ? ORDER BY overall_score DESC", (screening_id,))
    candidates = cursor.fetchall()
    conn.close()

    eval_results = []
    for c in candidates:
        cd = dict(c)
        eval_results.append({
            "candidate_name": cd["candidate_name"],
            "filename": cd["candidate_name"] + ".pdf",
            "email": cd["email"],
            "phone": cd["phone"],
            "overall_score": float(cd["overall_score"]),
            "skill_score": float(cd["skill_score"]),
            "semantic_score": float(cd["semantic_score"]),
            "experience_score": float(cd["experience_score"]),
            "education_score": float(cd["education_score"]),
            "candidate_exp_years": int(cd["candidate_exp_years"]),
            "candidate_edu": cd["candidate_edu"],
            "status": cd["status"],
            "matched_skills": json.loads(cd["matched_skills_json"] or "[]"),
            "missing_skills": json.loads(cd["missing_skills_json"] or "[]"),
            "extra_skills": json.loads(cd["extra_skills_json"] or "[]"),
            "raw_text": cd["raw_text"]
        })

    return dict(screening), eval_results

init_db()

# 2. CORE MODULE IMPORTS WITH ROBUST FALLBACKS
try:
    from modules.parser import parse_resume_file
    from modules.skills import extract_skills_from_text, parse_job_requirements
    from modules.scorer import evaluate_candidate
    from modules.feedback import generate_candidate_feedback
    from modules.reporter import generate_csv_report, generate_pdf_report
except ImportError:
    from parser import parse_resume_file
    from skills import extract_skills_from_text, parse_job_requirements
    from scorer import evaluate_candidate
    from feedback import generate_candidate_feedback
    from reporter import generate_csv_report, generate_pdf_report

try:
    from components.ui import (
        render_hero_banner,
        render_metric_cards,
        plot_candidate_radar,
        plot_comparison_radar,
        render_skill_tags
    )
except ImportError:
    from ui import (
        render_hero_banner,
        render_metric_cards,
        plot_candidate_radar,
        plot_comparison_radar,
        render_skill_tags
    )

try:
    from zip_project import create_zip_archive
except ImportError:
    def create_zip_archive(): pass

# Page Configuration
st.set_page_config(
    page_title="AI Resume Screening System",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 3. DIRECT OPTION B INLINED DESIGN SYSTEM (OPTION B LIGHT SAAS MODE)
INLINED_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
}

/* Off-White Clean Canvas (Option B Theme) */
.stApp {
    background-color: #F8FAFC !important;
    color: #0F172A !important;
}

/* Deep Navy Sidebar */
[data-testid="stSidebar"] {
    background-color: #0F172A !important;
    border-right: 1px solid #1E293B !important;
}

[data-testid="stSidebar"] *, 
[data-testid="stSidebar"] p, 
[data-testid="stSidebar"] span, 
[data-testid="stSidebar"] label, 
[data-testid="stSidebar"] div,
[data-testid="stSidebar"] h1,
[data-testid="stSidebar"] h2,
[data-testid="stSidebar"] h3 {
    color: #F8FAFC !important;
}

/* Hero Header Banner */
.hero-banner {
    background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%) !important;
    border: 1px solid #334155 !important;
    border-radius: 20px !important;
    padding: 34px 40px !important;
    margin-bottom: 28px !important;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12) !important;
}

.hero-title {
    font-family: 'Outfit', sans-serif !important;
    font-size: 2.5rem !important;
    font-weight: 800 !important;
    color: #FFFFFF !important;
    margin-bottom: 8px !important;
}

.hero-subtitle {
    font-size: 1.05rem !important;
    color: #94A3B8 !important;
    line-height: 1.6 !important;
}

/* Badges */
.badge-pill {
    display: inline-flex !important;
    padding: 5px 14px !important;
    border-radius: 9999px !important;
    font-size: 0.75rem !important;
    font-weight: 800 !important;
    letter-spacing: 0.05em !important;
    margin-right: 8px !important;
    margin-bottom: 12px !important;
}

.badge-primary {
    background: rgba(37, 99, 235, 0.2) !important;
    color: #60A5FA !important;
    border: 1px solid rgba(96, 165, 250, 0.3) !important;
}

.badge-success {
    background: rgba(16, 185, 129, 0.2) !important;
    color: #34D399 !important;
    border: 1px solid rgba(52, 211, 153, 0.3) !important;
}

.badge-warning {
    background: rgba(245, 158, 11, 0.2) !important;
    color: #FBBF24 !important;
    border: 1px solid rgba(251, 191, 36, 0.3) !important;
}

/* Clean White Cards */
.glass-card {
    background: #FFFFFF !important;
    border: 1px solid #E2E8F0 !important;
    border-radius: 20px !important;
    padding: 28px !important;
    margin-bottom: 24px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04) !important;
}

.glass-card *, .glass-card h1, .glass-card h2, .glass-card h3, .glass-card p, .glass-card label, .glass-card span {
    color: #0F172A !important;
}

/* Option B Pastel Metric Cards */
.metric-box-inner {
    border-radius: 18px !important;
    padding: 22px 18px !important;
    text-align: center !important;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03) !important;
}

.metric-card-1 {
    background: #EFF6FF !important;
    border: 1px solid #BFDBFE !important;
}
.metric-card-1 .metric-val { color: #1E40AF !important; }

.metric-card-2 {
    background: #ECFDF5 !important;
    border: 1px solid #A7F3D0 !important;
}
.metric-card-2 .metric-val { color: #065F46 !important; }

.metric-card-3 {
    background: #F5F3FF !important;
    border: 1px solid #DDD6FE !important;
}
.metric-card-3 .metric-val { color: #5B21B6 !important; }

.metric-card-4 {
    background: #FFFBEB !important;
    border: 1px solid #FDE68A !important;
}
.metric-card-4 .metric-val { color: #92400E !important; }

.metric-val {
    font-family: 'Outfit', sans-serif !important;
    font-size: 2.3rem !important;
    font-weight: 800 !important;
    line-height: 1.1 !important;
}

.metric-lbl {
    font-size: 0.8rem !important;
    color: #64748B !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
    margin-top: 6px !important;
}

/* Option B Soft Skill Badges */
.skill-tag {
    display: inline-block !important;
    border-radius: 10px !important;
    padding: 5px 13px !important;
    font-size: 0.83rem !important;
    margin: 4px !important;
    font-weight: 600 !important;
}

.skill-matched {
    background: #DCFCE7 !important;
    color: #166534 !important;
    border: 1px solid #86EFAC !important;
}

.skill-missing {
    background: #FFE4E6 !important;
    color: #991B1B !important;
    border: 1px solid #FECDD3 !important;
}

/* Floating Curved Pill Tab Bar (Option B Style) */
.stTabs [data-baseweb="tab-list"] {
    gap: 8px !important;
    background: #E2E8F0 !important;
    padding: 6px !important;
    border-radius: 9999px !important;
    border: 1px solid #CBD5E1 !important;
    margin-bottom: 24px !important;
}

.stTabs [data-baseweb="tab"] {
    height: 42px !important;
    border-radius: 9999px !important;
    color: #475569 !important;
    font-weight: 600 !important;
    font-size: 0.92rem !important;
    padding: 0 22px !important;
    border: none !important;
    background: transparent !important;
}

.stTabs [data-baseweb="tab"] span,
.stTabs [data-baseweb="tab"] div,
.stTabs [data-baseweb="tab"] p {
    color: #475569 !important;
    font-weight: 600 !important;
}

.stTabs [aria-selected="true"] {
    background: #2563EB !important;
    border-radius: 9999px !important;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35) !important;
}

.stTabs [aria-selected="true"] span,
.stTabs [aria-selected="true"] div,
.stTabs [aria-selected="true"] p {
    color: #FFFFFF !important;
    font-weight: 700 !important;
}

.stTabs [data-baseweb="tab-highlight-title"] { display: none !important; }
.stTabs [data-baseweb="tab-border-line"] { display: none !important; }

/* Input Controls in Main Canvas */
.stApp div[data-baseweb="select"] > div, 
.stApp .stTextInput > div > div > input, 
.stApp .stTextArea > div > div > textarea {
    background-color: #FFFFFF !important;
    color: #0F172A !important;
    border: 1px solid #CBD5E1 !important;
    border-radius: 12px !important;
}

/* Sidebar Inputs */
[data-testid="stSidebar"] div[data-baseweb="select"] > div, 
[data-testid="stSidebar"] .stTextInput > div > div > input {
    background-color: #1E293B !important;
    color: #F8FAFC !important;
    border: 1px solid #334155 !important;
    border-radius: 12px !important;
}

/* Royal Blue Buttons */
.stButton > button {
    background: #2563EB !important;
    color: #FFFFFF !important;
    font-weight: 700 !important;
    border-radius: 12px !important;
    border: none !important;
    padding: 10px 24px !important;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3) !important;
}

.stButton > button:hover {
    background: #1D4ED8 !important;
    color: #FFFFFF !important;
    box-shadow: 0 6px 18px rgba(37, 99, 235, 0.4) !important;
}

/* Dataframe */
.stDataFrame {
    border-radius: 14px !important;
    overflow: hidden !important;
    border: 1px solid #E2E8F0 !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03) !important;
}
</style>
"""

st.markdown(INLINED_CSS, unsafe_allow_html=True)

# Helper to find file across multiple potential folder layouts
def resolve_path(*relative_paths):
    for p in relative_paths:
        if os.path.exists(p):
            return p
    return relative_paths[0]

# Ensure ZIP archive exists
if not os.path.exists("ai_resume_screening_system.zip"):
    create_zip_archive()

# Session State & Fast Cached Loader Helpers
@st.cache_data(show_spinner=False)
def cached_parse_resume(filepath):
    return parse_resume_file(filepath)

if "current_user" not in st.session_state:
    st.session_state.current_user = None
if "eval_results" not in st.session_state:
    st.session_state.eval_results = []
if "jd_text" not in st.session_state:
    st.session_state.jd_text = ""
if "jd_title" not in st.session_state:
    st.session_state.jd_title = "Senior AI / Machine Learning Engineer"

def load_sample_data(jd_filename="AI_ML_Engineer_JD.txt"):
    with st.spinner("⚡ Loading AI Showcase Data..."):
        jd_path 
