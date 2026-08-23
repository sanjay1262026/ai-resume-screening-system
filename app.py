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

# Page Configuration & Theme
st.set_page_config(
    page_title="AI Resume Screening System",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Helper to find file across multiple potential folder layouts
def resolve_path(*relative_paths):
    for p in relative_paths:
        if os.path.exists(p):
            return p
    return relative_paths[0]

# Load Custom CSS
def load_css():
    css_path = resolve_path("assets/style.css", "style.css", "style")
    if os.path.exists(css_path):
        with open(css_path, "r", encoding="utf-8") as f:
            st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

load_css()

# Ensure ZIP archive exists
if not os.path.exists("ai_resume_screening_system.zip"):
    create_zip_archive()

# Session State & Cached Loader Helpers
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

# AUTO RESTORE: If user is logged in, automatically restore their latest saved screening from DB
if st.session_state.current_user and not st.session_state.eval_results:
    latest_s_info, latest_cands = db_get_latest_user_screening(st.session_state.current_user["id"])
    if latest_s_info and latest_cands:
        st.session_state.jd_title = latest_s_info["jd_title"]
        st.session_state.jd_text = latest_s_info["jd_text"]
        st.session_state.eval_results = latest_cands

# Sidebar Authentication & Controls
with st.sidebar:
    st.image("https://img.icons8.com/color/96/000000/brain--v1.png", width=60)
    st.title("Control Panel")
    st.markdown("---")

    # USER AUTHENTICATION SECTION
    if not st.session_state.current_user:
        st.subheader("🔑 Account Login & Storage")
        st.caption("Default Admin: `admin` / `admin123`")
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
                        st.success(f"Welcome back {user['full_name']}! Auto-restored your saved screening.")
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
        else: # Forgot Password
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
        st.markdown(f"👤 **Logged in as:** `{user['full_name']}` (`@{user['username']}`)")
        
        if st.button("Logout", use_container_width=True):
            st.session_state.current_user = None
            st.session_state.eval_results = []
            st.rerun()

        st.markdown("---")
        st.subheader("💾 Saved Screening Sessions")
        
        if st.session_state.eval_results and st.session_state.jd_text:
            if st.button("Save Current Results to DB", use_container_width=True):
                s_id = db_save_screening_session(
                    user["id"],
                    st.session_state.jd_title,
                    st.session_state.jd_text,
                    st.session_state.eval_results
                )
                st.success(f"Screening session #{s_id} saved to database!")

        user_sessions = db_get_user_screenings(user["id"])
        if user_sessions:
            session_options = {f"#{s['id']} - {s['jd_title']} ({s['created_at'][:10]})": s['id'] for s in user_sessions}
            selected_s = st.selectbox("Load Saved Screening:", list(session_options.keys()))
            if st.button("Load Selected Session", use_container_width=True):
                s_id = session_options[selected_s]
                s_info, s_cands = db_load_screening_details(s_id)
                if s_info:
                    st.session_state.jd_title = s_info["jd_title"]
                    st.session_state.jd_text = s_info["jd_text"]
                    st.session_state.eval_results = s_cands
                    st.success("Loaded saved screening session!")
                    st.rerun()

    st.markdown("---")
    st.subheader("⚡ Quick Demo Loader")
    if st.button("Load Sample Showcase Data", use_container_width=True):
        load_sample_data()
        st.success("Loaded sample resumes & JD!")
        st.rerun()

    st.markdown("---")
    st.subheader("Scoring Weight Matrix")
    st.caption("Adjust algorithm priorities dynamically:")

    w_skill = st.slider("Skill Match Weight", 0.0, 1.0, 0.40, 0.05)
    w_semantic = st.slider("Semantic Similarity Weight", 0.0, 1.0, 0.35, 0.05)
    w_exp = st.slider("Experience Weight", 0.0, 1.0, 0.15, 0.05)
    w_edu = st.slider("Education Weight", 0.0, 1.0, 0.10, 0.05)

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
    st.subheader("Leaderboard Filters")
    min_score_filter = st.slider("Min Overall Fit (%)", 0, 100, 0, 5)
    status_filter = st.multiselect(
        "Filter by Match Status",
        ["Top Match", "Potential Fit", "Low Match"],
        default=["Top Match", "Potential Fit", "Low Match"]
    )

# Main App Layout & Header
render_hero_banner()

# Navigation Tabs
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "Ingestion & Setup",
    "Screening Leaderboard",
    "Candidate Comparison & AI Feedback",
    "Skill Gap Analytics",
    "Export & Reports",
    "AI Engine & Math"
])

