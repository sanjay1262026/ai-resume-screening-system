import streamlit as st
import plotly.graph_objects as go
import plotly.express as px

def render_hero_banner():
    st.markdown("""
        <div class="hero-banner">
            <div>
                <span class="badge-pill badge-primary">ENTERPRISE TALENT INTELLIGENCE</span>
                <span class="badge-pill badge-success">PRECISION MATCHING</span>
                <span class="badge-pill badge-warning">REAL-TIME RANKING</span>
            </div>
            <div class="hero-title">AI Resume Screening & Decision Support System</div>
            <div class="hero-subtitle">
                Automated NLP & Machine Learning platform to extract candidate qualifications, 
                parse skills and experience, perform semantic TF-IDF matching, and rank applicants for any job description.
            </div>
        </div>
    """, unsafe_allow_html=True)

def render_metric_cards(total, top_matches, avg_score, best_candidate, best_score):
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.markdown(f"""
            <div class="metric-box-inner metric-card-1">
                <div class="metric-val">{total}</div>
                <div class="metric-lbl">Total Resumes</div>
            </div>
        """, unsafe_allow_html=True)
    with c2:
        st.markdown(f"""
            <div class="metric-box-inner metric-card-2">
                <div class="metric-val">{top_matches}</div>
                <div class="metric-lbl">Top Matches (≥75%)</div>
            </div>
        """, unsafe_allow_html=True)
    with c3:
        st.markdown(f"""
            <div class="metric-box-inner metric-card-3">
                <div class="metric-val">{avg_score:.1f}%</div>
                <div class="metric-lbl">Average Fit Score</div>
            </div>
        """, unsafe_allow_html=True)
    with c4:
        st.markdown(f"""
            <div class="metric-box-inner metric-card-4">
                <div class="metric-val">{best_score:.1f}%</div>
                <div class="metric-lbl">Top Fit ({best_candidate[:12]})</div>
            </div>
        """, unsafe_allow_html=True)

def plot_candidate_radar(candidate_res):
    """Generates a clean Radar Chart for candidate breakdown scores."""
    categories = ['Skill Match', 'Semantic Similarity', 'Experience Match', 'Education Match']
    values = [
        candidate_res['skill_score'],
        candidate_res['semantic_score'],
        candidate_res['experience_score'],
        candidate_res['education_score']
    ]

    fig = go.Figure()
    fig.add_trace(go.Scatterpolar(
        r=values + [values[0]],
        theta=categories + [categories[0]],
        fill='toself',
        fillcolor='rgba(37, 99, 235, 0.25)',
        line=dict(color='#2563EB', width=2.5),
        name=candidate_res['candidate_name']
    ))

    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                range=[0, 100],
                color='#475569',
                gridcolor='#E2E8F0'
            ),
            angularaxis=dict(
                color='#0F172A',
                gridcolor='#E2E8F0'
            ),
            bgcolor='#FFFFFF'
        ),
        paper_bgcolor='rgba(0, 0, 0, 0)',
        plot_bgcolor='rgba(0, 0, 0, 0)',
        margin=dict(l=40, r=40, t=20, b=40),
        showlegend=False,
        height=320
    )
    return fig

def plot_comparison_radar(res1, res2):
    """Generates a dual-candidate comparison radar chart."""
    categories = ['Skill Match', 'Semantic Similarity', 'Experience Match', 'Education Match']
    val1 = [res1['skill_score'], res1['semantic_score'], res1['experience_score'], res1['education_score']]
    val2 = [res2['skill_score'], res2['semantic_score'], res2['experience_score'], res2['education_score']]

    fig = go.Figure()

    fig.add_trace(go.Scatterpolar(
        r=val1 + [val1[0]],
        theta=categories + [categories[0]],
        fill='toself',
        fillcolor='rgba(16, 185, 129, 0.25)',
        line=dict(color='#10B981', width=2.5),
        name=res1['candidate_name']
    ))

    fig.add_trace(go.Scatterpolar(
        r=val2 + [val2[0]],
        theta=categories + [categories[0]],
        fill='toself',
        fillcolor='rgba(239, 68, 68, 0.25)',
        line=dict(color='#EF4444', width=2.5),
        name=res2['candidate_name']
    ))

    fig.update_layout(
        polar=dict(
            radialaxis=dict(visible=True, range=[0, 100], color='#475569', gridcolor='#E2E8F0'),
            angularaxis=dict(color='#0F172A', gridcolor='#E2E8F0'),
            bgcolor='#FFFFFF'
        ),
        paper_bgcolor='rgba(0, 0, 0, 0)',
        plot_bgcolor='rgba(0, 0, 0, 0)',
        legend=dict(font=dict(color="#0F172A", size=12), orientation="h", y=-0.1),
        margin=dict(l=40, r=40, t=20, b=50),
        height=350
    )
    return fig

def render_skill_tags(skills, matched=True):
    tag_class = "skill-matched" if matched else "skill-missing"
    html = ""
    for skill in skills:
        html += f'<span class="skill-tag {tag_class}">{skill}</span>'
    return html if html else '<span style="color: #64748B; font-size: 0.85rem;">None</span>'
