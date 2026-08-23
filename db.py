import sqlite3
import hashlib
import json
import os
from datetime import datetime

DB_PATH = "database.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes SQLite database tables and seeds default admin account."""
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

def register_user(username, password, full_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        p_hash = hash_password(password)
        cursor.execute(
            "INSERT INTO users (username, password_hash, full_name) VALUES (?, ?, ?)",
            (username.lower().strip(), p_hash, full_name.strip())
        )
        conn.commit()
        return True, "User registered successfully! Please log in."
    except sqlite3.IntegrityError:
        return False, "Username already exists. Please choose a different username."
    finally:
        conn.close()

def authenticate_user(username, password):
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

def save_screening_session(user_id, jd_title, jd_text, eval_results):
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
            cand["overall_score"],
            cand["skill_score"],
            cand["semantic_score"],
            cand["experience_score"],
            cand["education_score"],
            cand["candidate_exp_years"],
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

def get_user_screenings(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM screenings WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    )
    screenings = cursor.fetchall()
    conn.close()
    return [dict(s) for s in screenings]

def load_screening_details(screening_id):
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
