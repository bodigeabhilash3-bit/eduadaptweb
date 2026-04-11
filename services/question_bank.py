"""
Question Bank Service — query and manage the question database.

Provides filtered access to questions by topic, difficulty, or both.
Also supports adding new questions and random sampling.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func

from models.db_models import Question
from models.schemas import AddQuestionRequest


def get_all_topics(db: Session) -> list[str]:
    """Get all unique topics in the question bank."""
    results = db.query(Question.topic).distinct().all()
    return [r[0] for r in results]


def get_questions_by_topic(
    db: Session, topic: str, limit: int = 50
) -> list[Question]:
    """Fetch questions filtered by topic."""
    return (
        db.query(Question)
        .filter(Question.topic == topic)
        .limit(limit)
        .all()
    )


def get_questions_by_difficulty(
    db: Session, difficulty: str, limit: int = 50
) -> list[Question]:
    """Fetch questions filtered by difficulty level."""
    return (
        db.query(Question)
        .filter(Question.difficulty == difficulty)
        .limit(limit)
        .all()
    )


def get_questions_by_topic_and_difficulty(
    db: Session, topic: str, difficulty: str, limit: int = 50
) -> list[Question]:
    """Fetch questions filtered by both topic AND difficulty."""
    return (
        db.query(Question)
        .filter(Question.topic == topic, Question.difficulty == difficulty)
        .limit(limit)
        .all()
    )


def get_random_questions(db: Session, limit: int = 10) -> list[Question]:
    """Fetch a random sample of questions (uses SQL random ordering)."""
    return (
        db.query(Question)
        .order_by(func.random())
        .limit(limit)
        .all()
    )


def get_question_by_id(db: Session, question_id: int) -> Question | None:
    """Fetch a single question by its ID."""
    return db.query(Question).filter(Question.id == question_id).first()


def get_questions_by_ids(db: Session, question_ids: list[int]) -> list[Question]:
    """Fetch multiple questions by their IDs."""
    return (
        db.query(Question)
        .filter(Question.id.in_(question_ids))
        .all()
    )


def add_question(db: Session, req: AddQuestionRequest) -> Question:
    """Add a new question to the bank."""
    question = Question(
        question_text=req.question_text,
        options=req.options,
        answer=req.answer,
        topic=req.topic,
        difficulty=req.difficulty.value,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


def get_question_count(db: Session) -> int:
    """Total number of questions in the bank."""
    return db.query(Question).count()


def get_question_count_by_topic_difficulty(
    db: Session, topic: str, difficulty: str
) -> int:
    """Count questions for a specific topic-difficulty combo."""
    return (
        db.query(Question)
        .filter(Question.topic == topic, Question.difficulty == difficulty)
        .count()
    )
