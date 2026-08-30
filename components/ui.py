import streamlit as st
import plotly.graph_objects as go
import plotly.express as px

def render_hero_banner():
    """Render premium TailAdmin-style hero banner"""
    st.markdown("""
        <div class="hero-banner">
            <div>
                <span class="badge-pill badge-primary">🎯 ENTERPRISE TALENT INTELLIGENCE</span>
                <span class="badge-pill badge-success">⚡ PRECISION MATCHING</span>
                <span class="badge-pill badge-warning">📊 REAL-TIME RANKING</span>
            </div>
            <div class="hero-title">AI Resume Screening & Decision Support System</div>
            <div class="hero-subtitle">
                Automated NLP & Machine Learning platform to extract candidate qualifications, 
                parse skills and experience, perform semantic TF-IDF matching, and rank applicants for any job description.
            </div>
        </div>
    """, unsafe_allow_html=True)

def render_metric_cards(total, top_matches, avg_score, best_candidate, best_score):
    """Render premium metric cards with gradient styling"""
    c1, c2, c3, c4 = st.columns(4)
    
    with c1:
        st.markdown(f"""
            <div class="metric-box-inner metric-card-1">
                <div class="metric-val">{total}</div>
                <div class="metric-lbl">Total Applicants</div>
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
                <div class="metric-lbl">Top Candidate</div>
            </div>
        """, unsafe_allow_html=True)

def plot_candidate_radar(candidate_res):
    """Create beautiful radar chart for candidate scoring"""
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
        fillcolor='rgba(102, 126, 234, 0.3)',
        line=dict(color='#667EEA', width=3),
        name=candidate_res['candidate_name'],
        hovertemplate='<b>%{theta}</b><br>Score: %{r:.1f}%<extra></extra>'
    ))

    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True, 
                range=[0, 100], 
                color='#9CA3AF',
                gridcolor='#E5E7EB',
                tickfont=dict(size=10, color='#6B7280')
            ),
            angularaxis=dict(
                color='#111827', 
                gridcolor='#E5E7EB',
                tickfont=dict(size=11, color='#374151', family='Sora')
            ),
            bgcolor='rgba(243, 244, 246, 0.5)'
        ),
        paper_bgcolor='rgba(0, 0, 0, 0)',
        plot_bgcolor='rgba(0, 0, 0, 0)',
        margin=dict(l=40, r=40, t=30, b=40),
        showlegend=False,
        height=340,
        font=dict(family='Sora', color='#111827')
    )
    return fig

def plot_comparison_radar(res1, res2):
    """Create side-by-side radar comparison chart"""
    categories = ['Skill Match', 'Semantic Similarity', 'Experience Match', 'Education Match']
    val1 = [res1['skill_score'], res1['semantic_score'], res1['experience_score'], res1['education_score']]
    val2 = [res2['skill_score'], res2['semantic_score'], res2['experience_score'], res2['education_score']]

    fig = go.Figure()

    fig.add_trace(go.Scatterpolar(
        r=val1 + [val1[0]],
        theta=categories + [categories[0]],
        fill='toself',
        fillcolor='rgba(102, 126, 234, 0.35)',
        line=dict(color='#667EEA', width=3),
        name=res1['candidate_name'],
        hovertemplate='<b>%{theta}</b><br>Score: %{r:.1f}%<extra></extra>'
    ))

    fig.add_trace(go.Scatterpolar(
        r=val2 + [val2[0]],
        theta=categories + [categories[0]],
        fill='toself',
        fillcolor='rgba(244, 63, 94, 0.35)',
        line=dict(color='#F43F5E', width=3),
        name=res2['candidate_name'],
        hovertemplate='<b>%{theta}</b><br>Score: %{r:.1f}%<extra></extra>'
    ))

    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True, 
                range=[0, 100], 
                color='#9CA3AF',
                gridcolor='#E5E7EB',
                tickfont=dict(size=10, color='#6B7280')
            ),
            angularaxis=dict(
                color='#111827', 
                gridcolor='#E5E7EB',
                tickfont=dict(size=11, color='#374151', family='Sora')
            ),
            bgcolor='rgba(243, 244, 246, 0.5)'
        ),
        paper_bgcolor='rgba(0, 0, 0, 0)',
        plot_bgcolor='rgba(0, 0, 0, 0)',
        legend=dict(
            font=dict(color="#111827", size=12, family='Sora'), 
            orientation="v", 
            x=1.15,
            y=1
        ),
        margin=dict(l=40, r=120, t=30, b=50),
        height=380,
        font=dict(family='Sora', color='#111827')
    )
    return fig

def render_skill_tags(skills, matched=True):
    """Render skill tags with premium styling"""
    tag_class = "skill-matched" if matched else "skill-missing"
    html = ""
    for skill in skills:
        html += f'<span class="skill-tag {tag_class}">✓ {skill}</span>'
    return html if html else '<span style="color: #9CA3AF; font-size: 0.85rem;">None</span>'

def render_status_badge(status):
    """Render status badge with color coding"""
    status_clean = status.replace("🟢", "").replace("🟡", "").replace("🔴", "").strip()
    
    if "Top Match" in status_clean:
        color = "#10B981"
        bg = "rgba(16, 185, 129, 0.1)"
        border = "rgba(16, 185, 129, 0.3)"
        icon = "🟢"
    elif "Potential" in status_clean:
        color = "#F59E0B"
        bg = "rgba(245, 158, 11, 0.1)"
        border = "rgba(245, 158, 11, 0.3)"
        icon = "🟡"
    else:
        color = "#EF4444"
        bg = "rgba(239, 68, 68, 0.1)"
        border = "rgba(239, 68, 68, 0.3)"
        icon = "🔴"
    
    return f'<span style="background: {bg}; color: {color}; border: 1px solid {border}; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 4px;">{icon} {status_clean}</span>'

def create_score_bar(score):
    """Create colored score progress bar"""
    if score >= 75:
        color = "#10B981"  # Green
    elif score >= 50:
        color = "#F59E0B"  # Orange
    else:
        color = "#EF4444"  # Red
    
    return f"""
    <div style="width: 100%; height: 8px; background: #E5E7EB; border-radius: 4px; overflow: hidden;">
        <div style="width: {score}%; height: 100%; background: linear-gradient(90deg, {color} 0%, {color}99 100%); border-radius: 4px;"></div>
    </div>
    """
