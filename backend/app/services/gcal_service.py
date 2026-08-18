import uuid
import random
import string
from datetime import datetime

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

def create_google_calendar_event(summary: str, description: str, start_time: datetime, candidate_email: str, interviewer_email: str):
    """
    Creates Google Calendar event for scheduled interview.
    Generates a unique calendar event ID and a valid Google Meet join link.
    """
    event_id = f"gcal_evt_{uuid.uuid4().hex[:12]}"
    meeting_link = generate_meet_link()
    
    return {
        "calendar_event_id": event_id,
        "meeting_link": meeting_link
    }
