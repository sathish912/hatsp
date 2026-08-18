from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.models import JobApplication, Job, User, CandidateProfile, Organization, UserRole, ApplicationStatus
from app.schemas.schemas import JobApplicationCreate, ApplicationStatusUpdate, JobApplicationResponse
from app.api.deps import get_current_user, require_roles, check_application_subscription_limit
from app.services.email_service import send_application_received_email, send_shortlisted_email, send_rejection_email

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("/apply", response_model=JobApplicationResponse)
def apply_for_job(
    app_in: JobApplicationCreate,
    current_user: User = Depends(require_roles([UserRole.CANDIDATE.value])),
    db: Session = Depends(get_db)
):
    """Candidate applies for a job posting."""
    job = db.query(Job).filter(Job.id == app_in.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")

    # Rule: Check duplicate application
    existing_app = db.query(JobApplication).filter(
        JobApplication.job_id == app_in.job_id,
        JobApplication.candidate_id == current_user.id
    ).first()
    if existing_app:
        raise HTTPException(
            status_code=400,
            detail="You have already submitted an application for this job posting."
        )

    # Rule: Subscription application limit check
    check_application_subscription_limit(app_in.job_id, db)

    new_app = JobApplication(
        job_id=app_in.job_id,
        candidate_id=current_user.id,
        status=ApplicationStatus.APPLIED.value
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    # Send Application Received Email
    send_application_received_email(current_user.email, current_user.name, job.title)

    org = db.query(Organization).filter(Organization.id == job.organization_id).first()
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()

    return JobApplicationResponse(
        id=new_app.id,
        job_id=new_app.job_id,
        candidate_id=new_app.candidate_id,
        status=new_app.status,
        applied_at=new_app.applied_at,
        candidate_name=current_user.name,
        candidate_email=current_user.email,
        candidate_phone=profile.phone if profile else None,
        candidate_experience=profile.experience if profile else None,
        candidate_skills=profile.skills if profile else None,
        candidate_resume_url=profile.resume_url if profile else None,
        job_title=job.title,
        company_name=org.company_name if org else "Company"
    )

@router.get("/my-applications", response_model=List[JobApplicationResponse])
def get_my_applications(current_user: User = Depends(require_roles([UserRole.CANDIDATE.value])), db: Session = Depends(get_db)):
    """List applications submitted by the current candidate."""
    apps = db.query(JobApplication).filter(JobApplication.candidate_id == current_user.id).order_by(JobApplication.applied_at.desc()).all()
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()

    res = []
    for app in apps:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        org = db.query(Organization).filter(Organization.id == job.organization_id).first() if job else None
        res.append(
            JobApplicationResponse(
                id=app.id,
                job_id=app.job_id,
                candidate_id=app.candidate_id,
                status=app.status,
                applied_at=app.applied_at,
                candidate_name=current_user.name,
                candidate_email=current_user.email,
                candidate_phone=profile.phone if profile else None,
                candidate_experience=profile.experience if profile else None,
                candidate_skills=profile.skills if profile else None,
                candidate_resume_url=profile.resume_url if profile else None,
                job_title=job.title if job else "N/A",
                company_name=org.company_name if org else "Company"
            )
        )
    return res

@router.get("/org-applications", response_model=List[JobApplicationResponse])
def get_org_applications(
    job_id: Optional[int] = None,
    current_user: User = Depends(require_roles([UserRole.RECRUITER.value, UserRole.HR_MANAGER.value, UserRole.COMPANY_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Tenant-scoped applications list for recruiters/HR/admin."""
    query = db.query(JobApplication).join(Job).filter(Job.organization_id == current_user.organization_id)
    if job_id:
        query = query.filter(JobApplication.job_id == job_id)

    apps = query.order_by(JobApplication.applied_at.desc()).all()

    res = []
    for app in apps:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        cand = db.query(User).filter(User.id == app.candidate_id).first()
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == app.candidate_id).first() if cand else None
        org = db.query(Organization).filter(Organization.id == job.organization_id).first() if job else None

        res.append(
            JobApplicationResponse(
                id=app.id,
                job_id=app.job_id,
                candidate_id=app.candidate_id,
                status=app.status,
                applied_at=app.applied_at,
                candidate_name=cand.name if cand else "Unknown",
                candidate_email=cand.email if cand else "Unknown",
                candidate_phone=profile.phone if profile else None,
                candidate_experience=profile.experience if profile else None,
                candidate_skills=profile.skills if profile else None,
                candidate_resume_url=profile.resume_url if profile else None,
                job_title=job.title if job else "N/A",
                company_name=org.company_name if org else "Company"
            )
        )
    return res

@router.put("/{application_id}/status", response_model=JobApplicationResponse)
def update_application_status(
    application_id: int,
    status_in: ApplicationStatusUpdate,
    current_user: User = Depends(require_roles([UserRole.RECRUITER.value, UserRole.HR_MANAGER.value, UserRole.COMPANY_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Update application status across workflow (Shortlist, Reject, etc.)."""
    app = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(Job.id == app.job_id).first()
    # Multi-tenant scoping: Check org ownership
    if job.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot modify applications outside your organization")

    prev_status = app.status
    app.status = status_in.status
    db.commit()
    db.refresh(app)

    candidate = db.query(User).filter(User.id == app.candidate_id).first()
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == app.candidate_id).first() if candidate else None
    org = db.query(Organization).filter(Organization.id == job.organization_id).first() if job else None

    # Triggers email notifications
    if candidate:
        if status_in.status == ApplicationStatus.SHORTLISTED.value and prev_status != ApplicationStatus.SHORTLISTED.value:
            send_shortlisted_email(candidate.email, candidate.name, job.title)
        elif status_in.status == ApplicationStatus.REJECTED.value and prev_status != ApplicationStatus.REJECTED.value:
            send_rejection_email(candidate.email, candidate.name, job.title)

    return JobApplicationResponse(
        id=app.id,
        job_id=app.job_id,
        candidate_id=app.candidate_id,
        status=app.status,
        applied_at=app.applied_at,
        candidate_name=candidate.name if candidate else "Unknown",
        candidate_email=candidate.email if candidate else "Unknown",
        candidate_phone=profile.phone if profile else None,
        candidate_experience=profile.experience if profile else None,
        candidate_skills=profile.skills if profile else None,
        candidate_resume_url=profile.resume_url if profile else None,
        job_title=job.title if job else "N/A",
        company_name=org.company_name if org else "Company"
    )
