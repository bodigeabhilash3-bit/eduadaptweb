"""
Students API — minimal profiles for UI onboarding and dashboards.

Core flows still use `student_id` on /analyze, /daily-test, etc.
The frontend should create or select a student, then pass `student_id`
into those endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from database import get_db
from models.db_models import Student, StudentPerformance
from models.schemas import CreateStudentRequest, StudentOut, StudentPerformanceSnapshot

router = APIRouter(tags=["Students"])
logger = logging.getLogger("eduadapt.routes.students")


@router.get("/students", response_model=list[StudentOut])
def list_students(db: Session = Depends(get_db)):
    """List all students (for login / profile picker in the UI)."""
    rows = db.query(Student).order_by(Student.id).all()
    return rows


@router.post("/students", response_model=StudentOut, status_code=201)
def create_student(request: CreateStudentRequest, db: Session = Depends(get_db)):
    """Register a new student; returns `id` to use with other endpoints."""
    try:
        student = Student(
            name=request.name.strip(),
            email=request.email,
            phone=request.phone,
            stream=request.stream,
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        return student
    except Exception:
        db.rollback()
        logger.exception("Failed to create student")
        raise HTTPException(status_code=500, detail="Failed to create student")


@router.get("/students/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    """Fetch one student by id."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")
    return student


@router.get("/students/{student_id}/performance", response_model=StudentPerformanceSnapshot)
def get_student_performance_snapshot(student_id: int, db: Session = Depends(get_db)):
    """
    Cached weak topics and accuracies — fast dashboard data without re-running analysis.
    Updated automatically after /submit-test and /analyze.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")

    perf = (
        db.query(StudentPerformance)
        .filter(StudentPerformance.student_id == student_id)
        .first()
    )
    if not perf:
        return StudentPerformanceSnapshot(
            student_id=student_id,
            weak_topics=[],
            overall_accuracy=0.0,
            total_questions_attempted=0,
            topic_accuracies={},
            difficulty_accuracies={},
            last_updated=None,
        )

    return StudentPerformanceSnapshot(
        student_id=student_id,
        weak_topics=list(perf.weak_topics or []),
        overall_accuracy=float(perf.overall_accuracy or 0.0),
        total_questions_attempted=int(perf.total_questions_attempted or 0),
        topic_accuracies=dict(perf.topic_accuracies or {}),
        difficulty_accuracies=dict(perf.difficulty_accuracies or {}),
        last_updated=perf.last_updated,
    )
