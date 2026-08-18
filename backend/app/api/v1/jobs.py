from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.models import Job, User, Organization, JobApplication, UserRole, JobStatus
from app.schemas.schemas import JobCreate, JobUpdate, JobResponse
from app.api.deps import get_current_user, require_roles, check_job_posting_subscription_limit
from app.services.stripe_service import create_stripe_job_checkout_session
from app.core.config import settings

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/public", response_model=List[JobResponse])
def get_public_jobs(search: Optional[str] = None, db: Session = Depends(get_db)):
    """Public job postings endpoint for candidates to browse (Featured Premium jobs pinned at top)."""
    query = db.query(Job).filter(Job.status == JobStatus.ACTIVE.value)
    if search:
        query = query.filter(Job.title.ilike(f"%{search}%") | Job.description.ilike(f"%{search}%") | Job.location.ilike(f"%{search}%"))
    
    # Premium jobs featured first, then newest jobs
    jobs = query.order_by(Job.is_premium.desc(), Job.created_at.desc()).all()

    result = []
    for job in jobs:
        org = db.query(Organization).filter(Organization.id == job.organization_id).first()
        apps_count = db.query(JobApplication).filter(JobApplication.job_id == job.id).count()
        result.append(
            JobResponse(
                id=job.id,
                organization_id=job.organization_id,
                recruiter_id=job.recruiter_id,
                title=job.title,
                description=job.description,
                location=job.location,
                salary_range=job.salary_range,
                employment_type=job.employment_type,
                status=job.status,
                is_premium=job.is_premium or False,
                premium_paid_at=job.premium_paid_at,
                created_at=job.created_at,
                company_name=org.company_name if org else "Company",
                applications_count=apps_count
            )
        )
    return result

@router.get("/my-org", response_model=List[JobResponse])
def get_my_org_jobs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Tenant-scoped jobs for recruiters, HR managers, and admins."""
    if not current_user.organization_id:
        return []
    
    jobs = db.query(Job).filter(Job.organization_id == current_user.organization_id).order_by(Job.is_premium.desc(), Job.created_at.desc()).all()
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()

    result = []
    for job in jobs:
        apps_count = db.query(JobApplication).filter(JobApplication.job_id == job.id).count()
        result.append(
            JobResponse(
                id=job.id,
                organization_id=job.organization_id,
                recruiter_id=job.recruiter_id,
                title=job.title,
                description=job.description,
                location=job.location,
                salary_range=job.salary_range,
                employment_type=job.employment_type,
                status=job.status,
                is_premium=job.is_premium or False,
                premium_paid_at=job.premium_paid_at,
                created_at=job.created_at,
                company_name=org.company_name if org else "Company",
                applications_count=apps_count
            )
        )
    return result

@router.post("/", response_model=JobResponse)
def create_job(
    job_in: JobCreate,
    current_user: User = Depends(require_roles([UserRole.RECRUITER.value, UserRole.HR_MANAGER.value, UserRole.COMPANY_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Create a new job opening (Enforces multi-tenant subscription limits)."""
    check_job_posting_subscription_limit(current_user, db)

    job = Job(
        organization_id=current_user.organization_id,
        recruiter_id=current_user.id,
        title=job_in.title,
        description=job_in.description,
        location=job_in.location,
        salary_range=job_in.salary_range,
        employment_type=job_in.employment_type,
        status=job_in.status
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    org = db.query(Organization).filter(Organization.id == job.organization_id).first()
    return JobResponse(
        id=job.id,
        organization_id=job.organization_id,
        recruiter_id=job.recruiter_id,
        title=job.title,
        description=job.description,
        location=job.location,
        salary_range=job.salary_range,
        employment_type=job.employment_type,
        status=job.status,
        is_premium=job.is_premium or False,
        premium_paid_at=job.premium_paid_at,
        created_at=job.created_at,
        company_name=org.company_name if org else "Company",
        applications_count=0
    )

@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_in: JobUpdate,
    current_user: User = Depends(require_roles([UserRole.RECRUITER.value, UserRole.HR_MANAGER.value, UserRole.COMPANY_ADMIN.value])),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id, Job.organization_id == current_user.organization_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job_in.title is not None: job.title = job_in.title
    if job_in.description is not None: job.description = job_in.description
    if job_in.location is not None: job.location = job_in.location
    if job_in.salary_range is not None: job.salary_range = job_in.salary_range
    if job_in.employment_type is not None: job.employment_type = job_in.employment_type
    if job_in.status is not None: job.status = job_in.status

    db.commit()
    db.refresh(job)

    org = db.query(Organization).filter(Organization.id == job.organization_id).first()
    apps_count = db.query(JobApplication).filter(JobApplication.job_id == job.id).count()

    return JobResponse(
        id=job.id,
        organization_id=job.organization_id,
        recruiter_id=job.recruiter_id,
        title=job.title,
        description=job.description,
        location=job.location,
        salary_range=job.salary_range,
        employment_type=job.employment_type,
        status=job.status,
        is_premium=job.is_premium or False,
        premium_paid_at=job.premium_paid_at,
        created_at=job.created_at,
        company_name=org.company_name if org else "Company",
        applications_count=apps_count
    )

@router.post("/{job_id}/create-premium-checkout")
def create_premium_job_checkout(
    job_id: int,
    price_inr: int = 1499,
    current_user: User = Depends(require_roles([UserRole.RECRUITER.value, UserRole.HR_MANAGER.value, UserRole.COMPANY_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Initiates a Stripe Checkout Session for promoting a Job posting to Premium/Featured status."""
    job = db.query(Job).filter(Job.id == job_id, Job.organization_id == current_user.organization_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found in your organization")

    success_url = f"{settings.FRONTEND_URL}/job-payment-success"
    cancel_url = f"{settings.FRONTEND_URL}/recruiter"

    session_res = create_stripe_job_checkout_session(
        job_id=job.id,
        job_title=job.title,
        price_inr=price_inr,
        success_url=success_url,
        cancel_url=cancel_url
    )
    return session_res

@router.post("/{job_id}/confirm-premium-payment")
def confirm_premium_job_payment(
    job_id: int,
    session_id: str,
    current_user: User = Depends(require_roles([UserRole.RECRUITER.value, UserRole.HR_MANAGER.value, UserRole.COMPANY_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Confirms Stripe one-time payment and marks job posting as Premium Featured."""
    job = db.query(Job).filter(Job.id == job_id, Job.organization_id == current_user.organization_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")

    job.is_premium = True
    job.premium_paid_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return {"message": "Job posting successfully promoted to Featured Premium!", "job_id": job.id, "is_premium": True}
