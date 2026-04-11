"""
Plan API route — POST /generate-plan

Generates a personalized 7-day study plan based on the student's
current weak areas and performance history.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.schemas import GeneratePlanRequest, StudyPlanResponse
from models.db_models import Student
from services.plan_generator import generate_7day_plan

router = APIRouter(tags=["Study Plan"])


@router.post("/generate-plan", response_model=StudyPlanResponse)
def create_study_plan(request: GeneratePlanRequest, db: Session = Depends(get_db)):
    """
    Generate a personalized 7-day study plan.

    The plan is based on the student's current performance snapshot:
    - Weak topics get intensive focus on Days 1-3
    - Medium topics get mixed practice on Days 4-5
    - Days 6-7 are for full revision and simulated testing

    If the student has no history, a general diagnostic plan is returned.
    """
    # Validate student exists
    student = db.query(Student).filter(Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {request.student_id} not found")

    plan = generate_7day_plan(db, request.student_id)
    return plan
