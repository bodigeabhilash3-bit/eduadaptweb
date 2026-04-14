"""
Question Bank API routes:
    - GET  /questions  → List/filter questions
    - POST /questions  → Add a new question

These are utility/admin endpoints for managing the question bank.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import logging

from database import get_db
from models.schemas import AddQuestionRequest, QuestionWithAnswer
from services.question_bank import (
    get_questions_by_topic,
    get_questions_by_difficulty,
    get_questions_by_topic_and_difficulty,
    get_random_questions,
    add_question,
    get_question_count,
)

router = APIRouter(tags=["Question Bank"])
logger = logging.getLogger("eduadapt.routes.questions")


@router.get("/questions", response_model=list[QuestionWithAnswer])
def list_questions(
    topic: Optional[str] = Query(None, description="Filter by topic"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty (Easy/Medium/Hard)"),
    limit: int = Query(50, ge=1, le=200, description="Maximum results"),
    db: Session = Depends(get_db),
):
    """
    List questions from the bank with optional filters.

    Supports filtering by:
    - topic only
    - difficulty only
    - both topic and difficulty
    - no filters (random selection)
    """
    if topic and difficulty:
        questions = get_questions_by_topic_and_difficulty(db, topic, difficulty, limit)
    elif topic:
        questions = get_questions_by_topic(db, topic, limit)
    elif difficulty:
        questions = get_questions_by_difficulty(db, difficulty, limit)
    else:
        questions = get_random_questions(db, limit)

    return [
        QuestionWithAnswer(
            id=q.id,
            question_text=q.question_text,
            options=q.options,
            answer=q.answer,
            topic=q.topic,
            difficulty=q.difficulty,
        )
        for q in questions
    ]


@router.post("/questions", response_model=QuestionWithAnswer)
def create_question(request: AddQuestionRequest, db: Session = Depends(get_db)):
    """Add a new question to the question bank."""
    try:
        q = add_question(db, request)
        return QuestionWithAnswer(
            id=q.id,
            question_text=q.question_text,
            options=q.options,
            answer=q.answer,
            topic=q.topic,
            difficulty=q.difficulty,
        )
    except Exception:
        db.rollback()
        logger.exception("Failed to create question")
        from fastapi import HTTPException

        raise HTTPException(status_code=500, detail="Failed to create question")


@router.get("/questions/count")
def question_count(db: Session = Depends(get_db)):
    """Get the total number of questions in the bank."""
    count = get_question_count(db)
    return {"total_questions": count}
