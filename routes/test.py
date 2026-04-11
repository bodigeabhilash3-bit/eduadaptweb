"""
Test API routes:
    - GET  /daily-test   → Generate adaptive daily test
    - POST /submit-test  → Evaluate submitted test answers

These two endpoints form the core test loop:
    generate → student takes test → submit → evaluate → adapt → generate next
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models.schemas import (
    DailyTestResponse, SubmitTestRequest, SubmitTestResponse
)
from models.db_models import Student
from services.test_generator import generate_daily_test
from services.evaluator import evaluate_test

router = APIRouter(tags=["Tests"])


@router.get("/daily-test", response_model=DailyTestResponse)
def get_daily_test(
    student_id: int = Query(..., description="Student ID to generate test for"),
    num_questions: int = Query(12, ge=8, le=15, description="Number of questions (8-15)"),
    mood: str = Query("okay", description="Student mood: focused, okay, confused, tired, frustrated"),
    db: Session = Depends(get_db),
):
    """
    Generate an adaptive daily test for the student.

    - 60% questions from weak topics, 40% from strong topics
    - Difficulty mix adapts based on student mood
    - Avoids repeating questions from last 3 attempts
    - For new students, generates a balanced diagnostic test

    Mood affects difficulty distribution:
    - focused: 30% Easy, 40% Medium, 30% Hard (12 questions)
    - okay: 40% Easy, 40% Medium, 20% Hard (12 questions)
    - confused: 50% Easy, 40% Medium, 10% Hard (10 questions)
    - tired: 60% Easy, 40% Medium, 0% Hard (8 questions)
    - frustrated: 60% Easy, 30% Medium, 10% Hard (8 questions)

    Returns questions WITHOUT answers (answers are checked on submission).
    """
    # Validate student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

    test = generate_daily_test(db, student_id, num_questions, mood=mood)
    return test


@router.post("/submit-test", response_model=SubmitTestResponse)
def submit_test(request: SubmitTestRequest, db: Session = Depends(get_db)):
    """
    Submit answers for a test and receive evaluation results.

    This endpoint:
    1. Compares each answer with the correct answer
    2. Stores detailed answer records
    3. Updates the test attempt with a score
    4. Re-runs analysis to update weak areas (adaptive loop)
    5. Returns per-question results and updated weak topics

    The adaptive loop ensures the NEXT daily test will be
    tailored based on the updated performance data.
    """
    # Validate student exists
    student = db.query(Student).filter(Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {request.student_id} not found")

    try:
        result = evaluate_test(db, request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
