import io
import pandas as pd
from fpdf import FPDF

def generate_csv_report(results):
    """
    Converts screening evaluation results into CSV bytes.
    """
    data = []
    for rank, res in enumerate(results, 1):
        data.append({
            "Rank": rank,
            "Candidate Name": res["candidate_name"],
            "Overall Score (%)": res["overall_score"],
            "Status": res["status"],
            "Skill Match Score (%)": res["skill_score"],
            "Semantic Similarity (%)": res["semantic_score"],
            "Experience (Years)": res["candidate_exp_years"],
            "Education": res["candidate_edu"],
            "Email": res["email"],
            "Phone": res["phone"],
            "Matched Skills": ", ".join(res["matched_skills"]),
            "Missing Skills": ", ".join(res["missing_skills"])
        })
    
    df = pd.DataFrame(data)
    csv_bytes = df.to_csv(index=False).encode('utf-8')
    return csv_bytes

def generate_pdf_report(results, job_title="Target Position"):
    """
    Generates a PDF summary report using FPDF2.
    """
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    epw = pdf.epw # effective page width

    # Header
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(epw, 10, "AI Resume Screening & Ranking Report", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "I", 12)
    pdf.cell(epw, 8, f"Target Position: {job_title} | Evaluated Candidates: {len(results)}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    # Executive Summary Table Header
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(epw, 8, "CANDIDATE LEADERBOARD SUMMARY", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 10)

    # Table columns
    col_widths = [12, 50, 28, 30, 25, 45]
    headers = ["#", "Name", "Fit Score", "Skill Score", "Exp", "Status"]
    
    for i, h in enumerate(headers):
        pdf.cell(col_widths[i], 8, h, border=1)
    pdf.ln()

    pdf.set_font("Helvetica", "", 10)
    for rank, res in enumerate(results[:10], 1):
        pdf.cell(col_widths[0], 7, str(rank), border=1)
        pdf.cell(col_widths[1], 7, str(res["candidate_name"])[:20], border=1)
        pdf.cell(col_widths[2], 7, f"{res['overall_score']}%", border=1)
        pdf.cell(col_widths[3], 7, f"{res['skill_score']}%", border=1)
        pdf.cell(col_widths[4], 7, f"{res['candidate_exp_years']} Yrs", border=1)
        status_clean = str(res["status"]).split()[0]
        pdf.cell(col_widths[5], 7, status_clean, border=1)
        pdf.ln()

    pdf.ln(8)

    # Detailed Candidate Breakdowns
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(epw, 8, "TOP CANDIDATE EVALUATION DETAILS", new_x="LMARGIN", new_y="NEXT")
    
    for rank, res in enumerate(results[:5], 1):
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(epw, 7, f"Rank {rank}: {res['candidate_name']} ({res['overall_score']}% Match)", new_x="LMARGIN", new_y="NEXT")
        
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(epw, 5, f"Email: {res['email']} | Phone: {res['phone']} | Education: {res['candidate_edu']}", new_x="LMARGIN", new_y="NEXT")
        pdf.cell(epw, 5, f"Skill Match: {res['skill_score']}% | Semantic Similarity: {res['semantic_score']}% | Experience Score: {res['experience_score']}%", new_x="LMARGIN", new_y="NEXT")
        
        matched_str = ", ".join(res["matched_skills"]) if res["matched_skills"] else "None"
        missing_str = ", ".join(res["missing_skills"]) if res["missing_skills"] else "None"
        
        pdf.multi_cell(epw, 5, f"Matched Skills: {matched_str}")
        pdf.multi_cell(epw, 5, f"Missing Skills: {missing_str}")
        pdf.ln(3)

    return bytes(pdf.output())
