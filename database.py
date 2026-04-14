"""
Database configuration module.
Uses DATABASE_URL to select SQLite/PostgreSQL.
SQLAlchemy handles ORM mapping and session management.
"""

import os
from sqlalchemy.engine import make_url
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

# Database URL (supports Render/Fly/etc). Defaults to local SQLite file.
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./eduadapt.db")


def _normalize_database_url(raw: str) -> str:
    """
    Render managed PostgreSQL often provides URLs like:
      postgres://user:pass@host:port/db

    SQLAlchemy expects:
      postgresql+psycopg://user:pass@host:port/db
    """
    url = raw.strip()
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://") :]
    return url


_db_url = make_url(_normalize_database_url(DATABASE_URL))

# Create engine with check_same_thread=False for FastAPI's async compatibility
_connect_args: dict = {}
if _db_url.drivername.startswith("sqlite"):
    _connect_args["check_same_thread"] = False
elif _db_url.drivername.startswith("postgresql"):
    # Render Postgres requires SSL on most plans. If `sslmode` isn't in the URL,
    # default to `require` to avoid connection failures.
    if "sslmode" not in (_db_url.query or {}):
        _connect_args["sslmode"] = "require"

engine = create_engine(
    _db_url,
    connect_args=_connect_args,
    pool_pre_ping=True,
    echo=False,  # Set True for SQL debug logging
)

# Session factory — each request gets its own session via dependency injection
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all ORM models
Base = declarative_base()


def migrate_sqlite_answer_records_attempt_nullable(engine) -> None:
    """
    SQLite does not change existing columns on create_all().
    Older DBs had answer_records.attempt_id NOT NULL; standalone /analyze rows need NULL.
    Rebuild the table once if attempt_id is still NOT NULL.
    """
    if not str(engine.url).startswith("sqlite"):
        return
    with engine.begin() as conn:
        exists = conn.execute(
            text(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name='answer_records'"
            )
        ).fetchone()
        if not exists:
            return
        cols = conn.execute(text("PRAGMA table_info(answer_records)")).fetchall()
        att = next((c for c in cols if c[1] == "attempt_id"), None)
        if att is None or att[3] == 0:
            return  # already nullable or unexpected schema

        conn.execute(
            text(
                """
                CREATE TABLE answer_records__new (
                    id INTEGER NOT NULL PRIMARY KEY,
                    attempt_id INTEGER,
                    student_id INTEGER NOT NULL,
                    question_id INTEGER NOT NULL,
                    topic VARCHAR(100) NOT NULL,
                    difficulty VARCHAR(20) NOT NULL,
                    is_correct BOOLEAN NOT NULL,
                    time_taken FLOAT,
                    student_answer VARCHAR(500),
                    FOREIGN KEY(attempt_id) REFERENCES test_attempts (id),
                    FOREIGN KEY(student_id) REFERENCES students (id)
                )
                """
            )
        )
        conn.execute(
            text(
                """
                INSERT INTO answer_records__new (
                    id, attempt_id, student_id, question_id, topic, difficulty,
                    is_correct, time_taken, student_answer
                )
                SELECT id, attempt_id, student_id, question_id, topic, difficulty,
                       is_correct, time_taken, student_answer
                FROM answer_records
                """
            )
        )
        conn.execute(text("DROP TABLE answer_records"))
        conn.execute(text("ALTER TABLE answer_records__new RENAME TO answer_records"))


def get_db():
    """
    FastAPI dependency that provides a database session.
    Ensures the session is properly closed after each request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
