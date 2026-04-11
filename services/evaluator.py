"""
Evaluation Engine — compares student answers with correct answers.

Responsibilities:
    1. Look up correct answers from the question bank
    2. Compare per-question and compute correctness
    3. Store detailed answer records in the DB
    4. Trigger the adaptive learning loop (re-analysis + update weak areas)
    5. Return structured results

This is the key integration point that closes the adaptive loop:
    submit → evaluate → re-analyze → update weaknesses → (next test adapts)
"""

from sqlalchemy.orm import Session

from models.db_models import TestAttempt, AnswerRecord, Question
from models.schemas import (
    SubmitTestRequest, SubmitTestResponse, QuestionResult
)
from services.llm_integration import explain_mistake, generate_feedback
from services.weak_areas import update_student_performance


def evaluate_test(
    db: Session,
    request: SubmitTestRequest,
) -> SubmitTestResponse:
    """
    Evaluate a submitted test and trigger the adaptive learning loop.

    Steps:
        1. Validate the test attempt exists and belongs to this student
        2. Fetch correct answers for all questions in the test
        3. Compare each answer, build result records
        4. Store AnswerRecords in DB
        5. Update TestAttempt with score and status
        6. Re-run analysis → update weak areas (adaptive loop)
        7. Return structured results

    Args:
        db: Database session
        request: Contains student_id, test_id, and answer mappings

    Returns:
        SubmitTestResponse with per-question results and updated weak topics

    Raises:
        ValueError: If test not found or doesn't belong to student
    """
    # Step 1: Validate test attempt
    attempt = (
        db.query(TestAttempt)
        .filter(
            TestAttempt.id == request.test_id,
            TestAttempt.student_id == request.student_id,
        )
        .first()
    )

    if not attempt:
        raise ValueError(
            f"Test attempt {request.test_id} not found for student {request.student_id}"
        )

    if attempt.status == "completed":
        raise ValueError(
            f"Test attempt {request.test_id} has already been submitted"
        )

    # Step 2: Fetch correct answers from question bank
    question_ids = attempt.question_ids
    questions = (
        db.query(Question)
        .filter(Question.id.in_(question_ids))
        .all()
    )
    question_map = {q.id: q for q in questions}

    # Step 3: Compare answers and build results
    results = []
    correct_count = 0
    answer_records = []

    for q_id in question_ids:
        q_id_str = str(q_id)
        question = question_map.get(q_id)

        if not question:
            continue  # Skip if question was deleted from bank

        student_answer = request.answers.get(q_id_str, "")
        is_correct = student_answer.strip() == question.answer.strip()

        if is_correct:
            correct_count += 1

        # Get time if provided
        time_taken = 0.0
        if request.time_per_question and q_id_str in request.time_per_question:
            time_taken = request.time_per_question[q_id_str]

        mistake_explanation = None
        if not is_correct:
            mistake_explanation = explain_mistake(
                question.question_text,
                student_answer,
                question.answer,
                question.topic,
            )

        # Build result for response
        results.append(QuestionResult(
            question_id=q_id,
            topic=question.topic,
            difficulty=question.difficulty,
            is_correct=is_correct,
            student_answer=student_answer,
            correct_answer=question.answer,
            explanation=mistake_explanation,
        ))

        # Build DB record
        answer_records.append(AnswerRecord(
            attempt_id=attempt.id,
            student_id=request.student_id,
            question_id=q_id,
            topic=question.topic,
            difficulty=question.difficulty,
            is_correct=is_correct,
            time_taken=time_taken,
            student_answer=student_answer,
        ))

    # Step 4: Store answer records
    db.add_all(answer_records)

    # Step 5: Update test attempt
    total = len(results)
    score = round(correct_count / total, 4) if total > 0 else 0.0
    attempt.score = score
    attempt.status = "completed"

    db.commit()

    # Step 6: ADAPTIVE LOOP — re-analyze and update weak areas
    updated_performance = update_student_performance(db, request.student_id)

    topic_acc = updated_performance.topic_accuracies or {}
    strong_topics = [t for t, acc in topic_acc.items() if acc >= 0.8]
    coaching = generate_feedback(
        updated_performance.overall_accuracy or 0.0,
        list(updated_performance.weak_topics or []),
        strong_topics,
        updated_performance.total_questions_attempted or 0,
    )

    return SubmitTestResponse(
        test_id=attempt.id,
        student_id=request.student_id,
        score=score,
        total_questions=total,
        correct_count=correct_count,
        results=results,
        updated_weak_topics=updated_performance.weak_topics or [],
        coaching_feedback=coaching,
    )
