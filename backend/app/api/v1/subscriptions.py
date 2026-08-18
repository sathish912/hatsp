from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.models import Organization, Subscription, SubscriptionPlan, SubscriptionStatus, User, UserRole
from app.schemas.schemas import SubscriptionResponse, AdminPlanUpdate
from app.api.deps import get_current_user, require_roles
from app.services.stripe_service import create_stripe_checkout_session
from app.core.config import settings

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.get("/current", response_model=SubscriptionResponse)
def get_current_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.organization_id:
        raise HTTPException(status_code=404, detail="User does not belong to an organization")
    
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    sub = db.query(Subscription).filter(Subscription.organization_id == org.id, Subscription.status == SubscriptionStatus.ACTIVE.value).first()
    
    if not sub:
        sub = Subscription(
            organization_id=org.id,
            plan=org.subscription_plan or SubscriptionPlan.FREE.value,
            status=SubscriptionStatus.ACTIVE.value
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)
        
    return sub

@router.post("/create-checkout-session")
def create_checkout(
    plan: str = "Pro",
    current_user: User = Depends(require_roles([UserRole.COMPANY_ADMIN.value, UserRole.RECRUITER.value, UserRole.HR_MANAGER.value])),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    success_url = f"{settings.FRONTEND_URL}/subscription/success"
    cancel_url = f"{settings.FRONTEND_URL}/subscription"

    session_res = create_stripe_checkout_session(
        org_id=org.id,
        company_name=org.company_name,
        plan=plan,
        success_url=success_url,
        cancel_url=cancel_url,
        plan_price_inr=getattr(org, 'pro_plan_price', 7999) or 7999
    )

    return session_res

@router.post("/confirm-upgrade")
def confirm_upgrade(
    session_id: str,
    current_user: User = Depends(require_roles([UserRole.COMPANY_ADMIN.value, UserRole.RECRUITER.value, UserRole.HR_MANAGER.value])),
    db: Session = Depends(get_db)
):
    """Upgrades organization plan to Pro on Stripe session confirmation."""
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    org.subscription_plan = SubscriptionPlan.PRO.value
    
    # Update active subscription record
    sub = db.query(Subscription).filter(Subscription.organization_id == org.id).first()
    if not sub:
        sub = Subscription(organization_id=org.id, plan=SubscriptionPlan.PRO.value, status=SubscriptionStatus.ACTIVE.value)
        db.add(sub)
    else:
        sub.plan = SubscriptionPlan.PRO.value
        sub.status = SubscriptionStatus.ACTIVE.value
        sub.expiry_date = datetime.utcnow() + timedelta(days=365)

    db.commit()
    return {"message": "Subscription upgraded to Pro successfully!", "plan": "Pro"}

@router.put("/admin-update-plan")
def admin_update_plan(
    update_in: AdminPlanUpdate,
    current_user: User = Depends(require_roles([UserRole.COMPANY_ADMIN.value, UserRole.HR_MANAGER.value])),
    db: Session = Depends(get_db)
):
    """Allows Company Admin / HR Manager to directly update & edit organization subscription plan and price."""
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if update_in.plan not in [SubscriptionPlan.FREE.value, SubscriptionPlan.PRO.value]:
        raise HTTPException(status_code=400, detail="Invalid plan. Must be 'Free' or 'Pro'")

    org.subscription_plan = update_in.plan
    if update_in.pro_plan_price is not None and update_in.pro_plan_price >= 0:
        org.pro_plan_price = update_in.pro_plan_price

    sub = db.query(Subscription).filter(Subscription.organization_id == org.id).first()
    if not sub:
        sub = Subscription(organization_id=org.id, plan=update_in.plan, status=update_in.status or SubscriptionStatus.ACTIVE.value)
        db.add(sub)
    else:
        sub.plan = update_in.plan
        sub.status = update_in.status or SubscriptionStatus.ACTIVE.value
        if update_in.plan == SubscriptionPlan.PRO.value:
            sub.expiry_date = datetime.utcnow() + timedelta(days=365)

    db.commit()
    return {
        "message": f"Organization subscription plan updated to {update_in.plan} (₹{org.pro_plan_price}/mo) successfully!",
        "company_name": org.company_name,
        "plan": org.subscription_plan,
        "pro_plan_price": org.pro_plan_price
    }
