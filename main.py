"""
EduAdapt — Personalized Entrance Exam Coach API

Main application entry point. This module:
    1. Creates the FastAPI app instance
    2. Configures CORS middleware for cross-origin access
    3. Registers all route modules
    4. Seeds the database on startup (if empty)
    5. Provides a health check endpoint

Run with:
    uvicorn main:app --reload --port 8000
"""

import sys
import os

# Ensure the project root is on the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import load_dotenv_if_present, get_cors_settings
from database import engine, Base, SessionLocal
from routes import analysis, plan, test, questions, students, mood

load_dotenv_if_present()
from seed_data import seed_questions, seed_sample_student


# ─── Lifespan: startup/shutdown logic ────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: Drop all tables, re-create them, and seed fresh data every time.
    This ensures a clean demo environment on each launch.
    Shutdown: (nothing to clean up for SQLite)
    """
    # Drop all existing tables so every launch starts fresh
    Base.metadata.drop_all(bind=engine)
    print("[RESET] Dropped all existing tables — starting fresh")

    # Re-create all tables
    Base.metadata.create_all(bind=engine)

    # Seed question bank and sample student
    db = SessionLocal()
    try:
        num_seeded = seed_questions(db)
        student_id = seed_sample_student(db)

        print(f"[OK] Seeded {num_seeded} questions into the question bank")
        if student_id:
            print(f"[OK] Created sample student with ID: {student_id}")
    finally:
        db.close()

    yield  # App runs here

    # Shutdown (no cleanup needed)


# ─── App instance ────────────────────────────────────────────────────────────

app = FastAPI(
    title="EduAdapt — Personalized Entrance Exam Coach",
    description=(
        "A scalable backend system for personalized entrance exam preparation. "
        "Analyzes student performance, detects weak areas, generates adaptive tests, "
        "and creates personalized 7-day study plans."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS Middleware ─────────────────────────────────────────────────────────
# Set EDUADAPT_CORS_ORIGINS for your teammate's dev server (see .env.example).
_cors_origins, _cors_credentials = get_cors_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_cors_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Routers ───────────────────────────────────────────────────────

app.include_router(analysis.router)
app.include_router(plan.router)
app.include_router(test.router)
app.include_router(questions.router)
app.include_router(students.router)
app.include_router(mood.router)


# ─── Health Check ────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def health_check():
    """
    Health check endpoint.
    Returns basic API info and available endpoints.
    """
    return {
        "status": "healthy",
        "app": "EduAdapt — Personalized Entrance Exam Coach",
        "version": "1.0.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "endpoints": {
            "GET /students": "List students (UI profile picker)",
            "POST /students": "Create student — use returned id elsewhere",
            "GET /students/{id}/performance": "Cached weak topics & accuracies",
            "POST /analyze": "Analyze student test performance",
            "POST /generate-plan": "Generate 7-day personalized study plan",
            "GET /daily-test": "Get adaptive daily test",
            "POST /submit-test": "Submit test answers for evaluation",
            "GET /questions": "Browse question bank",
            "POST /questions": "Add question to bank",
            "GET /questions/count": "Get total question count",
            "GET /docs": "Interactive API documentation (Swagger UI)",
        },
    }
