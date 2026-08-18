from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.models import User, Organization, SubscriptionPlan, Job, JobApplication, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of the following roles: {allowed_roles}"
            )
        return current_user
    return role_checker

def check_job_posting_subscription_limit(user: User, db: Session):
    if user.role not in [UserRole.RECRUITER.value, UserRole.HR_MANAGER.value, UserRole.COMPANY_ADMIN.value]:
        raise HTTPException(status_code=403, detail="Not authorized to post jobs")
        
    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    if org.subscription_plan == SubscriptionPlan.FREE.value:
        active_jobs_count = db.query(Job).filter(Job.organization_id == org.id).count()
        if active_jobs_count >= 5:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Free Plan limit reached (Maximum 5 job postings). Please upgrade to Pro Plan for unlimited job postings."
            )

def check_recruiter_subscription_limit(org_id: int, db: Session):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        return
    if org.subscription_plan == SubscriptionPlan.FREE.value:
        recruiters_count = db.query(User).filter(
            User.organization_id == org_id,
            User.role.in_([UserRole.RECRUITER.value, UserRole.HR_MANAGER.value])
        ).count()
        if recruiters_count >= 2:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Free Plan limit reached (Maximum 2 recruiters per company). Upgrade to Pro Plan to add more recruiters."
            )

def check_application_subscription_limit(job_id: int, db: Session):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    org = db.query(Organization).filter(Organization.id == job.organization_id).first()
    if org and org.subscription_plan == SubscriptionPlan.FREE.value:
        total_apps = db.query(JobApplication).join(Job).filter(Job.organization_id == org.id).count()
        if total_apps >= 100:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Free Plan application limit reached (Maximum 100 applications per company). Company needs to upgrade to Pro Plan."
            )
