# HirePulse — Enterprise HR Recruitment & Applicant Tracking SaaS Platform

HirePulse is a multi-tenant SaaS application that enables organizations to manage their complete recruitment workflow—from posting job openings and receiving applications to scheduling interviews with Google Calendar sync, issuing PDF offer letters, and onboarding selected candidates.

---

## 🚀 Key Features & Multi-Tenant SaaS Capabilities

- **Multi-Tenant Architecture**: Strict database and API-level data isolation per organization.
- **Role-Based Authorization (RBAC)**:
  - **Candidate**: Create profile, upload resume, search public job board, apply for jobs, track application status, accept/decline offer letters.
  - **Recruiter**: Create job postings, manage candidate Kanban pipeline, schedule interviews, generate offer letters & candidate report PDFs.
  - **HR Manager**: Manage recruiters, approve job openings, finalize hiring decisions, view team analytics.
  - **Company Admin**: Manage organization profile, purchase/upgrade subscription plans via Stripe, view company-wide analytics.
- **Subscription Management (Free vs Pro)**:
  - **Free Plan**: Max 5 job postings, 2 recruiters, 100 applications.
  - **Pro Plan**: Unlimited jobs, unlimited recruiters, unlimited applications, full analytics.
  - *Strictly enforced at the backend database layer*.
- **Interview Scheduling & Conflict Prevention**: Automated check preventing slot overlaps for the same interviewer, syncs Google Calendar event with join link.
- **PDF Generation**: ReportLab integration for generating Offer Letters, Candidate Reports, and Interview Schedules.
- **Third-Party Integrations**: Stripe, Cloudinary, SendGrid/SMTP, Google Calendar API.

---

## 🏗️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLite (Zero-config default) / PostgreSQL / MySQL
- **ORM & Migrations**: SQLAlchemy & Alembic
- **Auth**: JWT Authentication with `python-jose` & `bcrypt`
- **PDF Generation**: ReportLab
- **Testing**: Pytest & Httpx

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios

---

## 📁 Project Structure

```
c:\projects\hatsp/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py             # Auth dependencies & subscription limit checkers
│   │   │   └── v1/
│   │   │       ├── auth.py          # Register, Login, Me, Candidate Profile
│   │   │       ├── organizations.py # Org profile & recruiters listing
│   │   │       ├── jobs.py          # Multi-tenant jobs CRUD & public job board
│   │   │       ├── applications.py  # Candidate application & pipeline status updates
│   │   │       ├── interviews.py    # Interview scheduling & overlap validation
│   │   │       ├── offer_letters.py # PDF offer letter generation & response
│   │   │       ├── subscriptions.py # Stripe checkout & subscription upgrade
│   │   │       └── analytics.py    # Dashboard metrics & hiring trend charts
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic settings & envloader
│   │   │   ├── database.py         # SQLAlchemy engine & session factory
│   │   │   └── security.py         # Bcrypt hashing & JWT token creation
│   │   ├── models/
│   │   │   └── models.py           # Core DB models (Organization, User, Job, etc.)
│   │   ├── schemas/
│   │   │   └── schemas.py          # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── stripe_service.py   # Stripe Checkout API
│   │   │   ├── email_service.py    # SendGrid/SMTP/Mock mailer
│   │   │   ├── cloudinary_service.py # Cloudinary / local static upload service
│   │   │   ├── gcal_service.py     # Google Calendar event integration
│   │   │   └── pdf_service.py      # ReportLab PDF document generator
│   │   └── main.py                 # FastAPI main application
│   ├── alembic/                    # Alembic database migration scripts
│   ├── tests/                      # Pytest unit & integration test suite
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/            # Navbar, Sidebar, StatusBadge, Modal, ProtectedRoute
│   │   ├── context/               # AuthContext state management
│   │   ├── pages/                 # Landing, Login, Register, Admin, HR, Recruiter, Candidate Dashboards
│   │   ├── services/              # Axios API service client
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

---

## ⚙️ Quick Start & Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run database migrations via Alembic
alembic upgrade head

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

Backend Swagger API Documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```

Frontend application will be available at `http://localhost:5173`.

---

## 🧪 Running Automated Tests

Run the backend Pytest test suite:

```bash
pytest backend/tests/
```

Test suite covers:
1. `test_auth.py`: User registration per role, company creation, JWT login.
2. `test_jobs.py`: Job posting creation & Free plan limit enforcement (Max 5 jobs).
3. `test_applications.py`: Candidate application submission & duplicate prevention rule.
4. `test_interviews.py`: Interview scheduling & interviewer slot overlap validation.
5. `test_subscriptions.py`: Stripe checkout session creation & Pro plan upgrade flow.
6. `test_pdf.py`: ReportLab PDF generation for offer letters, schedules, and reports.

---

## 🗄️ Database Schema & Models

- **Organization**: `id`, `company_name`, `subscription_plan`, `stripe_customer_id`, `created_at`
- **User**: `id`, `organization_id`, `name`, `email`, `hashed_password`, `role`, `created_at`
- **Job**: `id`, `organization_id`, `recruiter_id`, `title`, `description`, `location`, `salary_range`, `employment_type`, `status`, `created_at`
- **CandidateProfile**: `id`, `user_id`, `phone`, `experience`, `skills`, `resume_url`
- **JobApplication**: `id`, `job_id`, `candidate_id`, `status`, `applied_at`
- **Interview**: `id`, `application_id`, `interviewer_id`, `interview_date`, `meeting_link`, `calendar_event_id`, `status`
- **OfferLetter**: `id`, `application_id`, `offer_pdf`, `salary`, `joining_date`, `status`
- **Subscription**: `id`, `organization_id`, `plan`, `status`, `expiry_date`

---

## 🔗 Third-Party Integration Guide

1. **Stripe Integration**:
   - Set `STRIPE_SECRET_KEY` in `.env`.
   - `/api/v1/subscriptions/create-checkout-session` creates a checkout session.
   - On payment success, updates organization plan from `Free` to `Pro`.
2. **SendGrid / SMTP Email Notifications**:
   - Set `SENDGRID_API_KEY` or `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD`.
   - Automatically sends emails for Application Received, Shortlisted, Interview Invitation, Offer Letter, and Rejection.
3. **Cloudinary File Upload**:
   - Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
   - Handles candidate resumes and offer letter PDFs with local static `/uploads` fallback.
4. **Google Calendar API**:
   - Syncs scheduled interviews with Google Calendar events and Google Meet join links.
