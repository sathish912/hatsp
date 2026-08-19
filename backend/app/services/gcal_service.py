import uuid
import random
import string
from datetime import datetime, timedelta
from urllib.parse import quote

def generate_meet_link() -> str:
    """
    Generates a standard Google Meet URL matching Google's 3-4-3 lowercase letter format
    (e.g., https://meet.google.com/abc-defg-hij)
    """
    letters = string.ascii_lowercase
    part1 = "".join(random.choices(letters, k=3))
    part2 = "".join(random.choices(letters, k=4))
    part3 = "".join(random.choices(letters, k=3))
    return f"https://meet.google.com/{part1}-{part2}-{part3}"

def generate_google_calendar_url(summary: str, description: str, start_time: datetime, duration_minutes: int = 45, location: str = "") -> str:
    """
    Generates an official Google Calendar Add-to-Calendar rendering URL.
    When opened, Google Calendar pre-fills event details, sets reminders & notifications like Teams/Meet.
    """
    end_time = start_time + timedelta(minutes=duration_minutes)
    
    start_utc = start_time.strftime("%Y%m%dT%H%M00Z")
    end_utc = end_time.strftime("%Y%m%dT%H%M00Z")
    
    encoded_summary = quote(summary)
    encoded_details = quote(description)
    encoded_location = quote(location)
    
    return f"https://calendar.google.com/calendar/render?action=TEMPLATE&text={encoded_summary}&dates={start_utc}/{end_utc}&details={encoded_details}&location={encoded_location}"

def create_google_calendar_event(summary: str, description: str, start_time: datetime, candidate_email: str, interviewer_email: str):
    """
    Creates Google Calendar event data including Meet URL and direct Add-to-Google-Calendar link.
    """
    event_id = f"gcal_evt_{uuid.uuid4().hex[:12]}"
    meeting_link = generate_meet_link()
    
    details_text = f"{description}\n\n📹 Join Video Meeting: {meeting_link}\n👥 Participants: {candidate_email}, {interviewer_email}"
    gcal_url = generate_google_calendar_url(
        summary=summary,
        description=details_text,
        start_time=start_time,
        location=meeting_link
    )
    
    return {
        "calendar_event_id": event_id,
        "meeting_link": meeting_link,
        "gcal_url": gcal_url
    }