# ==========================================
# TAB 1: Ingestion & Job Description Setup
# ==========================================
with tab1:
    col_jd, col_resumes = st.columns([1, 1])

    with col_jd:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.subheader("1. Job Description (JD)")
        
        preset_jd = st.selectbox(
            "Select Pre-built Job Template:",
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
            "Target Job Description Text:",
            value=st.session_state.jd_text,
            height=300,
            placeholder="Paste complete job description requirements here..."
        )
        st.session_state.jd_text = jd_input

        if jd_input.strip():
            reqs = parse_job_requirements(jd_input)
            st.markdown("---")
            st.markdown("#### Extracted Job Criteria:")
            st.markdown(f"**Required Experience:** `{reqs['min_experience_years']}+ Years` | **Minimum Degree:** `{reqs['min_education']}`")
            st.markdown("**Target Skills Identified:**")
            st.markdown(render_skill_tags(reqs["required_skills"], matched=True), unsafe_allow_html=True)

        st.markdown('</div>', unsafe_allow_html=True)

    with col_resumes:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.subheader("2. Candidate Resumes")
        
        uploaded_files = st.file_uploader(
            "Upload Candidate Resumes (PDF, DOCX, TXT):",
            type=["pdf", "docx", "doc", "txt"],
            accept_multiple_files=True
        )

        col_opt1, col_opt2 = st.columns([1.2, 1])
        with col_opt1:
            use_sample_resumes = st.checkbox("Include Pre-loaded Sample Resumes", value=False)
        with col_opt2:
            if st.button("🗑️ Clear Existing Candidates", use_container_width=True):
                st.session_state.eval_results = []
                st.success("Cleared existing candidate history!")
                st.rerun()

        st.markdown("---")
        run_screening = st.button("Run AI Screening & Candidate Ranking Engine", use_container_width=True, type="primary")

        if run_screening:
            if not st.session_state.jd_text.strip():
                st.error("Please provide or select a Job Description first!")
            else:
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
                
                # AUTO SAVE TO DB: Saves automatically when logged in!
                if st.session_state.current_user:
                    db_save_screening_session(
                        st.session_state.current_user["id"],
                        st.session_state.jd_title,
                        st.session_state.jd_text,
                        merged_results
                    )

                st.success(f"Successfully evaluated and accumulated {len(merged_results)} candidate resumes!")
                st.rerun()

        st.markdown('</div>', unsafe_allow_html=True)

# Recalculate weights if adjusted without re-uploading
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

# ==========================================
# TAB 2: Screening Dashboard & Leaderboard
# ==========================================
with tab2:
    if not filtered_results:
        st.warning("No candidate resumes match the active filters or state.")
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
            st.subheader("Candidate Screening Leaderboard")
        with col_head2:
            if st.button("🗑️ Clear Candidates", use_container_width=True):
                st.session_state.eval_results = []
                st.rerun()

        search_query = st.text_input("Search Candidates by Name, Email, or Skill:", placeholder="Type 'Python', 'Alex', or 'PyTorch'...")

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
                "Candidate Name": res["candidate_name"],
                "Overall Fit": f"{round(float(res['overall_score']), 1)}%",
                "Skill Score": f"{round(float(res['skill_score']), 1)}%",
                "Semantic Sim": f"{round(float(res['semantic_score']), 1)}%",
                "Experience": f"{res['candidate_exp_years']} Yrs",
                "Education": res["candidate_edu"],
                "Status": clean_status(res["status"]),
                "Matched Skills Count": len(res["matched_skills"])
            })

        df_table = pd.DataFrame(table_rows)
        st.dataframe(
            df_table,
            use_container_width=True,
            hide_index=True
        )

        st.markdown("---")
        st.subheader("Candidate Profiles & Skill Matrices")

        for rank, res in enumerate(display_list, 1):
            with st.expander(f"#{rank} | {res['candidate_name']} ({clean_status(res['status'])}) — Overall Fit: {round(float(res['overall_score']), 1)}%"):
                col_info, col_chart = st.columns([1.2, 1])

                with col_info:
                    st.markdown(f"### {res['candidate_name']}")
                    st.markdown(f"**Email:** `{res['email']}` | **Phone:** `{res['phone']}`")
                    st.markdown(f"**Experience:** `{res['candidate_exp_years']} Years` | **Education:** `{res['candidate_edu']}`")
                    st.markdown("---")

                    st.markdown("**Matched Required Skills:**")
                    st.markdown(render_skill_tags(res["matched_skills"], matched=True), unsafe_allow_html=True)

                    st.markdown("**Missing Required Skills:**")
                    st.markdown(render_skill_tags(res["missing_skills"], matched=False), unsafe_allow_html=True)

                    if res["extra_skills"]:
                        st.markdown("**Additional Skills Mentioned:**")
                        st.markdown(render_skill_tags(res["extra_skills"][:8], matched=True), unsafe_allow_html=True)

                with col_chart:
                    st.plotly_chart(plot_candidate_radar(res), use_container_width=True)

