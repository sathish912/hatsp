import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Float, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"
    HR_MANAGER = "hr_manager"
    COMPANY_ADMIN = "company_admin"

class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    ACTIVE = "active"
    CLOSED = "closed"

class ApplicationStatus(str, enum.Enum):
    APPLIED = "Applied"
    SHORTLISTED = "Shortlisted"
    INTERVIEW_SCHEDULED = "Interview Scheduled"
    INTERVIEW_COMPLETED = "Interview Completed"
    SELECTED = "Selected"
    REJECTED = "Rejected"
    OFFER_SENT = "Offer Sent"
    OFFER_ACCEPTED = "Offer Accepted"
    OFFER_DECLINED = "Offer Declined"

class InterviewStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class OfferStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    DECLINED = "declined"

class SubscriptionPlan(str, enum.Enum):
    FREE = "Free"
    PRO = "Pro"

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELED = "canceled"
    EXPIRED = "expired"

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False)
    subscription_plan = Column(String(50), default=SubscriptionPlan.FREE.value, nullable=False)
    pro_plan_price = Column(Integer, default=7999, nullable=False)
    company_logo = Column(String(255), nullable=True)
    stripe_customer_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="organization", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="organization", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=UserRole.CANDIDATE.value)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="users")
    profile = relationship("CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    created_jobs = relationship("Job", back_populates="recruiter")
    applications = relationship("JobApplication", back_populates="candidate")
    conducted_interviews = relationship("Interview", back_populates="interviewer")

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    experience = Column(String(255), nullable=True)
    skills = Column(Text, nullable=True)
    resume_url = Column(String(500), nullable=True)
    experience_certificate_url = Column(String(500), nullable=True)

    user = relationship("User", back_populates="profile")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    recruiter_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    salary_range = Column(String(100), nullable=True)
    employment_type = Column(String(100), nullable=False, default="Full-time")
    status = Column(String(50), nullable=False, default=JobStatus.ACTIVE.value)
    is_premium = Column(Boolean, default=False, nullable=False)
    premium_paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="jobs")
    recruiter = relationship("User", back_populates="created_jobs")
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False, default=ApplicationStatus.APPLIED.value)
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("job_id", "candidate_id", name="uq_job_candidate_application"),
    )

    job = relationship("Job", back_populates="applications")
    candidate = relationship("User", back_populates="applications")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")
    offer_letters = relationship("OfferLetter", back_populates="application", cascade="all, delete-orphan")

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=False)
    interviewer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    interview_date = Column(DateTime, nullable=False)
    meeting_link = Column(String(500), nullable=True)
    calendar_event_id = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default=InterviewStatus.SCHEDULED.value)

    application = relationship("JobApplication", back_populates="interviews")
    interviewer = relationship("User", back_populates="conducted_interviews")

class OfferLetter(Base):
    __tablename__ = "offer_letters"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("job_applications.id", ondelete="CASCADE"), nullable=False)
    offer_pdf = Column(String(500), nullable=True)
    salary = Column(String(100), nullable=False)
    joining_date = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default=OfferStatus.SENT.value)

    application = relationship("JobApplication", back_populates="offer_letters")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    plan = Column(String(50), nullable=False, default=SubscriptionPlan.FREE.value)
    status = Column(String(50), nullable=False, default=SubscriptionStatus.ACTIVE.value)
    expiry_date = Column(DateTime, nullable=True)

    organization = relationship("Organization", back_populates="subscriptions")
