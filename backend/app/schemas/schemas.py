from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str # candidate, recruiter, hr_manager, company_admin
    company_name: Optional[str] = None # Admin only

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    organization_id: Optional[int] = None
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Organization & Subscription
class OrganizationResponse(BaseModel):
    id: int
    company_name: str
    subscription_plan: str
    company_logo: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SubscriptionResponse(BaseModel):
    id: int
    organization_id: int
    plan: str
    status: str
    expiry_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AdminPlanUpdate(BaseModel):
    plan: str
    status: Optional[str] = "active"
    pro_plan_price: Optional[int] = 7999


# Profile Schema for All User Roles
class CandidateProfileCreate(BaseModel):
    phone: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    resume_url: Optional[str] = None

class CandidateProfileUpdate(BaseModel):
    phone: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    resume_url: Optional[str] = None
    experience_certificate_url: Optional[str] = None

class CandidateProfileResponse(BaseModel):
    id: int
    user_id: int
    phone: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    resume_url: Optional[str] = None
    experience_certificate_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    name: str
    email: EmailStr
    role: str
    organization_id: Optional[int] = None
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    phone: Optional[str] = None
    experience: Optional[str] = None
    skills: Optional[str] = None
    resume_url: Optional[str] = None
    experience_certificate_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Job
class JobCreate(BaseModel):
    title: str
    description: str
    location: str
    salary_range: Optional[str] = "₹1,200,000 - ₹1,800,000"
    employment_type: str = "Full-time"
    status: str = "active"

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    employment_type: Optional[str] = None
    status: Optional[str] = None

class JobResponse(BaseModel):
    id: int
    organization_id: int
    recruiter_id: Optional[int] = None
    title: str
    description: str
    location: str
    salary_range: Optional[str] = None
    employment_type: str
    status: str
    is_premium: Optional[bool] = False
    premium_paid_at: Optional[datetime] = None
    created_at: datetime
    company_name: Optional[str] = None
    applications_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

# Job Application
class JobApplicationCreate(BaseModel):
    job_id: int

class ApplicationStatusUpdate(BaseModel):
    status: str

class JobApplicationResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    status: str
    applied_at: datetime
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    candidate_experience: Optional[str] = None
    candidate_skills: Optional[str] = None
    candidate_resume_url: Optional[str] = None
    candidate_experience_certificate_url: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Interview
class InterviewScheduleCreate(BaseModel):
    application_id: int
    interviewer_id: int
    interview_date: datetime

class InterviewUpdate(BaseModel):
    interview_date: Optional[datetime] = None
    interviewer_id: Optional[int] = None
    meeting_link: Optional[str] = None

class InterviewResponse(BaseModel):
    id: int
    application_id: int
    interviewer_id: int
    interview_date: datetime
    meeting_link: Optional[str] = None
    calendar_event_id: Optional[str] = None
    gcal_url: Optional[str] = None
    status: str
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None
    interviewer_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Offer Letter
class OfferLetterCreate(BaseModel):
    application_id: int
    salary: str
    joining_date: str

class OfferLetterStatusUpdate(BaseModel):
    status: str

class OfferLetterResponse(BaseModel):
    id: int
    application_id: int
    offer_pdf: Optional[str] = None
    salary: str
    joining_date: str
    status: str
    candidate_name: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Analytics
class AnalyticsDashboard(BaseModel):
    total_jobs: int
    active_recruiters: int
    applications_received: int
    hires_this_month: int
    offer_acceptance_rate: float
    subscription_plan: str
    pro_plan_price: Optional[int] = 7999
    company_logo: Optional[str] = None
    hiring_trends: List[dict]
    job_applications_breakdown: List[dict]
