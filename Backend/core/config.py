from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    APP_NAME: str = "Gestion des Incidents"
    SECRET_KEY: str = "changez-cette-cle-en-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    DATABASE_URL: str = "sqlite:///./incidents.db"
    UPLOAD_DIR: str = "uploads"
    REPORTS_DIR: str = "reports"

    class Config:
        env_file = ".env"

settings = Settings()

# Post-processing to resolve relative paths against BASE_DIR
if settings.DATABASE_URL.startswith("sqlite:///."):
    db_relative_path = settings.DATABASE_URL.replace("sqlite:///.", "").lstrip("/")
    settings.DATABASE_URL = f"sqlite:///{os.path.join(settings.BASE_DIR, db_relative_path)}"

if not os.path.isabs(settings.UPLOAD_DIR):
    settings.UPLOAD_DIR = os.path.abspath(os.path.join(settings.BASE_DIR, settings.UPLOAD_DIR))

if not os.path.isabs(settings.REPORTS_DIR):
    settings.REPORTS_DIR = os.path.abspath(os.path.join(settings.BASE_DIR, settings.REPORTS_DIR))