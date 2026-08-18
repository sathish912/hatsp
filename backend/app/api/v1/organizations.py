from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import Organization, User, UserRole
from app.schemas.schemas import OrganizationResponse, UserResponse
from app.api.deps import get_current_user, require_roles, check_recruiter_subscription_limit

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.get("/my-org", response_model=OrganizationResponse)
def get_my_organization(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.organization_id:
        raise HTTPException(status_code=404, detail="User is not associated with an organization")
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.get("/recruiters", response_model=List[UserResponse])
def get_org_recruiters(
    current_user: User = Depends(require_roles([UserRole.COMPANY_ADMIN.value, UserRole.HR_MANAGER.value])),
    db: Session = Depends(get_db)
):
    recruiters = db.query(User).filter(
        User.organization_id == current_user.organization_id,
        User.role.in_([UserRole.RECRUITER.value, UserRole.HR_MANAGER.value])
    ).all()
    
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    comp_name = org.company_name if org else None

    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            organization_id=u.organization_id,
            company_name=comp_name,
            created_at=u.created_at
        ) for u in recruiters
    ]
