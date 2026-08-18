import os
from app.services.pdf_service import generate_offer_letter_pdf, generate_interview_schedule_pdf, generate_candidate_report_pdf

def test_pdf_generation_services():
    offer_path = generate_offer_letter_pdf(
        candidate_name="Alice Smith",
        job_title="Senior Product Manager",
        company_name="Innovate Tech",
        salary="$140,000 / year",
        joining_date="2026-09-01",
        filename="test_offer.pdf"
    )
    assert os.path.exists(offer_path)
    assert os.path.getsize(offer_path) > 0

    schedule_path = generate_interview_schedule_pdf(
        candidate_name="Alice Smith",
        job_title="Senior Product Manager",
        interviewer_name="Bob Manager",
        interview_date="2026-08-15 10:00 AM",
        meeting_link="https://meet.google.com/test-link",
        filename="test_schedule.pdf"
    )
    assert os.path.exists(schedule_path)
    assert os.path.getsize(schedule_path) > 0

    report_path = generate_candidate_report_pdf(
        candidate_name="Alice Smith",
        email="alice@example.com",
        phone="+1 555-0199",
        experience="6 years product management",
        skills="Agile, Roadmap, SQL, User Research",
        application_status="Selected",
        filename="test_report.pdf"
    )
    assert os.path.exists(report_path)
    assert os.path.getsize(report_path) > 0
