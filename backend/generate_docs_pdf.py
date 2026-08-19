import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable

def generate_technical_guide_pdf(filename="HirePulse_ATS_Technical_Architecture_Guide.pdf"):
    output_dir = os.path.join(os.path.dirname(__file__), "uploads", "pdfs")
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0F172A")    # Slate 900
    ACCENT_BLUE = colors.HexColor("#2563EB")# Blue 600
    ACCENT_INDIGO = colors.HexColor("#4F46E5") # Indigo 600
    ACCENT_AMBER = colors.HexColor("#D97706") # Amber 600
    TEXT_DARK = colors.HexColor("#1E293B")   # Slate 800
    BG_LIGHT = colors.HexColor("#F8FAFC")    # Slate 50

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        alignment=0,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=ACCENT_BLUE,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=8
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=ACCENT_INDIGO,
        spaceBefore=10,
        spaceAfter=5
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=6
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0284C7"),
        spaceAfter=3
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=TEXT_DARK
    )

    story = []

    # Title Banner
    story.append(Paragraph("HirePulse ATS Platform — Comprehensive Technical Guide", title_style))
    story.append(Paragraph("Folder-by-Folder Code Architecture & End-to-End Workflow Manual", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=ACCENT_BLUE, spaceBefore=0, spaceAfter=15))

    # Executive Overview
    story.append(Paragraph("1. Executive Overview & System Architecture", h1_style))
    overview_text = (
        "<b>HirePulse ATS</b> is an enterprise-grade, multi-tenant Applicant Tracking System & Recruitment SaaS platform. "
        "Built with <b>FastAPI (Python)</b> on the backend, <b>MySQL (SQLAlchemy ORM)</b> for relational database management, "
        "and <b>React (Vite + Tailwind CSS)</b> on the frontend, the platform provides seamless end-to-end recruitment automation. "
        "Key capabilities include multi-tenant organization data isolation, 4-tier Role-Based Access Control (RBAC), automated "
        "interviewer slot overlap validation, Google Calendar event synchronization, PDF offer letter generation, and Stripe checkout payments."
    )
    story.append(Paragraph(overview_text, body_style))
    story.append(Spacer(1, 10))

    # 4-Tier Roles Table
    story.append(Paragraph("Core Platform User Roles & Permissions Matrix", h2_style))
    role_data = [
        [Paragraph("Role Name", table_header_style), Paragraph("Key Responsibilities & Permissions", table_header_style), Paragraph("Accessible Views", table_header_style)],
        [Paragraph("Company Admin", table_cell_style), Paragraph("Full tenant ownership, manage subscription plans, customize plan prices in INR, monitor organization analytics.", table_cell_style), Paragraph("/admin, /subscription", table_cell_style)],
        [Paragraph("HR Manager", table_cell_style), Paragraph("Oversee recruitment metrics, review candidates, inspect interviewer schedules, generate PDF offer letters.", table_cell_style), Paragraph("/hr, /recruiter, /subscription", table_cell_style)],
        [Paragraph("Recruiter", table_cell_style), Paragraph("Post job openings, promote jobs (Stripe ₹1,499), schedule interviews with overlap checks, issue offer letters.", table_cell_style), Paragraph("/recruiter", table_cell_style)],
        [Paragraph("Candidate", table_cell_style), Paragraph("Browse job listings, submit job applications, sync interviews to Google Calendar, download & accept offer letters.", table_cell_style), Paragraph("/candidate, /job-board", table_cell_style)]
    ]

    t_roles = Table(role_data, colWidths=[110, 280, 140])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_roles)
    story.append(Spacer(1, 15))

    # Backend Folder Explanation
    story.append(Paragraph("2. Backend Folder & Codebase Breakdown (`backend/`)", h1_style))
    story.append(Paragraph("The backend is structured into modular layers following clean architecture principles:", body_style))

    backend_folders = [
        [Paragraph("Directory Path", table_header_style), Paragraph("Key Files", table_header_style), Paragraph("Technical Purpose & Functionality", table_header_style)],
        [
            Paragraph("backend/app/core/", code_style),
            Paragraph("config.py<br/>database.py<br/>security.py", table_cell_style),
            Paragraph("Core setup: Reads environment configuration (.env), initializes SQLAlchemy MySQL database engine & sessionmakers, provides bcrypt password hashing and JWT access token creation/verification.", table_cell_style)
        ],
        [
            Paragraph("backend/app/models/", code_style),
            Paragraph("models.py", table_cell_style),
            Paragraph("Database ORM Definitions: Defines User, Organization, Job, JobApplication, Interview, OfferLetter, and SubscriptionPlan relational schemas with foreign key constraints.", table_cell_style)
        ],
        [
            Paragraph("backend/app/schemas/", code_style),
            Paragraph("schemas.py", table_cell_style),
            Paragraph("Data Validation: Defines Pydantic models for request/response serialization (UserRegister, UserLogin, JobCreate, InterviewScheduleCreate, InterviewUpdate, OfferLetterCreate).", table_cell_style)
        ],
        [
            Paragraph("backend/app/services/", code_style),
            Paragraph("stripe_service.py<br/>gcal_service.py<br/>email_service.py<br/>pdf_service.py", table_cell_style),
            Paragraph("External Integrations:<br/>• stripe_service: Stripe Checkout for Pro subscriptions & ₹1,499 job promotions.<br/>• gcal_service: Google Calendar 1-click Add URLs & Meet links.<br/>• email_service: Invitation & alert emails.<br/>• pdf_service: ReportLab PDF generator for Offer Letters & Schedule reports.", table_cell_style)
        ],
        [
            Paragraph("backend/app/api/v1/", code_style),
            Paragraph("auth.py<br/>jobs.py<br/>applications.py<br/>interviews.py<br/>offer_letters.py<br/>subscriptions.py<br/>analytics.py", table_cell_style),
            Paragraph("API Controllers:<br/>• auth.py: Login, register, profile update, password reset.<br/>• jobs.py: Job posting CRUD, public search, Stripe promotion checkout.<br/>• interviews.py: Slot overlap prevention, Google Calendar sync, rescheduling.<br/>• offer_letters.py: PDF generation, candidate accept/decline.<br/>• subscriptions.py: Admin plan price updates & Stripe webhooks.", table_cell_style)
        ]
    ]

    t_backend = Table(backend_folders, colWidths=[120, 130, 280])
    t_backend.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_backend)
    story.append(Spacer(1, 15))

    # Page Break for Frontend
    story.append(PageBreak())

    # Frontend Folder Explanation
    story.append(Paragraph("3. Frontend Folder & Codebase Breakdown (`frontend/src/`)", h1_style))
    story.append(Paragraph("The frontend is built with React 18, Vite, and Tailwind CSS. Key directory components:", body_style))

    frontend_folders = [
        [Paragraph("Directory Path", table_header_style), Paragraph("Key Components / Pages", table_header_style), Paragraph("UI Functionality & Design Description", table_header_style)],
        [
            Paragraph("frontend/src/pages/", code_style),
            Paragraph("LandingPage.jsx<br/>LoginPage.jsx<br/>RegisterPage.jsx<br/>AdminDashboard.jsx<br/>HRDashboard.jsx<br/>RecruiterDashboard.jsx<br/>CandidateDashboard.jsx<br/>SubscriptionPage.jsx<br/>ResetPasswordPage.jsx", table_cell_style),
            Paragraph("Role-Based Views:<br/>• LandingPage: Public job board with Featured Premium job cards.<br/>• LoginPage / RegisterPage: Authentication with Forgot Password recovery.<br/>• AdminDashboard: Multi-tenant organization analytics & dynamic plan price editor.<br/>• RecruiterDashboard: Pipeline management, job posting, ₹1,499 promotion, interview scheduling.<br/>• CandidateDashboard: Applications tracker, Google Calendar sync, PDF offer letter response.", table_cell_style)
        ],
        [
            Paragraph("frontend/src/components/", code_style),
            Paragraph("Navbar.jsx<br/>InterviewCalendarModal.jsx<br/>NotificationsModal.jsx<br/>ProfileModal.jsx<br/>ProtectedRoute.jsx<br/>Modal.jsx<br/>StatusBadge.jsx", table_cell_style),
            Paragraph("Reusable Modular UI:<br/>• Navbar: Top navigation header with Notification Bell badge & enlarged company logo.<br/>• InterviewCalendarModal: Calendar view with Google Cal sync & Recruiter reschedule edit form.<br/>• NotificationsModal: Dedicated alerts tab for Google Calendar events.<br/>• ProtectedRoute: Enforces RBAC route protection.", table_cell_style)
        ],
        [
            Paragraph("frontend/src/services/<br/>& context/", code_style),
            Paragraph("api.js<br/>AuthContext.jsx", table_cell_style),
            Paragraph("State & Data Layer:<br/>• api.js: Axios HTTP client configured with JWT Authorization headers.<br/>• AuthContext.jsx: Global authentication state, login/logout context provider.", table_cell_style)
        ]
    ]

    t_frontend = Table(frontend_folders, colWidths=[120, 140, 270])
    t_frontend.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_frontend)
    story.append(Spacer(1, 15))

    # Key Workflows Section
    story.append(Paragraph("4. Complete End-to-End Workflow Execution", h1_style))
    workflows_text = (
        "<b>A. Candidate Job Application & Pipeline Movement:</b><br/>"
        "1. Candidate registers account or logs in at <font color='#2563EB'>/login</font>.<br/>"
        "2. Candidate searches public jobs on <font color='#2563EB'>/job-board</font> and submits application.<br/>"
        "3. Application is created in database with initial status <b>Applied</b>.<br/>"
        "4. Recruiter reviews application pipeline on <font color='#2563EB'>/recruiter</font> and advances status to <b>Shortlisted</b>.<br/><br/>"
        "<b>B. Interview Scheduling, Overlap Validation & Google Calendar Sync:</b><br/>"
        "1. Recruiter selects date/time (e.g. 11:00 AM) and submits interview request.<br/>"
        "2. Backend checks if interviewer has another interview within ±29 minutes window. If conflict exists, 400 error is thrown.<br/>"
        "3. If valid, backend generates unique Google Meet link and direct 1-click Google Calendar Add URL (<font color='#D97706'>gcal_url</font>).<br/>"
        "4. Automated email invitation with Google Calendar sync button is dispatched to candidate.<br/>"
        "5. Recruiter can edit / reschedule interview date/time anytime. Rescheduling updates Google Calendar links and notifies candidate.<br/><br/>"
        "<b>C. Offer Letter Generation & Acceptance:</b><br/>"
        "1. Recruiter/HR specifies annual compensation and joining date.<br/>"
        "2. ReportLab PDF engine compiles an official Employment Offer Letter PDF stored in <font color='#0284C7'>backend/uploads/pdfs/</font>.<br/>"
        "3. Candidate views offer card on <font color='#2563EB'>/candidate</font>, downloads PDF, and clicks <b>Accept Offer</b>.<br/><br/>"
        "<b>D. Stripe Payment Integrations:</b><br/>"
        "1. <b>Company Pro Subscription</b>: Monthly recurring subscription (admin customizable price, e.g. ₹7,999/mo).<br/>"
        "2. <b>Premium Job Promotion</b>: One-time ₹1,499 Stripe Checkout payment promoting job listing to Featured Premium status."
    )
    story.append(Paragraph(workflows_text, body_style))
    story.append(Spacer(1, 15))

    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT_BLUE, spaceBefore=10, spaceAfter=10))
    story.append(Paragraph("Documentation Generated for HirePulse ATS Platform Review • Technical Reference Guide", ParagraphStyle('Footer', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8, textColor=colors.HexColor("#64748B"), alignment=1)))

    doc.build(story)
    return filepath

if __name__ == "__main__":
    path = generate_technical_guide_pdf()
    print(f"Technical architecture guide PDF generated successfully at: {path}")
