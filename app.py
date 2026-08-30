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

# 3. TAILADMIN PREMIUM THEME CSS
TAILADMIN_CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body, [class*="css"] {
    font-family: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif !important;
    letter-spacing: -0.01em;
}

.stApp {
    background: linear-gradient(135deg, #F5F7FA 0%, #E8EEF7 100%) !important;
    color: #1F2937 !important;
}

[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFB 100%) !important;
    border-right: 1px solid #E5E7EB !important;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04) !important;
}

[data-testid="stSidebar"] * {
    color: #374151 !important;
}

[data-testid="stSidebar"] h1, [data-testid="stSidebar"] h2, [data-testid="stSidebar"] h3 {
    color: #111827 !important;
    font-weight: 700 !important;
}

.hero-banner {
    background: linear-gradient(135deg, #667EEA 0%, #764BA2 50%, #F093FB 100%) !important;
    border: none !important;
    border-radius: 16px !important;
    padding: 40px 45px !important;
    margin-bottom: 32px !important;
    box-shadow: 0 10px 40px rgba(102, 126, 234, 0.2) !important;
    position: relative;
    overflow: hidden;
}

.hero-title {
    font-family: 'Inter', sans-serif !important;
    font-size: 2.8rem !important;
    font-weight: 800 !important;
    color: #FFFFFF !important;
    margin-bottom: 12px !important;
    position: relative;
    z-index: 2;
    letter-spacing: -0.02em;
}

.hero-subtitle {
    font-size: 1.1rem !important;
    color: rgba(255, 255, 255, 0.85) !important;
    line-height: 1.8 !important;
    position: relative;
    z-index: 2;
    font-weight: 400;
}

.badge-pill {
    display: inline-flex !important;
    padding: 8px 16px !important;
    border-radius: 20px !important;
    font-size: 0.75rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.08em !important;
    margin-right: 10px !important;
    margin-bottom: 14px !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.badge-primary {
    background: rgba(102, 126, 234, 0.15) !important;
    color: #667EEA !important;
    border: 1px solid rgba(102, 126, 234, 0.3) !important;
}

.badge-success {
    background: rgba(16, 185, 129, 0.15) !important;
    color: #10B981 !important;
    border: 1px solid rgba(16, 185, 129, 0.3) !important;
}

.badge-warning {
    background: rgba(245, 158, 11, 0.15) !important;
    color: #F59E0B !important;
    border: 1px solid rgba(245, 158, 11, 0.3) !important;
}

.glass-card {
    background: #FFFFFF !important;
    border: 1px solid #E5E7EB !important;
    border-radius: 14px !important;
    padding: 28px !important;
    margin-bottom: 24px !important;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.glass-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
    border-color: #D1D5DB !important;
}

.glass-card *, .glass-card h1, .glass-card h2, .glass-card h3, .glass-card p, .glass-card label, .glass-card span {
    color: #1F2937 !important;
}

.metric-box-inner {
    border-radius: 14px !important;
    padding: 24px 20px !important;
    text-align: center !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03) !important;
    border: 1px solid transparent !important;
    transition: all 0.3s ease !important;
    position: relative;
    overflow: hidden;
}

.metric-box-inner::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
}

