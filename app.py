import os
import glob
import io
import pandas as pd
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

# Smart imports (Works whether files are in root or subfolders!)
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
    def create_zip_archive():
        pass

# 1. Page Configuration & Theme
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

# 2. Session State Initialization
if "eval_results" not in st.session_state:
    st.session_state.eval_results = []
if "jd_text" not in st.session_state:
    st.session_state.jd_text = ""
if "jd_title" not in st.session_state:
    st.session_state.jd_title = "Senior AI / Machine Learning Engineer"

# Pre-loaded sample loader helper
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
            cand_data = parse_resume_file(filepath)
            eval_res = evaluate_candidate(cand_data, st.session_state.jd_text)
            results.append(eval_res)

    results.sort(key=lambda x: x["overall_score"], reverse=True)
    st.session_state.eval_results = results

# Default load if state empty
if not st.session_state.eval_results:
    load_sample_data()

# 3. Sidebar Controls & Customization
with st.sidebar:
    st.image("https://img.icons8.com/color/96/000000/brain--v1.png", width=64)
    st.title("Control Panel")
    st.markdown("---")

    st.subheader("⚡ Quick Demo Loader")
    if st.button("🔥 Load Pre-built Showcase Data", use_container_width=True):
        load_sample_data()
        st.success("Loaded pre-built resumes & JD!")
        st.rerun()

    st.markdown("---")
    st.subheader("⚖️ Scoring Weight Matrix")
    st.caption("Adjust algorithm priorities dynamically:")

    w_skill = st.slider("Skill Match Weight", 0.0, 1.0, 0.40, 0.05)
    w_semantic = st.slider("Semantic Similarity Weight", 0.0, 1.0, 0.35, 0.05)
    w_exp = st.slider("Experience Weight", 0.0, 1.0, 0.15, 0.05)
    w_edu = st.slider("Education Weight", 0.0, 1.0, 0.10, 0.05)

    # Normalize weights
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
    st.subheader("🔍 Leaderboard Filters")
    min_score_filter = st.slider("Min Overall Fit (%)", 0, 100, 0, 5)
    status_filter = st.multiselect(
        "Filter by Match Status",
        ["Top Match 🟢", "Potential Fit 🟡", "Low Match 🔴"],
        default=["Top Match 🟢", "Potential Fit 🟡", "Low Match 🔴"]
    )

# 4. Main App Layout & Header
render_hero_banner()

# Navigation Tabs
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "🎯 Ingestion & Setup",
    "📊 Screening Leaderboard",
    "🔍 Candidate Comparison & AI Feedback",
    "📈 Skill Gap Analytics",
    "📑 Export & Reports",
    "🧠 AI Engine & Math"
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
            st.markdown("#### 🔑 Extracted Job Criteria:")
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

        use_sample_resumes = st.checkbox("Include Pre-loaded Industry Sample Resumes", value=True)

        st.markdown("---")
        run_screening = st.button("🚀 Run AI Screening & Candidate Ranking Engine", use_container_width=True, type="primary")

        if run_screening:
            if not st.session_state.jd_text.strip():
                st.error("Please provide or select a Job Description first!")
            else:
                candidates_list = []
                if uploaded_files:
                    for uf in uploaded_files:
                        cand_data = parse_resume_file(uf)
                        candidates_list.append(cand_data)

                if use_sample_resumes or not uploaded_files:
                    sample_paths = glob.glob("sample_data/resumes/*") + glob.glob("resumes/*")
                    for sp in set(sample_paths):
                        if os.path.isfile(sp):
                            cand_data = parse_resume_file(sp)
                            candidates_list.append(cand_data)

                eval_results = []
                for cand in candidates_list:
                    res = evaluate_candidate(cand, st.session_state.jd_text, weights=weights)
                    eval_results.append(res)

                eval_results.sort(key=lambda x: x["overall_score"], reverse=True)
                st.session_state.eval_results = eval_results
                st.success(f"Successfully evaluated {len(eval_results)} candidate resumes!")
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