# ==========================================
# TAB 3: Candidate Comparison & AI Feedback
# ==========================================
with tab3:
    if len(st.session_state.eval_results) < 2:
        st.info("At least 2 evaluated candidates are required for side-by-side comparison.")
    else:
        st.subheader("Side-by-Side Candidate Head-to-Head Comparison")
        cand_names = [r["candidate_name"] for r in st.session_state.eval_results]
        
        col_select1, col_select2 = st.columns(2)
        with col_select1:
            c1_name = st.selectbox("Select Candidate A:", cand_names, index=0)
        with col_select2:
            c2_name = st.selectbox("Select Candidate B:", cand_names, index=min(1, len(cand_names)-1))

        res1 = next(r for r in st.session_state.eval_results if r["candidate_name"] == c1_name)
        res2 = next(r for r in st.session_state.eval_results if r["candidate_name"] == c2_name)

        col_rad, col_stats = st.columns([1, 1.2])

        with col_rad:
            st.markdown("#### Skill Radar Overlay")
            st.plotly_chart(plot_comparison_radar(res1, res2), use_container_width=True)

        with col_stats:
            st.markdown("#### Quantitative Breakdown")
            comp_data = [
                {"Metric": "Overall Fit Score", "Candidate A": f"{round(float(res1['overall_score']), 1)}%", "Candidate B": f"{round(float(res2['overall_score']), 1)}%"},
                {"Metric": "Skill Match Score", "Candidate A": f"{round(float(res1['skill_score']), 1)}%", "Candidate B": f"{round(float(res2['skill_score']), 1)}%"},
                {"Metric": "Semantic Similarity", "Candidate A": f"{round(float(res1['semantic_score']), 1)}%", "Candidate B": f"{round(float(res2['semantic_score']), 1)}%"},
                {"Metric": "Experience Score", "Candidate A": f"{round(float(res1['experience_score']), 1)}%", "Candidate B": f"{round(float(res2['experience_score']), 1)}%"},
                {"Metric": "Education Score", "Candidate A": f"{round(float(res1['education_score']), 1)}%", "Candidate B": f"{round(float(res2['education_score']), 1)}%"},
                {"Metric": "Experience (Years)", "Candidate A": f"{res1['candidate_exp_years']} Yrs", "Candidate B": f"{res2['candidate_exp_years']} Yrs"}
            ]
            st.dataframe(pd.DataFrame(comp_data), hide_index=True, use_container_width=True)

        st.markdown("---")
        st.subheader("Automated AI Feedback & Technical Interview Generator")
        col_fb1, col_fb2 = st.columns(2)

        for col, res in zip([col_fb1, col_fb2], [res1, res2]):
            with col:
                st.markdown(f'<div class="glass-card">', unsafe_allow_html=True)
                fb = generate_candidate_feedback(res)
                st.markdown(f"### {res['candidate_name']} ({clean_status(res['status'])})")
                st.markdown(f"**AI Assessment:** {fb['summary']}")

                st.markdown("#### Key Strengths")
                for s in fb["strengths"]:
                    st.markdown(f"- {s}")

                st.markdown("#### Skill & Qualification Gaps")
                for w in fb["weaknesses"]:
                    st.markdown(f"- {w}")

                st.markdown("#### Tailored Interview Questions")
                for q in fb["interview_questions"]:
                    st.markdown(f"**{q}**")

                st.markdown('</div>', unsafe_allow_html=True)

# ==========================================
# TAB 4: Skill Gap Analytics & Insights
# ==========================================
with tab4:
    if not st.session_state.eval_results:
        st.warning("No evaluation data available.")
    else:
        st.subheader("Candidate Pool Skill Analytics")
        col_a1, col_a2 = st.columns(2)

        with col_a1:
            st.markdown("#### Overall Fit Score Distribution")
            scores = [r["overall_score"] for r in st.session_state.eval_results]
            fig_hist = px.histogram(
                scores,
                nbins=10,
                labels={'value': 'Overall Fit Score (%)'},
                title="Applicant Fit Score Distribution",
                color_discrete_sequence=['#818CF8']
            )
            fig_hist.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(15,23,42,0.6)',
                font=dict(color="#F1F5F9"),
                showlegend=False
            )
            st.plotly_chart(fig_hist, use_container_width=True)

        with col_a2:
            st.markdown("#### Top Missing Skills Across All Applicants")
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
                    color_continuous_scale='Reds',
                    title="Most Common Skill Gaps"
                )
                fig_miss.update_layout(
                    paper_bgcolor='rgba(0,0,0,0)',
                    plot_bgcolor='rgba(15,23,42,0.6)',
                    font=dict(color="#F1F5F9")
                )
                st.plotly_chart(fig_miss, use_container_width=True)
            else:
                st.success("No missing required skills detected in applicant pool!")

        st.markdown("---")
        st.markdown("#### Talent Pool Skill Frequency Matrix")
        all_matched = []
        for r in st.session_state.eval_results:
            all_matched.extend(r["matched_skills"])

        if all_matched:
            freq_df = pd.Series(all_matched).value_counts().reset_index()
            freq_df.columns = ["Skill", "Candidates Possessing Skill"]
            fig_freq = px.bar(
                freq_df.head(12),
                x="Skill",
                y="Candidates Possessing Skill",
                color="Candidates Possessing Skill",
                color_continuous_scale="Viridis",
                title="Top Represented Skills in Pool"
            )
            fig_freq.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                plot_bgcolor='rgba(15,23,42,0.6)',
                font=dict(color="#F1F5F9")
            )
            st.plotly_chart(freq_df, use_container_width=True)