.metric-card-1 {
    background: linear-gradient(135deg, #F0F4FF 0%, #E8EEFF 100%) !important;
    border: 1px solid #E0E7FF !important;
    --gradient-start: #667EEA;
    --gradient-end: #764BA2;
}
.metric-card-1 .metric-val { color: #667EEA !important; }
.metric-card-1 .metric-lbl { color: #667EEA !important; }

.metric-card-2 {
    background: linear-gradient(135deg, #F0FDFB 0%, #E8FEFA 100%) !important;
    border: 1px solid #CCFBF1 !important;
    --gradient-start: #14B8A6;
    --gradient-end: #06B6D4;
}
.metric-card-2 .metric-val { color: #14B8A6 !important; }
.metric-card-2 .metric-lbl { color: #14B8A6 !important; }

.metric-card-3 {
    background: linear-gradient(135deg, #F5F3FF 0%, #FAF5FF 100%) !important;
    border: 1px solid #E9D5FF !important;
    --gradient-start: #A855F7;
    --gradient-end: #D946EF;
}
.metric-card-3 .metric-val { color: #A855F7 !important; }
.metric-card-3 .metric-lbl { color: #A855F7 !important; }

.metric-card-4 {
    background: linear-gradient(135deg, #FFF7ED 0%, #FFEAA7 100%) !important;
    border: 1px solid #FDBA74 !important;
    --gradient-start: #FB923C;
    --gradient-end: #F59E0B;
}
.metric-card-4 .metric-val { color: #FB923C !important; }
.metric-card-4 .metric-lbl { color: #FB923C !important; }

.metric-val {
    font-family: 'Inter', sans-serif !important;
    font-size: 2.5rem !important;
    font-weight: 800 !important;
    line-height: 1.1 !important;
    letter-spacing: -0.02em;
}

.metric-lbl {
    font-size: 0.85rem !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.08em !important;
    margin-top: 8px !important;
    opacity: 0.85 !important;
}

.skill-tag {
    display: inline-flex !important;
    align-items: center !important;
    border-radius: 12px !important;
    padding: 6px 14px !important;
    font-size: 0.85rem !important;
    margin: 5px !important;
    font-weight: 600 !important;
    backdrop-filter: blur(10px) !important;
    border: 1px solid transparent !important;
    transition: all 0.2s ease !important;
}

.skill-matched {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1)) !important;
    color: #059669 !important;
    border: 1px solid rgba(16, 185, 129, 0.3) !important;
}

.skill-matched:hover {
    background: rgba(16, 185, 129, 0.2) !important;
}

.skill-missing {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1)) !important;
    color: #DC2626 !important;
    border: 1px solid rgba(239, 68, 68, 0.3) !important;
}

.skill-missing:hover {
    background: rgba(239, 68, 68, 0.2) !important;
}

.stTabs [data-baseweb="tab-list"] {
    gap: 8px !important;
    background: #F3F4F6 !important;
    padding: 6px !important;
    border-radius: 12px !important;
    border: 1px solid #E5E7EB !important;
    margin-bottom: 28px !important;
}

.stTabs [data-baseweb="tab"] {
    height: 44px !important;
    border-radius: 10px !important;
    color: #6B7280 !important;
    font-weight: 600 !important;
    font-size: 0.95rem !important;
    padding: 0 20px !important;
    border: none !important;
    background: transparent !important;
    transition: all 0.3s ease !important;
}

.stTabs [data-baseweb="tab"] span, .stTabs [data-baseweb="tab"] div, .stTabs [data-baseweb="tab"] p {
    color: #6B7280 !important;
    font-weight: 600 !important;
}

.stTabs [aria-selected="true"] {
    background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%) !important;
    border-radius: 10px !important;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3) !important;
}

.stTabs [aria-selected="true"] span, .stTabs [aria-selected="true"] div, .stTabs [aria-selected="true"] p {
    color: #FFFFFF !important;
    font-weight: 700 !important;
}

.stTabs [data-baseweb="tab-highlight-title"] { display: none !important; }
.stTabs [data-baseweb="tab-border-line"] { display: none !important; }

.stApp div[data-baseweb="select"] > div, .stApp .stTextInput > div > div > input, .stApp .stTextArea > div > div > textarea, .stApp .stNumberInput > div > div > input {
    background-color: #FFFFFF !important;
    color: #111827 !important;
    border: 1.5px solid #E5E7EB !important;
    border-radius: 10px !important;
    font-size: 0.95rem !important;
    font-family: 'Sora', sans-serif !important;
    transition: all 0.2s ease !important;
}

.stApp div[data-baseweb="select"] > div:hover, .stApp .stTextInput > div > div > input:hover, .stApp .stTextArea > div > div > textarea:hover {
    border-color: #D1D5DB !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
}

.stApp div[data-baseweb="select"] > div:focus-within, .stApp .stTextInput > div > div > input:focus-within, .stApp .stTextArea > div > div > textarea:focus-within {
    border-color: #667EEA !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
}

[data-testid="stSidebar"] div[data-baseweb="select"] > div, [data-testid="stSidebar"] .stTextInput > div > div > input, [data-testid="stSidebar"] .stNumberInput > div > div > input {
    background-color: #F9FAFB !important;
    color: #111827 !important;
    border: 1.5px solid #E5E7EB !important;
    border-radius: 10px !important;
}

.stButton > button {
    background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%) !important;
    color: #FFFFFF !important;
    font-weight: 700 !important;
    border-radius: 10px !important;
    border: none !important;
    padding: 12px 28px !important;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3) !important;
    font-size: 0.95rem !important;
    font-family: 'Sora', sans-serif !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    letter-spacing: -0.01em;
}

.stButton > button:hover {
    background: linear-gradient(135deg, #5568D3 0%, #6B3D8F 100%) !important;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4) !important;
    transform: translateY(-2px) !important;
}

.stButton > button:active {
    transform: translateY(0) !important;
}

.stDataFrame {
    border-radius: 14px !important;
    overflow: hidden !important;
    border: 1px solid #E5E7EB !important;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04) !important;
}

.stDataFrame th {
    background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%) !important;
    color: #111827 !important;
    font-weight: 700 !important;
    border-bottom: 2px solid #D1D5DB !important;
}

.stDataFrame td {
    border-bottom: 1px solid #E5E7EB !important;
}

.stDataFrame tr:hover {
    background: linear-gradient(90deg, #F9FAFB 0%, transparent 100%) !important;
}

h1, h2, h3, h4, h5, h6 {
    color: #111827 !important;
    font-weight: 700 !important;
    letter-spacing: -0.01em !important;
}

h1 { font-size: 2.2rem !important; }
h2 { font-size: 1.8rem !important; }
h3 { font-size: 1.4rem !important; }

p, span, label, div {
    color: #374151 !important;
}

::-webkit-scrollbar {
    width: 8px !important;
    height: 8px !important;
}

::-webkit-scrollbar-track {
    background: #F3F4F6 !important;
}

::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #667EEA 0%, #764BA2 100%) !important;
    border-radius: 10px !important;
}

::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #5568D3 0%, #6B3D8F 100%) !important;
}

.stMarkdown hr {
    border-color: #E5E7EB !important;
}

</style>
"""

st.markdown(TAILADMIN_CSS, unsafe_allow_html=True)

def resolve_path(*relative_paths):
    for p in relative_paths:
        if os.path.exists(p):
            return p
    return relative_paths[0]

if not os.path.exists("ai_resume_screening_system.zip"):
    create_zip_archive()

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
        jd_path = resolve_path(
            os.path.join("sample_data/job_descriptions", jd_filename),
            os.path.join("job_descriptions", jd_filename),
            jd_filename
        )
        if os.path.exists(jd_path):
            with open(jd_path, "r", encoding="utf-8") as f:
                st.session_state.jd_text = f.read()
                st.session_state.jd_title = jd_filename.replace("_JD.txt", "").replace("_", " ")

        results = []
        resume_files = glob.glob("sample_data/resumes/*") + glob.glob("resumes/*")
        unique_paths = list(set(resume_files))
        for filepath in unique_paths:
            if os.path.isfile(filepath):
                cand_data = cached_parse_resume(filepath)
                eval_res = evaluate_candidate(cand_data, st.session_state.jd_text)
                results.append(eval_res)

        results.sort(key=lambda x: x["overall_score"], reverse=True)
        st.session_state.eval_results = results

if st.session_state.current_user and not st.session_state.eval_results:
    latest_s_info, latest_cands = db_get_latest_user_screening(st.session_state.current_user["id"])
    if latest_s_info and latest_cands:
        st.session_state.jd_title = latest_s_info["jd_title"]
        st.session_state.jd_text = latest_s_info["jd_text"]
        st.session_state.eval_results = latest_cands

with st.sidebar:
    st.markdown('<div style="text-align: center; padding: 10px;"><span style="font-size: 2rem;">🎯</span><h2 style="margin-top: 10px;">TailAdmin</h2></div>', unsafe_allow_html=True)
    st.markdown("---")

    if not st.session_state.current_user:
        st.subheader("🔑 Account Login")
        st.caption("Default: `admin` / `admin123`")
        auth_mode = st.radio("Select Action:", ["Login", "Register", "Forgot Password?"], horizontal=True)

        if auth_mode == "Login":
            username = st.text_input("Username:", value="admin", key="login_user")
            password = st.text_input("Password:", value="admin123", type="password", key="login_pass")
            if st.button("Login to Account", use_container_width=True, type="primary"):
                user = db_authenticate_user(username, password)
                if user:
                    st.session_state.current_user = user
                    latest_s_info, latest_cands = db_get_latest_user_screening(user["id"])
                    if latest_s_info and latest_cands:
                        st.session_state.jd_title = latest_s_info["jd_title"]
                        st.session_state.jd_text = latest_s_info["jd_text"]
                        st.session_state.eval_results = latest_cands
                        st.success(f"Welcome back {user['full_name']}!")
                    else:
                        st.success(f"Welcome back, {user['full_name']}!")
                    st.rerun()
                else:
                    st.error("Invalid Username or Password.")
        elif auth_mode == "Register":
            reg_name = st.text_input("Full Name:", key="reg_name")
            reg_user = st.text_input("Username:", key="reg_user")
            reg_pass = st.text_input("Password:", type="password", key="reg_pass")
            if st.button("Register Account", use_container_width=True):
                if reg_user and reg_pass and reg_name:
                    ok, msg = db_register_user(reg_user, reg_pass, reg_name)
                    if ok:
                        st.success(msg)
                    else:
                        st.error(msg)
                else:
                    st.warning("Please fill in all registration fields.")
        else:
            reset_user = st.text_input("Account Username:", key="reset_user")
            reset_new_pass = st.text_input("New Password:", type="password", key="reset_new_pass")
            if st.button("Reset Password", use_container_width=True):
                if reset_user and reset_new_pass:
                    ok, msg = db_reset_password(reset_user, reset_new_pass)
                    if ok:
                        st.success(msg)
                    else:
                        st.error(msg)
                else:
                    st.warning("Please enter username and new password.")
    else:
        user = st.session_state.current_user
        st.markdown(f"👤 **{user['full_name']}**")
        st.caption(f"@{user['username']}")
        
        if st.button("Logout", use_container_width=True):
            st.session_state.current_user = None
            st.session_state.eval_results = []
            st.rerun()

        st.markdown("---")
        st.subheader("💾 Saved Sessions")
        
        if st.session_state.eval_results and st.session_state.jd_text:
            if st.button("Save Current Results", use_container_width=True):
                s_id = db_save_screening_session(
                    user["id"],
                    st.session_state.jd_title,
                    st.session_state.jd_text,
                    st.session_state.eval_results
                )
                st.success(f"Session #{s_id} saved!")

        user_sessions = db_get_user_screenings(user["id"])
        if user_sessions:
            session_options = {f"#{s['id']} - {s['jd_title'][:20]}" : s['id'] for s in user_sessions}
            selected_s = st.selectbox("Load Session:", list(session_options.keys()))
            if st.button("Load Selected", use_container_width=True):
                s_id = session_options[selected_s]
                s_info, s_cands = db_load_screening_details(s_id)
                if s_info:
                    st.session_state.jd_title = s_info["jd_title"]
                    st.session_state.jd_text = s_info["jd_text"]
                    st.session_state.eval_results = s_cands
                    st.success("Loaded!")
                    st.rerun()

    st.markdown("---")
    st.subheader("⚡ Demo Data")
    if st.button("Load Sample Data", use_container_width=True, type="primary"):
        load_sample_data()
        st.success("Loaded!")
        st.rerun()

    st.markdown("---")
    st.subheader("⚙️ Scoring Weights")
    
    w_skill = st.slider("Skill Match", 0.0, 1.0, 0.40, 0.05)
    w_semantic = st.slider("Semantic Similarity", 0.0, 1.0, 0.35, 0.05)
    w_exp = st.slider("Experience", 0.0, 1.0, 0.15, 0.05)
    w_edu = st.slider("Education", 0.0, 1.0, 0.10, 0.05)

    total_w = w_skill + w_semantic + w_exp + w_edu
    if total_w > 0:
        weights = {
            'skill': w_skill / total_w,
            'semantic': w_semantic / total_w,
            'experience': w_exp / total_w,
            'education': w_edu / total_w
        }
    else:
        weights = {'skill': 0.40, 'semantic': 0.35, 'experience': 0.15, 'education': 0.10}

    st.markdown("---")
    st.subheader("🎯 Filters")
    min_score_filter = st.slider("Min Fit Score (%)", 0, 100, 0, 5)
    status_filter = st.multiselect(
        "Match Status",
        ["Top Match", "Potential Fit", "Low Match"],
        default=["Top Match", "Potential Fit", "Low Match"]
    )

render_hero_banner()

tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "📝 Ingestion",
    "📊 Leaderboard",
    "⚔️ Comparison",
    "📈 Analytics",
    "📥 Reports",
    "🔬 AI Engine"
])

with tab1:
    col_jd, col_resumes = st.columns([1, 1])

    with col_jd:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.subheader("Job Description")
        
        preset_jd = st.selectbox(
            "Template:",
            ["Custom Input", "Senior AI / ML Engineer", "Full Stack Web Developer", "Data Analyst"]
        )

        if preset_jd == "Senior AI / ML Engineer":
            p = resolve_path("sample_data/job_descriptions/AI_ML_Engineer_JD.txt", "job_descriptions/AI_ML_Engineer_JD.txt")
            if os.path.exists(p):
                with open(p, "r") as f:
                    st.session_state.jd_text = f.read()
                    st.session_state.jd_title = "Senior AI / Machine Learning Engineer"
        elif preset_jd == "Full Stack Web Developer":
            p = resolve_path("sample_data/job_descriptions/Full_Stack_Developer_JD.txt", "job_descriptions/Full_Stack_Developer_JD.txt")
            if os.path.exists(p):
                with open(p, "r") as f:
                    st.session_state.jd_text = f.read()
                    st.session_state.jd_title = "Full Stack Web Developer"
        elif preset_jd == "Data Analyst":
            p = resolve_path("sample_data/job_descriptions/Data_Analyst_JD.txt", "job_descriptions/Data_Analyst_JD.txt")
            if os.path.exists(p):
                with open(p, "r") as f:
                    st.session_state.jd_text = f.read()
                    st.session_state.jd_title = "Data Analyst Specialist"

        jd_input = st.text_area(
            "Job Description:",
            value=st.session_state.jd_text,
            height=250,
            placeholder="Paste job description here..."
        )
        st.session_state.jd_text = jd_input

        if jd_input.strip():
            reqs = parse_job_requirements(jd_input)
            st.markdown("---")
            st.markdown("#### Job Criteria")
            st.markdown(f"**Experience:** `{reqs['min_experience_years']}+ Years` | **Education:** `{reqs['min_education']}`")
            st.markdown("**Target Skills:**")
            st.markdown(render_skill_tags(reqs["required_skills"], matched=True), unsafe_allow_html=True)

        st.markdown('</div>', unsafe_allow_html=True)

    with col_resumes:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.subheader("Candidate Resumes")
        
        uploaded_files = st.file_uploader(
            "Upload (PDF, DOCX, TXT):",
            type=["pdf", "docx", "doc", "txt"],
            accept_multiple_files=True
        )

        col_opt1, col_opt2 = st.columns([1.2, 1])
        with col_opt1:
            use_sample_resumes = st.checkbox("Use Sample Resumes", value=False)
        with col_opt2:
            if st.button("🗑️ Clear", use_container_width=True):
                st.session_state.eval_results = []
                st.success("Cleared!")
                st.rerun()

        st.markdown("---")
        run_screening = st.button("Run AI Screening", use_container_width=True, type="primary")

        if run_screening:
            if not st.session_state.jd_text.strip():
                st.error("Please provide a Job Description first!")
            else:
                with st.spinner("⚡ Processing..."):
                    candidates_list = []
                    if uploaded_files:
                        for uf in uploaded_files:
                            cand_data = parse_resume_file(uf)
                            candidates_list.append(cand_data)

                    if use_sample_resumes:
                        sample_paths = glob.glob("sample_data/resumes/*") + glob.glob("resumes/*")
                        for sp in set(sample_paths):
                            if os.path.isfile(sp):
                                cand_data = cached_parse_resume(sp)
                                candidates_list.append(cand_data)

                    existing_map = {r["candidate_name"]: r for r in st.session_state.eval_results}
                    
                    for cand in candidates_list:
                        res = evaluate_candidate(cand, st.session_state.jd_text, weights=weights)
                        existing_map[res["candidate_name"]] = res

                    merged_results = list(existing_map.values())
                    merged_results.sort(key=lambda x: x["overall_score"], reverse=True)
                    st.session_state.eval_results = merged_results
                    
                    if st.session_state.current_user:
                        db_save_screening_session(
                            st.session_state.current_user["id"],
                            st.session_state.jd_title,
                            st.session_state.jd_text,
                            merged_results
                        )

                    st.success(f"Evaluated {len(merged_results)} candidates!")
                    st.rerun()

        st.markdown('</div>', unsafe_allow_html=True)

if st.session_state.eval_results and st.session_state.jd_text:
    updated_results = []
    for res in st.session_state.eval_results:
        cand_dict = {
            "candidate_name": res["candidate_name"],
            "filename": res["filename"],
            "email": res["email"],
            "phone": res["phone"],
            "text": res["raw_text"],
            "experience_years": res["candidate_exp_years"],
            "education": res["candidate_edu"]
        }
        new_res = evaluate_candidate(cand_dict, st.session_state.jd_text, weights=weights)
        updated_results.append(new_res)

    updated_results.sort(key=lambda x: x["overall_score"], reverse=True)
    st.session_state.eval_results = updated_results

def clean_status(st_str):
    return st_str.replace("🟢", "").replace("🟡", "").replace("🔴", "").strip()

filtered_results = [
    r for r in st.session_state.eval_results
    if r["overall_score"] >= min_score_filter and clean_status(r["status"]) in [clean_status(sf) for sf in status_filter]
]

with tab2:
    if not filtered_results:
        st.warning("No candidates match filters.")
    else:
        total_cands = len(st.session_state.eval_results)
        top_matches = sum(1 for r in st.session_state.eval_results if r["overall_score"] >= 75)
        avg_score = sum(r["overall_score"] for r in st.session_state.eval_results) / max(total_cands, 1)
        best_cand = st.session_state.eval_results[0]["candidate_name"]
        best_score = st.session_state.eval_results[0]["overall_score"]

        render_metric_cards(total_cands, top_matches, avg_score, best_cand, best_score)
        st.markdown("<br>", unsafe_allow_html=True)

        col_head1, col_head2 = st.columns([3, 1])
        with col_head1:
            st.subheader("Candidate Leaderboard")
        with col_head2:
            if st.button("🗑️ Clear All", use_container_width=True):
                st.session_state.eval_results = []
                st.rerun()

        search_query = st.text_input("Search by Name, Email, or Skill:", placeholder="Type to search...")

        display_list = filtered_results
        if search_query.strip():
            sq = search_query.lower()
            display_list = [
                r for r in filtered_results
                if sq in r["candidate_name"].lower() or sq in r["email"].lower() or any(sq in s.lower() for s in r["matched_skills"])
            ]

        table_rows = []
        for rank, res in enumerate(display_list, 1):
            table_rows.append({
                "Rank": f"#{rank}",
                "Name": res["candidate_name"],
                "Overall": f"{round(float(res['overall_score']), 1)}%",
                "Skill": f"{round(float(res['skill_score']), 1)}%",
                "Semantic": f"{round(float(res['semantic_score']), 1)}%",
                "Exp": f"{res['candidate_exp_years']} Y",
                "Edu": res["candidate_edu"],
                "Status": clean_status(res["status"]),
                "Skills": len(res["matched_skills"])
            })

        df_table = pd.DataFrame(table_rows)
        st.dataframe(df_table, use_container_width=True, hide_index=True)

        st.markdown("---")
        st.subheader("Candidate Profiles")

        for rank, res in enumerate(display_list, 1):
            with st.expander(f"#{rank} | {res['candidate_name']} ({clean_status(res['status'])}) — {round(float(res['overall_score']), 1)}%"):
                col_info, col_chart = st.columns([1.2, 1])

                with col_info:
                    st.markdown(f"### {res['candidate_name']}")
                    st.markdown(f"**Email:** `{res['email']}` | **Phone:** `{res['phone']}`")
                    st.markdown(f"**Experience:** `{res['candidate_exp_years']} Years` | **Education:** `{res['candidate_edu']}`")
                    st.markdown("---")

                    st.markdown("**Matched Skills:**")
                    st.markdown(render_skill_tags(res["matched_skills"], matched=True), unsafe_allow_html=True)

                    st.markdown("**Missing Skills:**")
                    st.markdown(render_skill_tags(res["missing_skills"], matched=False), unsafe_allow_html=True)

                    if res["extra_skills"]:
                        st.markdown("**Additional Skills:**")
                        st.markdown(render_skill_tags(res["extra_skills"][:8], matched=True), unsafe_allow_html=True)

                with col_chart:
                    st.plotly_chart(plot_candidate_radar(res), use_container_width=True)

with tab3:
    if len(st.session_state.eval_results) < 2:
        st.info("At least 2 candidates needed for comparison.")
    else:
        st.subheader("Head-to-Head Comparison")
        cand_names = [r["candidate_name"] for r in st.session_state.eval_results]
        
        col_select1, col_select2 = st.columns(2)
        with col_select1:
            c1_name = st.selectbox("Candidate A:", cand_names, index=0)
        with col_select2:
            c2_name = st.selectbox("Candidate B:", cand_names, index=min(1, len(cand_names)-1))

        res1 = next(r for r in st.session_state.eval_results if r["candidate_name"] == c1_name)
        res2 = next(r for r in st.session_state.eval_results if r["candidate_name"] == c2_name)

        col_rad, col_stats = st.columns([1, 1.2])

        with col_rad:
            st.markdown("#### Skill Radar")
            st.plotly_chart(plot_comparison_radar(res1, res2), use_container_width=True)

        with col_stats:
            st.markdown("#### Score Breakdown")
            comp_data = [
                {"Metric": "Overall Fit", "A": f"{round(float(res1['overall_score']), 1)}%", "B": f"{round(float(res2['overall_score']), 1)}%"},
                {"Metric": "Skill Match", "A": f"{round(float(res1['skill_score']), 1)}%", "B": f"{round(float(res2['skill_score']), 1)}%"},
                {"Metric": "Semantic Sim", "A": f"{round(float(res1['semantic_score']), 1)}%", "B": f"{round(float(res2['semantic_score']), 1)}%"},
                {"Metric": "Experience", "A": f"{round(float(res1['experience_score']), 1)}%", "B": f"{round(float(res2['experience_score']), 1)}%"},
                {"Metric": "Education", "A": f"{round(float(res1['education_score']), 1)}%", "B": f"{round(float(res2['education_score']), 1)}%"},
                {"Metric": "Years", "A": f"{res1['candidate_exp_years']} Y", "B": f"{res2['candidate_exp_years']} Y"}
            ]
            st.dataframe(pd.DataFrame(comp_data), hide_index=True, use_container_width=True)

        st.markdown("---")
        st.subheader("AI Feedback")
        col_fb1, col_fb2 = st.columns(2)

        for col, res in zip([col_fb1, col_fb2], [res1, res2]):
            with col:
                st.markdown(f'<div class="glass-card">', unsafe_allow_html=True)
                fb = generate_candidate_feedback(res)
                st.markdown(f"### {res['candidate_name']}")
                st.markdown(f"**Assessment:** {fb['summary']}")

                st.markdown("#### Strengths")
                for s in fb["strengths"]:
                    st.markdown(f"- {s}")

                st.markdown("#### Gaps")
                for w in fb["weaknesses"]:
                    st.markdown(f"- {w}")

                st.markdown("#### Interview Questions")
                for q in fb["interview_questions"]:
                    st.markdown(f"**{q}**")

                st.markdown('</div>', unsafe_allow_html=True)

with tab4:
    if not st.session_state.eval_results:
        st.warning("No data available.")
    else:
        st.subheader("Skill Analytics")
        col_a1, col_a2 = st.columns(2)

        with col_a1:
            st.markdown("#### Score Distribution")
            scores = [r["overall_score"] for r in st.session_state.eval_results]
            fig_hist = px.histogram(
                scores,
                nbins=10,
                labels={'value': 'Score (%)'},
                color_discrete_sequence=['#667EEA']
            )
            fig_hist.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(245,247,250,0.5)',
                font=dict(color="#374151"),
                showlegend=False,
                height=350
            )
            st.plotly_chart(fig_hist, use_container_width=True)

        with col_a2:
            st.markdown("#### Missing Skills")
            missing_counter = {}
            for r in st.session_state.eval_results:
                for ms in r["missing_skills"]:
                    missing_counter[ms] = missing_counter.get(ms, 0) + 1

            if missing_counter:
                df_missing = pd.DataFrame(list(missing_counter.items()), columns=['Skill', 'Count']).sort_values(by='Count', ascending=True)
                fig_miss = px.bar(
                    df_missing.tail(8),
                    x='Count',
                    y='Skill',
                    orientation='h',
                    color='Count',
                    color_continuous_scale='Reds'
                )
                fig_miss.update_layout(
                    paper_bgcolor='rgba(0,0,0,0)',
                    plot_bgcolor='rgba(245,247,250,0.5)',
                    font=dict(color="#374151"),
                    height=350
                )
                st.plotly_chart(fig_miss, use_container_width=True)
            else:
                st.success("No gaps!")

with tab5:
    st.subheader("Export Reports")
    col_exp1, col_exp2 = st.columns(2)

    with col_exp1:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.markdown("### CSV Export")
        st.write("Download candidate data in CSV format.")
        csv_bytes = generate_csv_report(st.session_state.eval_results)
        st.download_button(
            label="Download CSV",
            data=csv_bytes,
            file_name="candidates.csv",
            mime="text/csv",
            use_container_width=True
        )
        st.markdown('</div>', unsafe_allow_html=True)

    with col_exp2:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.markdown("### PDF Export")
        st.write("Download executive summary PDF.")
        pdf_bytes = generate_pdf_report(st.session_state.eval_results, st.session_state.jd_title)
        st.download_button(
            label="Download PDF",
            data=pdf_bytes,
            file_name="report.pdf",
            mime="application/pdf",
            use_container_width=True
        )
        st.markdown('</div>', unsafe_allow_html=True)

with tab6:
    st.subheader("Algorithm Mechanics")

    st.markdown("""
        <div class="glass-card">
            <h3>Multi-Factor Scoring</h3>
            <p>Overall Fit = (0.40 × Skill) + (0.35 × Semantic) + (0.15 × Exp) + (0.10 × Edu)</p>
        </div>
    """, unsafe_allow_html=True)

    col_m1, col_m2 = st.columns(2)

    with col_m1:
        st.markdown("""
            <div class="glass-card">
                <h3>TF-IDF & Cosine</h3>
                <p>Measures semantic similarity using vectorization</p>
            </div>
        """, unsafe_allow_html=True)

    with col_m2:
        st.markdown("""
            <div class="glass-card">
                <h3>Skill Extraction</h3>
                <p>250+ technical skills taxonomy</p>
            </div>
        """, unsafe_allow_html=True)
