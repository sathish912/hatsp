import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.models.models import User, JobApplication, Interview, ApplicationStatus

def reset_student2():
    db = SessionLocal()
    try:
        cand = db.query(User).filter(User.email == "student2@hatsp.com").first()
        if cand:
            apps = db.query(JobApplication).filter(JobApplication.candidate_id == cand.id).all()
            for app in apps:
                app.status = ApplicationStatus.APPLIED.value
                # Remove pre-seeded interviews for clean workflow testing
                db.query(Interview).filter(Interview.application_id == app.id).delete()
            db.commit()
            print(f"[SUCCESS] Reset {len(apps)} applications for Student 2 (student2@hatsp.com) to APPLIED status.")
    finally:
        db.close()

if __name__ == "__main__":
    reset_student2()
