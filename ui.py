import streamlit as st
import plotly.graph_objects as go
import plotly.express as px

def render_hero_banner():
    st.markdown("""
        <div class="hero-banner">
            <div>
                <span class="badge-pill badge-primary">🚀 AI-POWERED HR TECH</span>
                <span class="badge-pill badge-success">✨ PRECISION MATCHING</span>
                <span class="badge-pill badge-warning">⚡ INSTANT RANKING</span>
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
            <div class="metric-box">
                <div class="metric-val">{total}</div>
                <div class="metric-lbl">Total Resumes</div>
            </div>
        """, unsafe_allow_html=True)
    with c2:
        st.markdown(f"""
            <div class="metric-box">
                <div class="metric-val" style="color: #34D399;">{top_matches}</div>
                <div class="metric-lbl">Top Matches (≥75%)</div>
            </div>
        """, unsafe_allow_html=True)
    with c3:
        st.markdown(f"""
            <div class="metric-box">
                <div class="metric-val" style="color: #818CF8;">{avg_score:.1f}%</div>
                <div class="metric-lbl">Average Fit Score</div>
            </div>
        """, unsafe_allow_html=True)
    with c4:
        st.markdown(f"""
            <div class="metric-box">
                <div class="metric-val" style="color: #FBBF24;">{best_score:.1f}%</div>
                <div class="metric-lbl">Top Fit ({best_candidate[:12]})</div>
            </div>
        """, unsafe_allow_html=True)

def plot_candidate_radar(candidate_res):
    """Generates a Radar Chart for candidate breakdown scores."""
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
        fillcolor='rgba(99, 102, 241, 0.3)',
        line=dict(color='#818CF8', width=2),
        name=candidate_res['candidate_name']
    ))

    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                range=[0, 100],
                color='#94A3B8',
                gridcolor='rgba(255, 255, 255, 0.1)'
            ),
            angularaxis=dict(
                color='#F1F5F9',
                gridcolor='rgba(255, 255, 255, 0.1)'
            ),
            bgcolor='rgba(15, 23, 42, 0.6)'
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
        fillcolor='rgba(52, 211, 153, 0.25)',
        line=dict(color='#34D399', width=2),
        name=res1['candidate_name']
    ))

    fig.add_trace(go.Scatterpolar(
        r=val2 + [val2[0]],
        theta=categories + [categories[0]],
        fill='toself',
        fillcolor='rgba(244, 63, 94, 0.25)',
        line=dict(color='#F43F5E', width=2),
        name=res2['candidate_name']
    ))

    fig.update_layout(
        polar=dict(
            radialaxis=dict(visible=True, range=[0, 100], color='#94A3B8', gridcolor='rgba(255, 255, 255, 0.1)'),
            angularaxis=dict(color='#F1F5F9', gridcolor='rgba(255, 255, 255, 0.1)'),
            bgcolor='rgba(15, 23, 42, 0.6)'
        ),
        paper_bgcolor='rgba(0, 0, 0, 0)',
        plot_bgcolor='rgba(0, 0, 0, 0)',
        legend=dict(font=dict(color="#F1F5F9"), orientation="h", y=-0.1),
        margin=dict(l=40, r=40, t=20, b=50),
        height=350
    )
    return fig

def render_skill_tags(skills, matched=True):
    tag_class = "skill-matched" if matched else "skill-missing"
    html = ""
    for skill in skills:
        html += f'<span class="skill-tag {tag_class}">{skill}</span>'
    return html if html else '<span style="color: #94A3B8; font-size: 0.85rem;">None</span>'
