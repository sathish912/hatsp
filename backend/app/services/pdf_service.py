import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "pdfs")
RESUME_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "resumes")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESUME_DIR, exist_ok=True)

def generate_candidate_resume_pdf(candidate_name: str, email: str, phone: str, experience: str, skills: str, filename: str) -> str:
    filepath = os.path.join(RESUME_DIR, filename)
    doc = SimpleDocTemplate(filepath, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()

    name_style = ParagraphStyle('NameTitle', parent=styles['Heading1'], fontSize=22, leading=26, textColor=colors.HexColor('#0F172A'), spaceAfter=4)
    sub_style = ParagraphStyle('ContactSub', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#475569'), spaceAfter=15)
    section_style = ParagraphStyle('SectionHeader', parent=styles['Heading2'], fontSize=14, leading=18, textColor=colors.HexColor('#2563EB'), spaceAfter=8)
    body_style = ParagraphStyle('BodyText', parent=styles['Normal'], fontSize=10, leading=15, textColor=colors.HexColor('#334155'), spaceAfter=10)

    story = [
        Paragraph(f"<b>{candidate_name.upper()}</b>", name_style),
        Paragraph(f"Email: {email} | Phone: {phone or '+91 98765 43210'} | Location: India", sub_style),
        HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=15),
        
        Paragraph("<b>PROFESSIONAL SUMMARY</b>", section_style),
        Paragraph(f"Driven and results-orientated engineering candidate with <b>{experience or '3+ years experience'}</b>. Specializing in high-performance SaaS applications, cloud infrastructure, and modern technology frameworks.", body_style),
        Spacer(1, 10),

        Paragraph("<b>KEY SKILLS & TECHNICAL EXPERTISE</b>", section_style),
        Paragraph(f"• {(skills or 'Software Development, System Architecture, SQL').replace(',', '<br/>• ')}", body_style),
        Spacer(1, 10),

        Paragraph("<b>PROFESSIONAL EXPERIENCE & PROJECT HIGHLIGHTS</b>", section_style),
        Paragraph("<b>Senior Software Engineer / Tech Specialist</b> (2022 - Present)<br/>• Developed core high-throughput APIs serving 50k+ daily active users.<br/>• Optimized database query execution speed and state management architecture by 35%.", body_style),
        Spacer(1, 10),

        Paragraph("<b>EDUCATION & CERTIFICATIONS</b>", section_style),
        Paragraph("<b>Bachelor of Technology (B.Tech) in Computer Science & Engineering</b><br/>Indian Institute of Technology (IIT) • First Class with Distinction", body_style),
    ]

    doc.build(story)
    return filepath

def generate_offer_letter_pdf(candidate_name: str, job_title: str, company_name: str, salary: str, joining_date: str, filename: str) -> str:
    filepath = os.path.join(UPLOAD_DIR, filename)
    doc = SimpleDocTemplate(filepath, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#2563EB'),
        spaceAfter=20
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=11,
        leading=16,
        textColor=colors.HexColor('#334155'),
        spaceAfter=12
    )

    story = []
    story.append(Paragraph(f"<b>OFFER OF EMPLOYMENT</b>", title_style))
    story.append(Paragraph(f"Company: {company_name}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2563EB'), spaceAfter=20))
    
    story.append(Paragraph(f"Dear <b>{candidate_name}</b>,", body_style))
    story.append(Paragraph(
        f"We are delighted to extend an offer of employment to you for the position of <b>{job_title}</b> at <b>{company_name}</b>. "
        f"We were greatly impressed by your skills, experience, and performance during the recruitment process.", body_style
    ))
    
    table_data = [
        ["Position Title:", job_title],
        ["Annual Compensation:", salary],
        ["Proposed Joining Date:", joining_date],
        ["Employment Type:", "Full-time"],
        ["Location:", "As agreed during discussions"]
    ]
    
    t = Table(table_data, colWidths=[160, 320])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F1F5F9')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#1E293B')),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("Please confirm your acceptance of this offer by replying to this letter or accepting through your Candidate Portal.", body_style))
    story.append(Spacer(1, 30))
    story.append(Paragraph("Sincerely,", body_style))
    story.append(Paragraph(f"<b>HR Management Team</b><br/>{company_name}", body_style))
    
    doc.build(story)
    return filepath

def generate_interview_schedule_pdf(candidate_name: str, job_title: str, interviewer_name: str, interview_date: str, meeting_link: str, filename: str) -> str:
    filepath = os.path.join(UPLOAD_DIR, filename)
    doc = SimpleDocTemplate(filepath, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontSize=20, textColor=colors.HexColor('#1E293B'), spaceAfter=15)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=11, leading=16, textColor=colors.HexColor('#334155'), spaceAfter=10)

    story = [
        Paragraph("<b>INTERVIEW SCHEDULE & DETAILS</b>", title_style),
        HRFlowable(width="100%", thickness=2, color=colors.HexColor('#059669'), spaceAfter=20),
        Paragraph(f"Candidate: <b>{candidate_name}</b>", body_style),
        Paragraph(f"Target Role: <b>{job_title}</b>", body_style),
        Spacer(1, 10)
    ]

    table_data = [
        ["Interviewer", interviewer_name],
        ["Scheduled Date & Time", interview_date],
        ["Meeting Link", meeting_link],
        ["Status", "Scheduled"]
    ]
    t = Table(table_data, colWidths=[160, 320])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#ECFDF5')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#065F46')),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#A7F3D0')),
    ]))
    story.append(t)
    doc.build(story)
    return filepath

def generate_candidate_report_pdf(candidate_name: str, email: str, phone: str, experience: str, skills: str, application_status: str, filename: str) -> str:
    filepath = os.path.join(UPLOAD_DIR, filename)
    doc = SimpleDocTemplate(filepath, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontSize=20, textColor=colors.HexColor('#1E293B'), spaceAfter=15)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=11, leading=16, textColor=colors.HexColor('#334155'), spaceAfter=10)

    story = [
        Paragraph("<b>CANDIDATE RECRUITMENT REPORT</b>", title_style),
        HRFlowable(width="100%", thickness=2, color=colors.HexColor('#4338CA'), spaceAfter=20),
        Paragraph(f"Candidate Name: <b>{candidate_name}</b>", body_style),
        Paragraph(f"Email: <b>{email}</b>", body_style),
        Paragraph(f"Phone: <b>{phone or 'N/A'}</b>", body_style),
        Paragraph(f"Experience Level: <b>{experience or 'Not specified'}</b>", body_style),
        Paragraph(f"Current Application Status: <b>{application_status}</b>", body_style),
        Spacer(1, 15),
        Paragraph("<b>Key Skills & Qualifications:</b>", body_style),
        Paragraph(skills or "No skills recorded.", body_style)
    ]
    doc.build(story)
    return filepath
