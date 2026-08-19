import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE candidate_profiles ADD COLUMN experience_certificate_url VARCHAR(500) NULL;"))
            conn.commit()
            print("[SUCCESS] Added experience_certificate_url column to candidate_profiles table.")
        except Exception as e:
            print(f"[INFO] Column alter exception: {e}")

if __name__ == "__main__":
    migrate()
