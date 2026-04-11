"""
Adaptive Test Generator — creates personalized daily tests.

Distribution strategy:
    - 60% questions from WEAK topics
    - 40% questions from STRONG topics
    - Mixed difficulty: ~30% Easy, ~40% Medium, ~30% Hard

Cold start handling:
    - If no history exists, generate a balanced diagnostic test
    - Uses random sampling across all topics/difficulties

The generator avoids repeating questions the student has recently
answered by excluding question IDs from recent attempts.
"""

import random
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.db_models import Question, TestAttempt, AnswerRecord
from models.schemas import DailyTestResponse, QuestionOut
from services.weak_areas import get_student_performance


def generate_daily_test(
    db: Session,
    student_id: int,
    num_questions: int = 12,
    mood: str | None = None,
) -> DailyTestResponse:
    """
    Generate an adaptive daily test for the student.

    Algorithm:
        1. Fetch student's performance snapshot (weak/strong topics)
        2. Adjust difficulty distribution based on mood
        3. Calculate question allocation: 60% weak, 40% strong
        4. For each allocation, distribute across difficulty levels
        5. Query questions, avoiding recent ones
        6. Create a TestAttempt record
        7. Return the test

    Args:
        db: Database session
        student_id: Student taking the test
        num_questions: Total questions (default 12, range 8-15)
        mood: Student's current mood (focused/okay/confused/tired/frustrated)

    Returns:
        DailyTestResponse with test_id and question list (no answers)
    """
    # Mood-based difficulty distribution and question count override
    mood_config = {
        "focused":    {"easy": 0.30, "medium": 0.40, "hard": 0.30, "count": 12},
        "okay":       {"easy": 0.40, "medium": 0.40, "hard": 0.20, "count": 12},
        "confused":   {"easy": 0.50, "medium": 0.40, "hard": 0.10, "count": 10},
        "tired":      {"easy": 0.60, "medium": 0.40, "hard": 0.00, "count": 8},
        "frustrated": {"easy": 0.60, "medium": 0.30, "hard": 0.10, "count": 8},
    }

    config = mood_config.get(mood, mood_config["okay"])
    num_questions = config["count"]
    num_questions = max(8, min(15, num_questions))  # Clamp to 8-15

    # Get performance data
    performance = get_student_performance(db, student_id)

    # Get recently answered question IDs (last 3 attempts) to avoid repeats
    recent_question_ids = _get_recent_question_ids(db, student_id, last_n_attempts=3)

    if performance and performance.weak_topics:
        # ── Adaptive mode: student has history ──
        questions = _generate_adaptive(
            db, performance, num_questions, recent_question_ids,
            easy_pct=config["easy"], medium_pct=config["medium"], hard_pct=config["hard"],
        )
    else:
        # ── Cold start: balanced diagnostic test ──
        questions = _generate_diagnostic(
            db, num_questions, recent_question_ids,
            easy_pct=config["easy"], medium_pct=config["medium"], hard_pct=config["hard"],
        )

    # Shuffle final question list for variety
    random.shuffle(questions)

    # Create test attempt record
    attempt = TestAttempt(
        student_id=student_id,
        question_ids=[q.id for q in questions],
        total_questions=len(questions),
        status="in_progress",
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # Convert to response format (no answers exposed)
    question_out = [
        QuestionOut(
            id=q.id,
            question_text=q.question_text,
            options=q.options,
            topic=q.topic,
            difficulty=q.difficulty,
        )
        for q in questions
    ]

    return DailyTestResponse(
        test_id=attempt.id,
        student_id=student_id,
        total_questions=len(question_out),
        questions=question_out,
    )


def _generate_adaptive(
    db: Session,
    performance,
    num_questions: int,
    exclude_ids: set[int],
    easy_pct: float = 0.3,
    medium_pct: float = 0.4,
    hard_pct: float = 0.3,
) -> list[Question]:
    """
    Generate questions with 60/40 weak/strong split.

    For each category (weak/strong), further split by difficulty
    using the provided percentages (configurable via mood).
    """
    weak_topics = performance.weak_topics or []
    all_topics = [t[0] for t in db.query(Question.topic).distinct().all()]
    strong_topics = [t for t in all_topics if t not in weak_topics]

    # If everything is weak or strong, adjust
    if not weak_topics:
        weak_topics = all_topics[:2]  # Make first 2 "weak" for variety
        strong_topics = all_topics[2:]
    if not strong_topics:
        strong_topics = weak_topics[-2:]  # Promote last 2 to "strong"

    # Allocate counts
    weak_count = round(num_questions * 0.6)
    strong_count = num_questions - weak_count

    # Fetch questions for each category
    weak_questions = _fetch_mixed_difficulty(
        db, weak_topics, weak_count, exclude_ids,
        easy_pct=easy_pct, medium_pct=medium_pct, hard_pct=hard_pct,
    )
    strong_questions = _fetch_mixed_difficulty(
        db, strong_topics, strong_count, exclude_ids,
        easy_pct=easy_pct, medium_pct=medium_pct, hard_pct=hard_pct,
    )

    combined = weak_questions + strong_questions

    # If we didn't get enough, fill with random questions
    if len(combined) < num_questions:
        shortfall = num_questions - len(combined)
        combined_ids = {q.id for q in combined} | exclude_ids
        fillers = (
            db.query(Question)
            .filter(Question.id.notin_(combined_ids))
            .order_by(func.random())
            .limit(shortfall)
            .all()
        )
        combined.extend(fillers)

    return combined[:num_questions]


def _generate_diagnostic(
    db: Session,
    num_questions: int,
    exclude_ids: set[int],
    easy_pct: float = 0.3,
    medium_pct: float = 0.4,
    hard_pct: float = 0.3,
) -> list[Question]:
    """
    Generate a balanced diagnostic test for cold-start students.
    Equal distribution across all topics and difficulties.
    """
    all_topics = [t[0] for t in db.query(Question.topic).distinct().all()]
    return _fetch_mixed_difficulty(
        db, all_topics, num_questions, exclude_ids,
        easy_pct=easy_pct, medium_pct=medium_pct, hard_pct=hard_pct,
    )


def _fetch_mixed_difficulty(
    db: Session,
    topics: list[str],
    count: int,
    exclude_ids: set[int],
    easy_pct: float = 0.3,
    medium_pct: float = 0.4,
    hard_pct: float = 0.3,
) -> list[Question]:
    """
    Fetch `count` questions from the given topics with mixed difficulty.
    Distribution configurable via mood system.
    """
    easy_count = max(0, round(count * easy_pct))
    hard_count = max(0, round(count * hard_pct))
    medium_count = count - easy_count - hard_count

    results = []

    for difficulty, target in [("Easy", easy_count), ("Medium", medium_count), ("Hard", hard_count)]:
        query = (
            db.query(Question)
            .filter(
                Question.topic.in_(topics),
                Question.difficulty == difficulty,
            )
        )
        if exclude_ids:
            query = query.filter(Question.id.notin_(exclude_ids))

        fetched = query.order_by(func.random()).limit(target).all()
        results.extend(fetched)

    return results


def _get_recent_question_ids(
    db: Session, student_id: int, last_n_attempts: int = 3
) -> set[int]:
    """
    Get question IDs from the student's most recent N test attempts.
    Used to avoid repeating questions in consecutive tests.
    """
    recent_attempts = (
        db.query(TestAttempt)
        .filter(TestAttempt.student_id == student_id)
        .order_by(TestAttempt.timestamp.desc())
        .limit(last_n_attempts)
        .all()
    )

    question_ids = set()
    for attempt in recent_attempts:
        if attempt.question_ids:
            question_ids.update(attempt.question_ids)

    return question_ids
