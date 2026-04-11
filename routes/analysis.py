"""
Analysis API route — POST /analyze

Accepts student test data and returns structured performance insights.
Also stores the data as answer records and updates the student's
performance snapshot.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.schemas import AnalysisRequest, AnalysisResponse
from models.db_models import Student, AnswerRecord
from services.analysis import generate_full_analysis
from services.llm_integration import generate_feedback
from services.weak_areas import update_student_performance

router = APIRouter(tags=["Analysis"])


@router.post("/analyze", response_model=AnalysisResponse)
def analyze_performance(request: AnalysisRequest, db: Session = Depends(get_db)):
    """
    Analyze student test performance.

    Accepts a batch of test results and returns:
    - Per-topic accuracy, timing, and question counts
    - Per-difficulty accuracy
    - Overall accuracy
    - List of weak topics (accuracy < 60%)
    - Specific weak areas (topic + difficulty combos)

    Also persists the test data and updates the student's
    cached performance snapshot for use by other endpoints.
    """
    # Validate student exists
    student = db.query(Student).filter(Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {request.student_id} not found")

    # Store the test data as answer records (if not already from a test submission)
    # This allows /analyze to be used independently of the test flow
    for item in request.test_data:
        record = AnswerRecord(
            attempt_id=None,  # Not tied to a specific test attempt
            student_id=request.student_id,
            question_id=item.question_id,
            topic=item.topic,
            difficulty=item.difficulty.value,
            is_correct=item.is_correct,
            time_taken=item.time_taken,
        )
        db.add(record)
    db.commit()

    # Update cached performance
    update_student_performance(db, request.student_id)

    # Run analysis on the provided data
    analysis = generate_full_analysis(
        student_id=request.student_id,
        test_data=request.test_data,
    )

    strong_topics = [t.topic for t in analysis.topic_insights if t.accuracy >= 0.8]
    coaching = generate_feedback(
        analysis.overall_accuracy,
        analysis.weak_topics,
        strong_topics,
        analysis.total_questions,
    )
    return analysis.model_copy(update={"coaching_feedback": coaching})
