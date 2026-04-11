"""
Database configuration module.
Uses SQLite for lightweight, file-based storage.
SQLAlchemy handles ORM mapping and session management.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite database file stored alongside the app
DATABASE_URL = "sqlite:///./eduadapt.db"

# Create engine with check_same_thread=False for FastAPI's async compatibility
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite + FastAPI
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