filtered_results = [
    r for r in st.session_state.eval_results
    if r["overall_score"] >= min_score_filter and r["status"] in status_filter
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

        st.subheader("🏆 Candidate Screening Leaderboard")
        search_query = st.text_input("🔍 Search Candidates by Name, Email, or Skill:", placeholder="Type 'Python', 'Alex', or 'PyTorch'...")

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
                "Overall Fit": f"{res['overall_score']}%",
                "Skill Score": f"{res['skill_score']}%",
                "Semantic Sim": f"{res['semantic_score']}%",
                "Experience": f"{res['candidate_exp_years']} Yrs",
                "Education": res["candidate_edu"],
                "Status": res["status"],
                "Matched Skills Count": len(res["matched_skills"])
            })

        df_table = pd.DataFrame(table_rows)
        st.dataframe(
            df_table,
            use_container_width=True,
            column_config={
                "Overall Fit": st.column_config.ProgressColumn("Overall Fit", format="%s", min_value=0, max_value=100),
                "Skill Score": st.column_config.ProgressColumn("Skill Score", format="%s", min_value=0, max_value=100),
            },
            hide_index=True
        )

        st.markdown("---")
        st.subheader("📋 Candidate Profiles & Skill Matrices")

        for rank, res in enumerate(display_list, 1):
            with st.expander(f"#{rank} | {res['candidate_name']} ({res['status']}) — Overall Fit: {res['overall_score']}%"):
                col_info, col_chart = st.columns([1.2, 1])

                with col_info:
                    st.markdown(f"### {res['candidate_name']}")
                    st.markdown(f"📧 **Email:** `{res['email']}` | 📞 **Phone:** `{res['phone']}`")
                    st.markdown(f"💼 **Experience:** `{res['candidate_exp_years']} Years` | 🎓 **Education:** `{res['candidate_edu']}`")
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
        st.subheader("⚔️ Side-by-Side Candidate Head-to-Head Comparison")
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
            comp_data = {
                "Metric": ["Overall Fit Score", "Skill Match Score", "Semantic Similarity", "Experience Score", "Education Score", "Experience (Years)"],
                f"Candidate A ({res1['candidate_name']})": [f"{res1['overall_score']}%", f"{res1['skill_score']}%", f"{res1['semantic_score']}%", f"{res1['experience_score']}%", f"{res1['education_score']}%", f"{res1['candidate_exp_years']} Yrs"],
                f"Candidate B ({res2['candidate_name']})": [f"{res2['overall_score']}%", f"{res2['skill_score']}%", f"{res2['semantic_score']}%", f"{res2['experience_score']}%", f"{res2['education_score']}%", f"{res2['candidate_exp_years']} Yrs"]
            }
            st.dataframe(pd.DataFrame(comp_data), hide_index=True, use_container_width=True)

        st.markdown("---")
        st.subheader("🤖 Automated AI Feedback & Technical Interview Generator")
        col_fb1, col_fb2 = st.columns(2)

        for col, res in zip([col_fb1, col_fb2], [res1, res2]):
            with col:
                st.markdown(f'<div class="glass-card">', unsafe_allow_html=True)
                fb = generate_candidate_feedback(res)
                st.markdown(f"### {res['candidate_name']} ({res['status']})")
                st.markdown(f"**AI Assessment:** {fb['summary']}")

                st.markdown("#### ✅ Key Strengths")
                for s in fb["strengths"]:
                    st.markdown(f"- {s}")

                st.markdown("#### ⚠️ Skill & Qualification Gaps")
                for w in fb["weaknesses"]:
                    st.markdown(f"- {w}")

                st.markdown("#### 🎯 Tailored Interview Questions")
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
        st.subheader("📊 Candidate Pool Skill Analytics")
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
            st.plotly_chart(fig_freq, use_container_width=True)

# ==========================================
# TAB 5: Export & Reports
# ==========================================
with tab5:
    st.subheader("📑 Export Candidate Screening Reports")
    st.write("Generate official candidate screening reports for HR records or hiring committee reviews.")
    col_exp1, col_exp2 = st.columns(2)

    with col_exp1:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.markdown("### 📊 Export CSV Data")
        st.write("Download structured CSV file with candidate scores, contact info, and matched/missing skills.")
        csv_bytes = generate_csv_report(st.session_state.eval_results)
        st.download_button(
            label="📥 Download CSV Report",
            data=csv_bytes,
            file_name="candidate_screening_leaderboard.csv",
            mime="text/csv",
            use_container_width=True
        )
        st.markdown('</div>', unsafe_allow_html=True)

    with col_exp2:
        st.markdown('<div class="glass-card">', unsafe_allow_html=True)
        st.markdown("### 📄 Export PDF Report")
        st.write("Generate a formatted executive summary PDF report with candidate rankings and detailed breakdowns.")
        pdf_bytes = generate_pdf_report(st.session_state.eval_results, st.session_state.jd_title)
        st.download_button(
            label="📥 Download PDF Summary Report",
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
    st.subheader("🧠 System Architecture & Algorithm Mechanics")

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
