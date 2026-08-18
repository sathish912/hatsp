import stripe
from fastapi import HTTPException
from app.core.config import settings

def create_stripe_checkout_session(org_id: int, company_name: str, plan: str, success_url: str, cancel_url: str, plan_price_inr: int = 7999):
    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    unit_amount_paise = (plan_price_inr if plan == 'Pro' else 0) * 100

    if settings.STRIPE_SECRET_KEY and (settings.STRIPE_SECRET_KEY.startswith("sk_test_") or settings.STRIPE_SECRET_KEY.startswith("sk_live_")) and not settings.STRIPE_SECRET_KEY.startswith("sk_test_mock"):
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'inr',
                        'product_data': {
                            'name': f'{company_name} - {plan} Subscription Plan',
                        },
                        'unit_amount': unit_amount_paise,
                        'recurring': {'interval': 'month'}
                    },
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{success_url}?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=cancel_url,
                client_reference_id=str(org_id)
            )
            return {"checkout_url": session.url, "session_id": session.id}
        except Exception as e:
            print(f"Stripe Checkout Session error: {e}")
            raise HTTPException(status_code=400, detail=f"Stripe API error: {str(e)}")
    
    # Fallback simulation response if mock key is configured
    mock_session_id = f"cs_test_mock_{org_id}_{plan.lower()}"
    mock_checkout_url = f"{success_url}?session_id={mock_session_id}&simulated=true"
    return {
        "checkout_url": mock_checkout_url,
        "session_id": mock_session_id
    }

def create_stripe_job_checkout_session(job_id: int, job_title: str, price_inr: int, success_url: str, cancel_url: str):
    """Creates a Stripe one-time payment Checkout Session for promoting a Job to Premium."""
    stripe.api_key = settings.STRIPE_SECRET_KEY
    unit_amount_paise = price_inr * 100

    if settings.STRIPE_SECRET_KEY and (settings.STRIPE_SECRET_KEY.startswith("sk_test_") or settings.STRIPE_SECRET_KEY.startswith("sk_live_")) and not settings.STRIPE_SECRET_KEY.startswith("sk_test_mock"):
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'inr',
                        'product_data': {
                            'name': f'Featured Premium Job Promotion: {job_title}',
                            'description': 'Highlight job posting at top of search results with 5x applicant reach'
                        },
                        'unit_amount': unit_amount_paise,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{success_url}?job_id={job_id}&session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=cancel_url,
                client_reference_id=str(job_id)
            )
            return {"checkout_url": session.url, "session_id": session.id}
        except Exception as e:
            print(f"Stripe Premium Job Checkout error: {e}")
            raise HTTPException(status_code=400, detail=f"Stripe API error: {str(e)}")
    
    mock_session_id = f"cs_test_job_mock_{job_id}"
    mock_checkout_url = f"{success_url}?job_id={job_id}&session_id={mock_session_id}&simulated=true"
    return {
        "checkout_url": mock_checkout_url,
        "session_id": mock_session_id
    }
