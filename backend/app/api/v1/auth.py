from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import Optional

from datetime import timedelta
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, verify_token
from app.models.models import User, Organization, CandidateProfile, UserRole, SubscriptionPlan
from app.schemas.schemas import UserRegister, UserLogin, Token, UserResponse, CandidateProfileResponse, UserProfileResponse, ForgotPasswordRequest, ResetPasswordRequest
from app.api.deps import get_current_user, check_recruiter_subscription_limit
from app.services.cloudinary_service import upload_file_to_storage
from app.services.email_service import send_welcome_email, send_password_reset_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    org_id = None
    company_name_res = None

    if user_data.role == UserRole.COMPANY_ADMIN.value:
        if not user_data.company_name:
            raise HTTPException(status_code=400, detail="Company Name is required for Company Admin registration")
        # Create Organization
        org = Organization(company_name=user_data.company_name, subscription_plan=SubscriptionPlan.FREE.value)
        db.add(org)
        db.commit()
        db.refresh(org)
        org_id = org.id
        company_name_res = org.company_name
    elif user_data.role in [UserRole.RECRUITER.value, UserRole.HR_MANAGER.value]:
        # User belongs to existing org if provided, otherwise require org association
        if user_data.company_name:
            org = db.query(Organization).filter(Organization.company_name == user_data.company_name).first()
            if not org:
                org = Organization(company_name=user_data.company_name, subscription_plan=SubscriptionPlan.FREE.value)
                db.add(org)
                db.commit()
                db.refresh(org)
            org_id = org.id
            company_name_res = org.company_name
            # Check recruiter limit
            check_recruiter_subscription_limit(org_id, db)

    # Create User
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
        organization_id=org_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create candidate profile for profile info storage
    profile = CandidateProfile(user_id=new_user.id)
    db.add(profile)
    db.commit()

    # Send Welcome Email
    try:
        send_welcome_email(new_user.name, new_user.email, new_user.role)
    except Exception as e:
        print(f"Error sending welcome email: {e}")

    token = create_access_token(subject=new_user.id, role=new_user.role, org_id=new_user.organization_id)
    
    user_res = UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        organization_id=new_user.organization_id,
        company_name=company_name_res,
        created_at=new_user.created_at
    )
    
    return Token(access_token=token, token_type="bearer", user=user_res)

@router.post("/login", response_model=Token)
async def login(request: Request, db: Session = Depends(get_db)):
    content_type = request.headers.get("content-type", "")
    email = None
    password = None

    if "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        email = form.get("username") or form.get("email")
        password = form.get("password")
    else:
        try:
            body = await request.json()
            email = body.get("email") or body.get("username")
            password = body.get("password")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid request format")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    org_name = None
    org_logo = None
    if user.organization_id:
        org = db.query(Organization).filter(Organization.id == user.organization_id).first()
        if org:
            org_name = org.company_name
            org_logo = org.company_logo

    token = create_access_token(subject=user.id, role=user.role, org_id=user.organization_id)
    user_res = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        organization_id=user.organization_id,
        company_name=org_name,
        company_logo=org_logo,
        created_at=user.created_at
    )
    return Token(access_token=token, token_type="bearer", user=user_res)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org_name = None
    org_logo = None
    if current_user.organization_id:
        org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
        if org:
            org_name = org.company_name
            org_logo = org.company_logo
            
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        organization_id=current_user.organization_id,
        company_name=org_name,
        company_logo=org_logo,
        created_at=current_user.created_at
    )

@router.get("/profile", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch profile for ANY platform user role (Admin, HR Manager, Recruiter, Candidate)."""
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    org_name = None
    org_logo = None
    if current_user.organization_id:
        org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
        if org:
            org_name = org.company_name
            org_logo = org.company_logo

    return UserProfileResponse(
        id=profile.id,
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        organization_id=current_user.organization_id,
        company_name=org_name,
        company_logo=org_logo,
        phone=profile.phone,
        experience=profile.experience,
        skills=profile.skills,
        resume_url=profile.resume_url,
        experience_certificate_url=profile.experience_certificate_url,
        created_at=current_user.created_at
    )

@router.put("/profile", response_model=UserProfileResponse)
def update_profile(
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    company_name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    experience: Optional[str] = Form(None),
    skills: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None),
    experience_certificate: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile details for ANY platform user role."""
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)

    # Update basic User fields
    if name is not None and name.strip():
        current_user.name = name.strip()

    if email is not None and email.strip():
        # Check email uniqueness
        existing = db.query(User).filter(User.email == email.strip(), User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email address is already in use by another account.")
        current_user.email = email.strip()

    # Update Organization Name if user belongs to an org
    org_name = None
    if current_user.organization_id:
        org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
        if org:
            if company_name is not None and company_name.strip():
                org.company_name = company_name.strip()
            org_name = org.company_name

    if phone is not None:
        profile.phone = phone
    if experience is not None:
        profile.experience = experience
    if skills is not None:
        profile.skills = skills

    if resume:
        resume_url = upload_file_to_storage(resume, folder="resumes")
        profile.resume_url = resume_url

    if experience_certificate:
        cert_url = upload_file_to_storage(experience_certificate, folder="experience_certificates")
        profile.experience_certificate_url = cert_url

    db.commit()
    db.refresh(profile)
    db.refresh(current_user)

    return UserProfileResponse(
        id=profile.id,
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        organization_id=current_user.organization_id,
        company_name=org_name,
        phone=profile.phone,
        experience=profile.experience,
        skills=profile.skills,
        resume_url=profile.resume_url,
        experience_certificate_url=profile.experience_certificate_url,
        created_at=current_user.created_at
    )

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generates a password reset token and emails instructions to the user."""
    user = db.query(User).filter(User.email == request.email.strip()).first()
    if not user:
        return {"message": "If an account exists with this email, password reset instructions have been sent."}

    reset_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(hours=1),
        role=user.role,
        org_id=user.organization_id
    )

    try:
        send_password_reset_email(user.email, user.name, reset_token)
    except Exception as e:
        print(f"Error sending password reset email: {e}")

    return {
        "message": "Password reset token generated and email sent successfully!",
        "reset_token": reset_token
    }

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verifies reset token and updates user password."""
    payload = verify_token(request.token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token.")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token payload.")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    if not request.new_password or len(request.new_password) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters long.")

    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password reset successfully! You can now sign in with your new password."}
