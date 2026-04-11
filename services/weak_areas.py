"""
Weak Area Detection & Persistence Service.

Identifies weak topics and topic-difficulty combinations, then
persists the results to the student_performance table for use
by the test generator and plan generator.

Threshold logic:
    - Topic accuracy < 60% → weak topic
    - (Topic, Difficulty) accuracy < 60% → specific weak area
"""

from datetime import datetime, timezone
from sqlalchemy.orm import Session

from models.db_models import AnswerRecord, StudentPerformance
from models.schemas import TestDataItem, Difficulty
from services.analysis import (
    compute_topic_stats,
    compute_difficulty_stats,
    compute_overall_accuracy,
)


def get_student_history_as_test_data(
    db: Session, student_id: int
) -> list[TestDataItem]:
    """
    Load ALL of a student's past answer records from the DB
    and convert them into TestDataItem objects for analysis.

    This gives us the complete picture across all tests,
    not just the most recent one.
    """
    records = (
        db.query(AnswerRecord)
        .filter(AnswerRecord.student_id == student_id)
        .all()
    )

    return [
        TestDataItem(
            question_id=r.question_id,
            topic=r.topic,
            difficulty=Difficulty(r.difficulty),
            is_correct=r.is_correct,
            time_taken=r.time_taken or 0.0,
        )
        for r in records
    ]


def update_student_performance(
    db: Session,
    student_id: int,
    weakness_threshold: float = 0.6,
) -> StudentPerformance:
    """
    Recompute and persist the student's performance snapshot.

    Called after every test submission to keep the cached
    performance data current. The test generator and plan
    generator read from this cache.

    Steps:
        1. Load all historical answer records
        2. Compute topic and difficulty accuracies
        3. Identify weak topics
        4. Upsert the student_performance row
    """
    # Get full history
    test_data = get_student_history_as_test_data(db, student_id)

    if not test_data:
        # No history yet — return empty performance
        perf = _get_or_create_performance(db, student_id)
        perf.weak_topics = []
        perf.topic_accuracies = {}
        perf.difficulty_accuracies = {}
        perf.overall_accuracy = 0.0
        perf.total_questions_attempted = 0
        perf.last_updated = datetime.now(timezone.utc)
        db.commit()
        db.refresh(perf)
        return perf

    # Compute stats
    topic_insights = compute_topic_stats(test_data)
    difficulty_insights = compute_difficulty_stats(test_data)
    overall = compute_overall_accuracy(test_data)

    # Build lookup dicts
    topic_accuracies = {t.topic: t.accuracy for t in topic_insights}
    difficulty_accuracies = {d.difficulty: d.accuracy for d in difficulty_insights}
    weak_topics = [t.topic for t in topic_insights if t.accuracy < weakness_threshold]

    # Persist
    perf = _get_or_create_performance(db, student_id)
    perf.weak_topics = weak_topics
    perf.topic_accuracies = topic_accuracies
    perf.difficulty_accuracies = difficulty_accuracies
    perf.overall_accuracy = overall
    perf.total_questions_attempted = len(test_data)
    perf.last_updated = datetime.now(timezone.utc)

    db.commit()
    db.refresh(perf)
    return perf


def get_student_performance(db: Session, student_id: int) -> StudentPerformance | None:
    """Retrieve cached performance data for a student."""
    return (
        db.query(StudentPerformance)
        .filter(StudentPerformance.student_id == student_id)
        .first()
    )


def _get_or_create_performance(db: Session, student_id: int) -> StudentPerformance:
    """Get existing performance row or create a new one."""
    perf = get_student_performance(db, student_id)
    if perf is None:
        perf = StudentPerformance(
            student_id=student_id,
            weak_topics=[],
            topic_accuracies={},
            difficulty_accuracies={},
            overall_accuracy=0.0,
            total_questions_attempted=0,
        )
        db.add(perf)
        db.flush()  # Get the ID without committing
    return perf