# ==========================================
# TAB 5: Export & Reports
# ==========================================
with tab5:
    st.subheader("Export Candidate Screening Reports")
    st.write("Generate official candidate screening reports for HR records or hiring committee reviews.")
    col_exp1, col_exp2 = st.columns(2)

    with col_exp1:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.markdown("### Export CSV Data")
        st.write("Download structured CSV file with candidate scores, contact info, and matched/missing skills.")
        csv_bytes = generate_csv_report(st.session_state.eval_results)
        st.download_button(
            label="Download CSV Report",
            data=csv_bytes,
            file_name="candidate_screening_leaderboard.csv",
            mime="text/csv",
            use_container_width=True
        )
        st.markdown('</div>', unsafe_allow_html=True)

    with col_exp2:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.markdown("### Export PDF Report")
        st.write("Generate a formatted executive summary PDF report with candidate rankings and detailed breakdowns.")
        pdf_bytes = generate_pdf_report(st.session_state.eval_results, st.session_state.jd_title)
        st.download_button(
            label="Download PDF Summary Report",
            data=pdf_bytes,
            file_name="candidate_screening_executive_report.pdf",
            mime="application/pdf",
            use_container_width=True
        )
        st.markdown('</div>', unsafe_allow_html=True)

# ==========================================
# TAB 6: AI Engine & Math Explainability
# ==========================================
with tab6:
    st.subheader("System Architecture & Algorithm Mechanics")

    st.markdown("""
        <div class="glass-card">
            <h3>1. Multi-Factor Scoring Formula</h3>
            <p>The candidate evaluation model computes a weighted composite match index across four key pillars:</p>
            <div style="background: rgba(15, 23, 42, 0.8); padding: 16px; border-radius: 12px; font-family: monospace; font-size: 1.05rem; color: #818CF8;">
                Overall Fit Score = (0.40 × Skill Match) + (0.35 × Semantic Cosine Sim) + (0.15 × Exp Score) + (0.10 × Edu Score)
            </div>
            <ul>
                <li><b>Skill Match Score (40%)</b>: Calculated as <code>(Count of Matched JD Skills / Total Required JD Skills) × 100</code>.</li>
                <li><b>Semantic Similarity Score (35%)</b>: Uses N-Gram TF-IDF Vectorization to measure vocabulary and contextual overlap between Job Description and Resume body text.</li>
                <li><b>Experience Score (15%)</b>: Compares extracted years of candidate work experience against the job description minimum required experience.</li>
                <li><b>Education Score (10%)</b>: Evaluates qualification levels (B.Tech / B.S., M.Tech / M.S., Ph.D.).</li>
            </ul>
        </div>
    """, unsafe_allow_html=True)

    col_m1, col_m2 = st.columns(2)

    with col_m1:
        st.markdown("""
            <div class="glass-card">
                <h3>2. TF-IDF & Cosine Distance</h3>
                <p>Term Frequency-Inverse Document Frequency converts unstructured resume text into a high-dimensional vector space:</p>
                <p><b>TF-IDF Calculation:</b></p>
                <code>TF(t, d) = f(t, d) / Total words in d</code><br/>
                <code>IDF(t) = log(N / df(t))</code><br/>
                <code>Cosine Sim(A, B) = (A · B) / (||A|| × ||B||)</code>
            </div>
        """, unsafe_allow_html=True)

    with col_m2:
        st.markdown("""
            <div class="glass-card">
                <h3>3. Skill Entity Extraction</h3>
                <p>The system utilizes a 250+ item technical taxonomy spanning:</p>
                <ul>
                    <li>AI & Machine Learning (PyTorch, TensorFlow, Scikit-Learn, NLP, LLMs)</li>
                    <li>Software & Web Dev (React, Node.js, Python, FastAPI, Django)</li>
                    <li>Data Analytics (SQL, Pandas, Tableau, Power BI)</li>
                    <li>Cloud & DevOps (AWS, Azure, Docker, Kubernetes, CI/CD)</li>
                </ul>
            </div>
        """, unsafe_allow_html=True)
