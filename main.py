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
import logging

# Ensure the project root is on the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import SQLAlchemyError

from config import load_dotenv_if_present, get_cors_settings
from database import engine, Base, SessionLocal, migrate_sqlite_answer_records_attempt_nullable
from routes import analysis, plan, test, questions, students, mood

load_dotenv_if_present()
from seed_data import seed_if_empty


# ─── Lifespan: startup/shutdown logic ────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup:
      - Create tables if they don't exist (safe on restarts)
      - Run lightweight SQLite migration if needed
      - Seed initial data ONLY if the database is empty (no duplicates)
    Shutdown: (nothing to clean up for SQLite / simple DB usage)
    """
    logger = logging.getLogger("eduadapt")

    # Create tables if missing (never drops data)
    Base.metadata.create_all(bind=engine)
    migrate_sqlite_answer_records_attempt_nullable(engine)

    # Seed only if empty (idempotent)
    db = SessionLocal()
    try:
        seeded = seed_if_empty(db)
        if seeded["seeded"]:
            logger.info(
                "Seeded initial data: %s questions; sample_student_id=%s",
                seeded["questions_inserted"],
                seeded["sample_student_id"],
            )
        else:
            logger.info("Skipping seed (%s)", seeded.get("reason", "not needed"))
    finally:
        db.close()

    yield  # App runs here

    # Shutdown (no cleanup needed)


# ─── App instance ────────────────────────────────────────────────────────────

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)

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

# ─── Basic request logging middleware ────────────────────────────────────────

class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logger = logging.getLogger("eduadapt.http")
        try:
            response = await call_next(request)
            logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
            return response
        except Exception:
            logger.exception("Unhandled error on %s %s", request.method, request.url.path)
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"},
            )

app.add_middleware(RequestLogMiddleware)

# ─── Error handlers (prevents ugly crashes) ──────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logging.getLogger("eduadapt").warning(
        "Validation error on %s %s: %s", request.method, request.url.path, exc.errors()
    )
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logging.getLogger("eduadapt").exception(
        "Database error on %s %s", request.method, request.url.path
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Database error"},
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


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
