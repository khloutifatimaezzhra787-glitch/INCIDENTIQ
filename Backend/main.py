from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import init_db

from core.config import settings
import os
from routers import auth, incidents, notifications, rapports, categories, users




app = FastAPI(title=settings.APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)

app.include_router(auth.router)
app.include_router(incidents.router)
app.include_router(notifications.router)
app.include_router(rapports.router)
app.include_router(categories.router)
app.include_router(users.router)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def root():
    return {"message": "API Gestion des Incidents", "version": "1.0.0"}
