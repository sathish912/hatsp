import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import OfferLetter, JobApplication, Job, User, Organization, UserRole, ApplicationStatus, OfferStatus
from app.schemas.schemas import OfferLetterCreate, OfferLetterStatusUpdate, OfferLetterResponse
from app.api.deps import get_current_user, require_roles
from app.services.pdf_service import generate_offer_letter_pdf
from app.services.email_service import send_offer_letter_email

router = APIRouter(prefix="/offer-letters", tags=["Offer Letters"])

@router.post("/generate", response_model=OfferLetterResponse)
def generate_offer_letter(
    offer_in: OfferLetterCreate,
    current_user: User = Depends(require_roles([UserRole.RECRUITER.value, UserRole.HR_MANAGER.value, UserRole.COMPANY_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Generate offer letter PDF for candidate (Enforces Interview Completed prerequisite rule)."""
    app = db.query(JobApplication).filter(JobApplication.id == offer_in.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Job application not found")

    job = db.query(Job).filter(Job.id == app.job_id).first()
    if job.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden: Application does not belong to your organization")

    # Rule: Offer letters can ONLY be generated after a successful interview!
    eligible_statuses = [ApplicationStatus.INTERVIEW_COMPLETED.value, ApplicationStatus.SELECTED.value, ApplicationStatus.OFFER_SENT.value]
    if app.status not in eligible_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot generate offer letter: Candidate must have completed an interview first (Current application status: {app.status})."
        )

    candidate = db.query(User).filter(User.id == app.candidate_id).first()
    org = db.query(Organization).filter(Organization.id == job.organization_id).first()

    pdf_filename = f"offer_letter_app_{app.id}.pdf"
    pdf_path = generate_offer_letter_pdf(
        candidate_name=candidate.name,
        job_title=job.title,
        company_name=org.company_name,
        salary=offer_in.salary,
        joining_date=offer_in.joining_date,
        filename=pdf_filename
    )
    pdf_url = f"/uploads/pdfs/{pdf_filename}"

    offer = db.query(OfferLetter).filter(OfferLetter.application_id == app.id).first()
    if not offer:
        offer = OfferLetter(
            application_id=app.id,
            offer_pdf=pdf_url,
            salary=offer_in.salary,
            joining_date=offer_in.joining_date,
            status=OfferStatus.SENT.value
        )
        db.add(offer)
    else:
        offer.offer_pdf = pdf_url
        offer.salary = offer_in.salary
        offer.joining_date = offer_in.joining_date
        offer.status = OfferStatus.SENT.value

    # Update application status to Offer Sent
    app.status = ApplicationStatus.OFFER_SENT.value
    db.commit()
    db.refresh(offer)

    # Send notification email
    try:
        send_offer_letter_email(candidate.email, candidate.name, job.title, pdf_url)
    except Exception as e:
        print(f"Error sending offer email: {e}")

    return OfferLetterResponse(
        id=offer.id,
        application_id=offer.application_id,
        offer_pdf=offer.offer_pdf,
        salary=offer.salary,
        joining_date=offer.joining_date,
        status=offer.status,
        candidate_name=candidate.name,
        job_title=job.title,
        company_name=org.company_name
    )

@router.get("/my-offers", response_model=List[OfferLetterResponse])
def get_my_offers(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.CANDIDATE.value:
        offers = db.query(OfferLetter).join(JobApplication).filter(JobApplication.candidate_id == current_user.id).all()
    else:
        offers = db.query(OfferLetter).join(JobApplication).join(Job).filter(Job.organization_id == current_user.organization_id).all()

    res = []
    for off in offers:
        app = db.query(JobApplication).filter(JobApplication.id == off.application_id).first()
        job = db.query(Job).filter(Job.id == app.job_id).first() if app else None
        candidate = db.query(User).filter(User.id == app.candidate_id).first() if app else None
        org = db.query(Organization).filter(Organization.id == job.organization_id).first() if job else None
        res.append(
            OfferLetterResponse(
                id=off.id,
                application_id=off.application_id,
                offer_pdf=off.offer_pdf,
                salary=off.salary,
                joining_date=off.joining_date,
                status=off.status,
                candidate_name=candidate.name if candidate else "Candidate",
                job_title=job.title if job else "Role",
                company_name=org.company_name if org else "Company"
            )
        )
    return res

@router.put("/{offer_id}/respond", response_model=OfferLetterResponse)
def respond_to_offer(
    offer_id: int,
    status_in: OfferLetterStatusUpdate,
    current_user: User = Depends(require_roles([UserRole.CANDIDATE.value])),
    db: Session = Depends(get_db)
):
    """Candidate accepts or declines an offer letter."""
    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer letter not found")

    app = db.query(JobApplication).filter(JobApplication.id == offer.application_id).first()
    if app.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: Offer letter does not belong to you")

    if status_in.status not in [OfferStatus.ACCEPTED.value, OfferStatus.DECLINED.value]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'accepted' or 'declined'")

    offer.status = status_in.status
    if status_in.status == OfferStatus.ACCEPTED.value:
        app.status = ApplicationStatus.OFFER_ACCEPTED.value
    else:
        app.status = ApplicationStatus.OFFER_DECLINED.value

    db.commit()
    db.refresh(offer)

    job = db.query(Job).filter(Job.id == app.job_id).first()
    org = db.query(Organization).filter(Organization.id == job.organization_id).first()

    return OfferLetterResponse(
        id=offer.id,
        application_id=offer.application_id,
        offer_pdf=offer.offer_pdf,
        salary=offer.salary,
        joining_date=offer.joining_date,
        status=offer.status,
        candidate_name=current_user.name,
        job_title=job.title,
        company_name=org.company_name
    )

@router.get("/{offer_id}/download")
def download_offer_pdf(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(OfferLetter).filter(OfferLetter.id == offer_id).first()
    if not offer or not offer.offer_pdf:
        raise HTTPException(status_code=404, detail="Offer letter PDF not found")

    filename = os.path.basename(offer.offer_pdf)
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads", "pdfs")
    os.makedirs(uploads_dir, exist_ok=True)
    filepath = os.path.join(uploads_dir, filename)

    if not os.path.exists(filepath):
        # Generate on the fly if missing
        app = db.query(JobApplication).filter(JobApplication.id == offer.application_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Job application not found")
        job = db.query(Job).filter(Job.id == app.job_id).first()
        candidate = db.query(User).filter(User.id == app.candidate_id).first()
        org = db.query(Organization).filter(Organization.id == job.organization_id).first()
        filepath = generate_offer_letter_pdf(
            candidate_name=candidate.name if candidate else "Candidate",
            job_title=job.title if job else "Role",
            company_name=org.company_name if org else "Company",
            salary=offer.salary or "Standard Package",
            joining_date=offer.joining_date or "ASAP",
            filename=filename
        )

    return FileResponse(filepath, media_type="application/pdf", filename=filename)
