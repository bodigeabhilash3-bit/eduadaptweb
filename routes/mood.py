"""
Mood API — update & query the student's emotional state.

Mood drives the adaptive difficulty engine:
    focused     → full-difficulty mix
    okay        → slightly easier
    confused    → much easier + tutorials
    tired       → fewer questions + easy/medium
    frustrated  → confidence-boost mode

Endpoints:
    POST /mood              Update mood (also logs it)
    GET  /mood/{student_id} Current mood
    GET  /mood/{student_id}/history  Recent mood log
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from database import get_db
from models.db_models import Student, MoodLog
from models.schemas import UpdateMoodRequest, MoodResponse, MoodLogEntry

router = APIRouter(tags=["Mood"])
logger = logging.getLogger("eduadapt.routes.mood")

# Mood → pet message mapping
_MOOD_MESSAGES: dict[str, str] = {
    "focused": "You're on fire! 🔥 Let's tackle harder problems!",
    "okay": "Doing well! Keep going! 💪",
    "confused": "That's okay! Let me make things simpler 🌟",
    "tired": "Let's take it easy. How about a fun video? 🎬",
    "frustrated": "Let's try some easier ones to build confidence! 🌈",
}


@router.post("/mood", response_model=MoodResponse)
def update_mood(request: UpdateMoodRequest, db: Session = Depends(get_db)):
    """Update a student's current mood and log the change."""
    student = db.query(Student).filter(Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    try:
        student.mood = request.mood.value
        db.add(MoodLog(
            student_id=request.student_id,
            mood=request.mood.value,
            context=request.context,
        ))
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to update mood")
        raise HTTPException(status_code=500, detail="Failed to update mood")

    return MoodResponse(
        student_id=request.student_id,
        mood=request.mood.value,
        message=_MOOD_MESSAGES.get(request.mood.value, "Let's keep learning!"),
    )


@router.get("/mood/{student_id}", response_model=MoodResponse)
def get_mood(student_id: int, db: Session = Depends(get_db)):
    """Get a student's current mood."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    mood = student.mood or "okay"
    return MoodResponse(
        student_id=student_id,
        mood=mood,
        message=_MOOD_MESSAGES.get(mood, "Let's keep learning!"),
    )


@router.get("/mood/{student_id}/history", response_model=list[MoodLogEntry])
def get_mood_history(student_id: int, limit: int = 20, db: Session = Depends(get_db)):
    """Get a student's mood history (most recent first)."""
    logs = (
        db.query(MoodLog)
        .filter(MoodLog.student_id == student_id)
        .order_by(MoodLog.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        MoodLogEntry(mood=log.mood, context=log.context, timestamp=log.timestamp)
        for log in logs
    ]
