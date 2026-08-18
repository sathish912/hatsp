import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "HR Recruitment & Applicant Tracking SaaS"
    SECRET_KEY: str = "super-secret-jwt-key-change-in-production-hatsp"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = "mysql+pymysql://root:mysql%402026@localhost:3306/hatsp"

    # Stripe (Placeholder defaults to satisfy GitHub secret scanners; configure in local .env)
    STRIPE_SECRET_KEY: str = "sk_test_placeholder_key_for_stripe"
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_placeholder_key_for_stripe"
    STRIPE_WEBHOOK_SECRET: str = "whsec_mock_key"

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "noreply@example.com"
    SMTP_PASSWORD: str = "mock_password"
    SENDGRID_API_KEY: Optional[str] = ""
    EMAILS_FROM: str = "noreply@ats-saas.com"

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = "demo"
    CLOUDINARY_API_KEY: str = "mock_api_key"
    CLOUDINARY_API_SECRET: str = "mock_api_secret"

    # Google Calendar
    GOOGLE_CLIENT_ID: Optional[str] = ""
    GOOGLE_CLIENT_SECRET: Optional[str] = ""

    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
