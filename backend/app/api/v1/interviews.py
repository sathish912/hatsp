from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional

from app.core.database import get_db
from app.models.models import Interview, JobApplication, Job, User, CandidateProfile, Organization, UserRole, ApplicationStatus, InterviewStatus
from app.schemas.schemas import InterviewScheduleCreate, InterviewUpdate, InterviewResponse
from app.api.deps import get_current_user, require_roles
from app.services.gcal_service import create_google_calendar_event, generate_google_calendar_url
from app.services.email_service import send_interview_invitation_email, send_interview_rescheduled_email
from app.services.pdf_service import generate_interview_schedule_pdf

router = APIRouter(prefix="/interviews", tags=["Interviews"])

@router.post("/schedule", response_model=InterviewResponse)
def schedule_interview(
    schedule_in: InterviewScheduleCreate,
    current_user: User = Depends(require_roles([UserRole.RECRUITER.value, UserRole.HR_MANAGER.value, UserRole.COMPANY_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Schedule an interview with slot overlap prevention & Google Calendar sync."""
    app = db.query(JobApplication).filter(JobApplication.id == schedule_in.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Job application not found")

    job = db.query(Job).filter(Job.id == app.job_id).first()
    if job.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden: Application does not belong to your organization")

    interviewer = db.query(User).filter(User.id == schedule_in.interviewer_id).first()
    if not interviewer:
        raise HTTPException(status_code=404, detail="Interviewer not found")

    # Rule: Interview slots cannot overlap for the same interviewer (±30 minute slot window)
    start_window = schedule_in.interview_date - timedelta(minutes=29)
    end_window = schedule_in.interview_date + timedelta(minutes=29)

    overlapping = db.query(Interview).filter(
        Interview.interviewer_id == schedule_in.interviewer_id,
        Interview.status == InterviewStatus.SCHEDULED.value,
        Interview.interview_date >= start_window,
        Interview.interview_date <= end_window
    ).first()

    if overlapping:
        raise HTTPException(
            status_code=400,
            detail=f"Interview slot conflict: {interviewer.name} already has an interview scheduled near {schedule_in.interview_date.strftime('%Y-%m-%d %H:%M')}."
        )

    candidate = db.query(User).filter(User.id == app.candidate_id).first()

    # Create Google Calendar event & meeting link
    gcal_res = create_google_calendar_event(
        summary=f"Interview: {job.title} - {candidate.name}",
        description=f"Interview scheduled for {job.title} position.",
        start_time=schedule_in.interview_date,
        candidate_email=candidate.email,
        interviewer_email=interviewer.email
    )

    interview = Interview(
        application_id=app.id,
        interviewer_id=schedule_in.interviewer_id,
        interview_date=schedule_in.interview_date,
        meeting_link=gcal_res["meeting_link"],
        calendar_event_id=gcal_res["calendar_event_id"],
        status=InterviewStatus.SCHEDULED.value
    )
    db.add(interview)

    # Update application status to Interview Scheduled
    app.status = ApplicationStatus.INTERVIEW_SCHEDULED.value

    db.commit()
    db.refresh(interview)

    # Send Email Invitation
    try:
        date_str = schedule_in.interview_date.strftime('%B %d, %Y at %I:%M %p')
        send_interview_invitation_email(candidate.email, candidate.name, job.title, date_str, interview.meeting_link, gcal_res.get("gcal_url", ""))
    except Exception as e:
        print(f"Error sending interview email: {e}")

    return InterviewResponse(
        id=interview.id,
        application_id=interview.application_id,
        interviewer_id=interview.interviewer_id,
        interview_date=interview.interview_date,
        meeting_link=interview.meeting_link,
        calendar_event_id=interview.calendar_event_id,
        gcal_url=gcal_res.get("gcal_url"),
        status=interview.status,
        candidate_name=candidate.name,
        job_title=job.title,
        interviewer_name=interviewer.name
    )

@router.get("/my-interviews", response_model=List[InterviewResponse])
def get_my_interviews(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List interviews relevant to the user (Candidate or Recruiter/Interviewer)."""
    if current_user.role == UserRole.CANDIDATE.value:
        interviews = db.query(Interview).join(JobApplication).filter(JobApplication.candidate_id == current_user.id).order_by(Interview.interview_date.asc()).all()
    else:
        interviews = db.query(Interview).join(JobApplication).join(Job).filter(Job.organization_id == current_user.organization_id).order_by(Interview.interview_date.asc()).all()

    res = []
    for inv in interviews:
        app = db.query(JobApplication).filter(JobApplication.id == inv.application_id).first()
        job = db.query(Job).filter(Job.id == app.job_id).first() if app else None
        candidate = db.query(User).filter(User.id == app.candidate_id).first() if app else None
        interviewer = db.query(User).filter(User.id == inv.interviewer_id).first()
        
        gcal_url = generate_google_calendar_url(
            summary=f"Interview: {job.title if job else 'Position'} - {candidate.name if candidate else 'Candidate'}",
            description=f"Interview for {job.title if job else 'Position'} role.",
            start_time=inv.interview_date,
            location=inv.meeting_link or ""
        )

        res.append(
            InterviewResponse(
                id=inv.id,
                application_id=inv.application_id,
                interviewer_id=inv.interviewer_id,
                interview_date=inv.interview_date,
                meeting_link=inv.meeting_link,
                calendar_event_id=inv.calendar_event_id,
                gcal_url=gcal_url,
                status=inv.status,
                candidate_name=candidate.name if candidate else "Candidate",
                job_title=job.title if job else "Role",
                interviewer_name=interviewer.name if interviewer else "Interviewer"
            )
        )
    return res

@router.put("/{interview_id}", response_model=InterviewResponse)
def update_or_reschedule_interview(
    interview_id: int,
    update_in: InterviewUpdate,
    current_user: User = Depends(require_roles([UserRole.RECRUITER.value, UserRole.HR_MANAGER.value, UserRole.COMPANY_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Allows recruiters to edit / reschedule interview date & time with overlap checks and Google Calendar sync notifications."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    app = db.query(JobApplication).filter(JobApplication.id == interview.application_id).first()
    job = db.query(Job).filter(Job.id == app.job_id).first() if app else None

    if not job or job.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Forbidden: Application does not belong to your organization")

    interviewer_id = update_in.interviewer_id or interview.interviewer_id
    interviewer = db.query(User).filter(User.id == interviewer_id).first()
    if not interviewer:
        raise HTTPException(status_code=404, detail="Interviewer not found")

    date_changed = False
    if update_in.interview_date and update_in.interview_date != interview.interview_date:
        # Check slot overlap window (±29 min)
        start_window = update_in.interview_date - timedelta(minutes=29)
        end_window = update_in.interview_date + timedelta(minutes=29)

        overlapping = db.query(Interview).filter(
            Interview.id != interview.id,
            Interview.interviewer_id == interviewer_id,
            Interview.status == InterviewStatus.SCHEDULED.value,
            Interview.interview_date >= start_window,
            Interview.interview_date <= end_window
        ).first()

        if overlapping:
            raise HTTPException(
                status_code=400,
                detail=f"Interview slot conflict: {interviewer.name} already has another interview near {update_in.interview_date.strftime('%Y-%m-%d %H:%M')}."
            )
        interview.interview_date = update_in.interview_date
        date_changed = True

    if update_in.interviewer_id:
        interview.interviewer_id = update_in.interviewer_id
    if update_in.meeting_link:
        interview.meeting_link = update_in.meeting_link

    candidate = db.query(User).filter(User.id == app.candidate_id).first() if app else None

    # Generate fresh Google Calendar Add URL
    gcal_url = generate_google_calendar_url(
        summary=f"Interview: {job.title} - {candidate.name if candidate else 'Candidate'}",
        description=f"Interview for {job.title} position.",
        start_time=interview.interview_date,
        location=interview.meeting_link or ""
    )

    db.commit()
    db.refresh(interview)

    # Send rescheduled email notification if date was changed
    if date_changed and candidate:
        try:
            date_str = interview.interview_date.strftime('%B %d, %Y at %I:%M %p')
            send_interview_rescheduled_email(candidate.email, candidate.name, job.title, date_str, interview.meeting_link or "", gcal_url)
        except Exception as e:
            print(f"Error sending rescheduled email: {e}")

    return InterviewResponse(
        id=interview.id,
        application_id=interview.application_id,
        interviewer_id=interview.interviewer_id,
        interview_date=interview.interview_date,
        meeting_link=interview.meeting_link,
        calendar_event_id=interview.calendar_event_id,
        gcal_url=gcal_url,
        status=interview.status,
        candidate_name=candidate.name if candidate else "Candidate",
        job_title=job.title if job else "Role",
        interviewer_name=interviewer.name if interviewer else "Interviewer"
    )

@router.put("/{interview_id}/status", response_model=InterviewResponse)
def update_interview_status(
    interview_id: int,
    status_str: str,
    current_user: User = Depends(require_roles([UserRole.RECRUITER.value, UserRole.HR_MANAGER.value, UserRole.COMPANY_ADMIN.value])),
    db: Session = Depends(get_db)
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.status = status_str
    app = db.query(JobApplication).filter(JobApplication.id == interview.application_id).first()
    if app and status_str == InterviewStatus.COMPLETED.value:
        app.status = ApplicationStatus.INTERVIEW_COMPLETED.value

    db.commit()
    db.refresh(interview)

    job = db.query(Job).filter(Job.id == app.job_id).first() if app else None
    candidate = db.query(User).filter(User.id == app.candidate_id).first() if app else None
    interviewer = db.query(User).filter(User.id == interview.interviewer_id).first()

    return InterviewResponse(
        id=interview.id,
        application_id=interview.application_id,
        interviewer_id=interview.interviewer_id,
        interview_date=interview.interview_date,
        meeting_link=interview.meeting_link,
        calendar_event_id=interview.calendar_event_id,
        status=interview.status,
        candidate_name=candidate.name if candidate else "Candidate",
        job_title=job.title if job else "Role",
        interviewer_name=interviewer.name if interviewer else "Interviewer"
    )

@router.get("/{interview_id}/pdf")
def download_interview_schedule_pdf(interview_id: int, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    app = db.query(JobApplication).filter(JobApplication.id == interview.application_id).first()
    job = db.query(Job).filter(Job.id == app.job_id).first() if app else None
    candidate = db.query(User).filter(User.id == app.candidate_id).first() if app else None
    interviewer = db.query(User).filter(User.id == interview.interviewer_id).first()

    filename = f"interview_schedule_{interview_id}.pdf"
    date_str = interview.interview_date.strftime('%B %d, %Y at %I:%M %p')
    filepath = generate_interview_schedule_pdf(
        candidate_name=candidate.name if candidate else "Candidate",
        job_title=job.title if job else "Position",
        interviewer_name=interviewer.name if interviewer else "Interviewer",
        interview_date=date_str,
        meeting_link=interview.meeting_link or "Online Meeting",
        filename=filename
    )

    return FileResponse(filepath, media_type="application/pdf", filename=filename)

@router.get("/notifications")
def get_calendar_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch real-time Google Calendar interview notifications for candidate or recruiter."""
    if current_user.role == UserRole.CANDIDATE.value:
        interviews = db.query(Interview).join(JobApplication).filter(JobApplication.candidate_id == current_user.id).order_by(Interview.interview_date.desc()).all()
    else:
        interviews = db.query(Interview).join(JobApplication).join(Job).filter(Job.organization_id == current_user.organization_id).order_by(Interview.interview_date.desc()).all()

    notifications = []
    for inv in interviews:
        app = db.query(JobApplication).filter(JobApplication.id == inv.application_id).first()
        job = db.query(Job).filter(Job.id == app.job_id).first() if app else None
        candidate = db.query(User).filter(User.id == app.candidate_id).first() if app else None
        interviewer = db.query(User).filter(User.id == inv.interviewer_id).first()

        date_str = inv.interview_date.strftime('%b %d, %Y at %I:%M %p')
        gcal_url = generate_google_calendar_url(
            summary=f"Interview: {job.title if job else 'Position'} - {candidate.name if candidate else 'Candidate'}",
            description=f"Official interview for {job.title if job else 'Position'} position.",
            start_time=inv.interview_date,
            location=inv.meeting_link or ""
        )

        notifications.append({
            "id": f"notif-inv-{inv.id}",
            "interview_id": inv.id,
            "type": "google_calendar_reminder",
            "title": "📅 Google Calendar Interview Reminder",
            "message": f"Interview for {job.title if job else 'Position'} on {date_str}. Synchronize with your Google Calendar for automatic alerts.",
            "timestamp": inv.interview_date.isoformat(),
            "date_str": date_str,
            "gcal_url": gcal_url,
            "meeting_link": inv.meeting_link,
            "candidate_name": candidate.name if candidate else "Candidate",
            "job_title": job.title if job else "Role",
            "interviewer_name": interviewer.name if interviewer else "Interviewer",
            "status": inv.status
        })

    return notifications
