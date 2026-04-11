"""
SQLAlchemy ORM models — define the database schema.

Tables:
    - students: Basic student profiles
    - questions: Question bank with topic/difficulty metadata
    - test_attempts: Records of each test session
    - answer_records: Per-question results for analysis
    - student_performance: Cached weak-area snapshots for fast lookup
"""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class Student(Base):
    """Student profile — minimal for prototype, extensible for production."""
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), nullable=True)
    phone = Column(String(20), nullable=True)
    stream = Column(String(10), nullable=True)  # MPC or BIPC
    mood = Column(String(20), default="okay")  # focused, okay, confused, tired, frustrated
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    test_attempts = relationship("TestAttempt", back_populates="student")
    answer_records = relationship("AnswerRecord", back_populates="student")
    performance = relationship("StudentPerformance", back_populates="student", uselist=False)
    mood_logs = relationship("MoodLog", back_populates="student")


class Question(Base):
    """
    Question bank entry.
    Options stored as JSON array: ["option_a", "option_b", "option_c", "option_d"]
    Answer is the correct option text (must match one of the options).
    """
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # List of 4 option strings
    answer = Column(String(500), nullable=False)  # Correct option text
    topic = Column(String(100), nullable=False, index=True)
    difficulty = Column(String(20), nullable=False, index=True)  # Easy, Medium, Hard


class TestAttempt(Base):
    """
    Records a full test session.
    Status tracks whether the test is in_progress or completed.
    question_ids stores which questions were included (JSON list of ints).
    """
    __tablename__ = "test_attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    question_ids = Column(JSON, nullable=False)  # List of question IDs in this test
    score = Column(Float, nullable=True)  # Filled after evaluation
    total_questions = Column(Integer, nullable=False)
    status = Column(String(20), default="in_progress")  # in_progress | completed

    # Relationships
    student = relationship("Student", back_populates="test_attempts")
    answers = relationship("AnswerRecord", back_populates="test_attempt")


class AnswerRecord(Base):
    """
    Per-question result — the core data unit for analysis.
    Each record captures whether the student got a specific question right,
    along with metadata (topic, difficulty, time) for analysis.
    """
    __tablename__ = "answer_records"

    id = Column(Integer, primary_key=True, index=True)
    # NULL when the row was created outside a test (e.g. POST /analyze import)
    attempt_id = Column(Integer, ForeignKey("test_attempts.id"), nullable=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    question_id = Column(Integer, nullable=False)
    topic = Column(String(100), nullable=False)
    difficulty = Column(String(20), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_taken = Column(Float, nullable=True)  # Seconds spent on this question
    student_answer = Column(String(500), nullable=True)  # What the student chose

    # Relationships
    student = relationship("Student", back_populates="answer_records")
    test_attempt = relationship("TestAttempt", back_populates="answers")


class StudentPerformance(Base):
    """
    Cached performance snapshot — updated after each test submission.
    Stores weak topics and accuracies as JSON so we don't recompute from scratch.
    """
    __tablename__ = "student_performance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True, nullable=False)
    weak_topics = Column(JSON, default=list)  # List of weak topic names
    topic_accuracies = Column(JSON, default=dict)  # {topic: accuracy_float}
    difficulty_accuracies = Column(JSON, default=dict)  # {difficulty: accuracy_float}
    overall_accuracy = Column(Float, default=0.0)
    total_questions_attempted = Column(Integer, default=0)
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    student = relationship("Student", back_populates="performance")


class MoodLog(Base):
    """Tracks mood changes over time for analytics and adaptive learning."""
    __tablename__ = "mood_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    mood = Column(String(20), nullable=False)  # focused, okay, confused, tired, frustrated
    context = Column(String(50), nullable=True)  # where mood was set: quiz, study, chat
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("Student", back_populates="mood_logs")
