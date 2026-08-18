import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from app.core.config import settings

logger = logging.getLogger("email_service")
logger.setLevel(logging.INFO)

def send_email(to_email: str, subject: str, html_content: str):
    logger.info(f"[EMAIL NOTIFICATION] To: {to_email} | Subject: {subject}")
    
    # 1. Try SendGrid API if key configured
    if settings.SENDGRID_API_KEY and settings.SENDGRID_API_KEY.startswith("SG."):
        try:
            url = "https://api.sendgrid.com/v3/mail/send"
            headers = {
                "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
                "Content-Type": "application/json"
            }
            data = {
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": settings.EMAILS_FROM},
                "subject": subject,
                "content": [{"type": "text/html", "value": html_content}]
            }
            res = requests.post(url, json=data, headers=headers, timeout=5)
            if res.status_code in [200, 202]:
                logger.info(f"SendGrid email sent to {to_email}")
                return True
        except Exception as e:
            logger.error(f"SendGrid email error: {e}")

    # 2. Try SMTP if credentials provided
    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD != "mock_password":
        try:
            msg = MIMEMultipart()
            msg['From'] = settings.EMAILS_FROM
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(html_content, 'html'))
            
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            logger.info(f"SMTP email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"SMTP email error: {e}")

    # Fallback to dev log notification (Ensures application runs seamlessly without external SMTP dependencies in local dev)
    print(f"\n=======================================================")
    print(f"📧 [DEV EMAIL MOCK SENT]")
    print(f"TO: {to_email}")
    print(f"SUBJECT: {subject}")
    print(f"CONTENT SUMMARY: {html_content[:150]}...")
    print(f"=======================================================\n")
    return True

def send_welcome_email(user_name: str, user_email: str, role: str):
    subject = f"Welcome to our HR ATS Platform, {user_name}!"
    content = f"""
    <h2>Welcome to HR Recruitment & ATS Platform!</h2>
    <p>Hi {user_name},</p>
    <p>Your account has been registered successfully as a <b>{role.title()}</b>.</p>
    <p>Log in to your dashboard to manage your recruitment activities.</p>
    """
    send_email(user_email, subject, content)

def send_application_received_email(candidate_email: str, candidate_name: str, job_title: str):
    subject = f"Application Received: {job_title}"
    content = f"""
    <h3>Application Confirmation</h3>
    <p>Hi {candidate_name},</p>
    <p>We have successfully received your application for <b>{job_title}</b>.</p>
    <p>You can track the status of your application anytime on your Candidate Dashboard.</p>
    """
    send_email(candidate_email, subject, content)

def send_shortlisted_email(candidate_email: str, candidate_name: str, job_title: str):
    subject = f"Good News! You have been Shortlisted for {job_title}"
    content = f"""
    <h3>Congratulations!</h3>
    <p>Hi {candidate_name},</p>
    <p>Great news! Your profile for <b>{job_title}</b> has been shortlisted by our recruitment team.</p>
    <p>Our team will reach out shortly to schedule an interview.</p>
    """
    send_email(candidate_email, subject, content)

def send_interview_invitation_email(candidate_email: str, candidate_name: str, job_title: str, interview_date: str, meeting_link: str):
    subject = f"Interview Invitation for {job_title}"
    content = f"""
    <h3>Interview Scheduled</h3>
    <p>Hi {candidate_name},</p>
    <p>You have been invited for an interview for the role of <b>{job_title}</b>.</p>
    <p><b>Date & Time:</b> {interview_date}</p>
    <p><b>Meeting Link:</b> <a href="{meeting_link}">{meeting_link}</a></p>
    """
    send_email(candidate_email, subject, content)

def send_offer_letter_email(candidate_email: str, candidate_name: str, job_title: str, offer_pdf_url: str):
    subject = f"Official Offer Letter: {job_title}"
    content = f"""
    <h3>Congratulations on your Offer!</h3>
    <p>Hi {candidate_name},</p>
    <p>We are delighted to extend a formal offer of employment for <b>{job_title}</b>.</p>
    <p>Please log in to your candidate dashboard to view and respond to your offer letter.</p>
    """
    send_email(candidate_email, subject, content)

def send_rejection_email(candidate_email: str, candidate_name: str, job_title: str):
    subject = f"Update regarding your application for {job_title}"
    content = f"""
    <p>Hi {candidate_name},</p>
    <p>Thank you for taking the time to apply for <b>{job_title}</b>. Although we were impressed with your background, we have decided to move forward with other candidates whose experience more closely matches our requirements at this time.</p>
    <p>We wish you the best in your job search!</p>
    """
    send_email(candidate_email, subject, content)

def send_password_reset_email(user_email: str, user_name: str, reset_token: str):
    subject = "HirePulse Account Password Reset Request"
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    content = f"""
    <h2>HirePulse Password Reset Request</h2>
    <p>Hi {user_name},</p>
    <p>We received a request to reset your account password.</p>
    <p>Use the following Reset Token to create a new password:</p>
    <p style="font-size: 18px; font-weight: bold; color: #3B82F6; background: #0F172A; padding: 10px; border-radius: 8px; text-align: center;">{reset_token}</p>
    <p>Or click this link: <a href="{reset_url}">{reset_url}</a></p>
    <p>If you did not request a password reset, please ignore this email.</p>
    """
    send_email(user_email, subject, content)
