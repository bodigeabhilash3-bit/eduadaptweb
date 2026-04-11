"""
7-Day Study Plan Generator.

Creates a personalized study plan based on the student's weak areas.

Plan structure:
    Days 1–3: Deep focus on weakest topics (intensive practice)
    Days 4–5: Medium-weak topics + mixed review
    Days 6–7: Full revision + simulated practice tests

Each day includes:
    - focus_topics: which topics to study
    - practice_tasks: specific actionable tasks
    - test_recommendation: what kind of test to take that day
"""

from sqlalchemy.orm import Session

from models.schemas import (
    StudyPlanResponse, StudyPlanDay, PracticeTask, StudyResource, QuestionWithAnswer
)
from services.weak_areas import get_student_performance
from services.question_bank import (
    get_all_topics,
    get_questions_by_topic_and_difficulty,
    get_questions_by_topic,
)


def generate_7day_plan(
    db: Session,
    student_id: int,
) -> StudyPlanResponse:
    """
    Generate a personalized 7-day study plan.

    Algorithm:
        1. Fetch student's performance snapshot
        2. Sort topics by accuracy (weakest first)
        3. Assign topics to days based on weakness severity
        4. Generate specific practice tasks for each day
        5. Add test recommendations

    Args:
        db: Database session
        student_id: Student to generate plan for

    Returns:
        StudyPlanResponse with 7 days of study activities
    """
    performance = get_student_performance(db, student_id)
    all_topics = get_all_topics(db)

    if not performance or not performance.topic_accuracies:
        # Cold start — no history, generate a general plan
        return _generate_cold_start_plan(student_id, all_topics)

    # Sort topics by accuracy (weakest first)
    topic_accuracies = performance.topic_accuracies  # {topic: accuracy}
    sorted_topics = sorted(topic_accuracies.items(), key=lambda x: x[1])

    # Categorize topics
    weak_topics = [(t, acc) for t, acc in sorted_topics if acc < 0.6]
    medium_topics = [(t, acc) for t, acc in sorted_topics if 0.6 <= acc < 0.8]
    strong_topics = [(t, acc) for t, acc in sorted_topics if acc >= 0.8]

    # Ensure we have topics in each category for planning
    # If a category is empty, borrow from adjacent categories
    if not weak_topics and medium_topics:
        weak_topics = medium_topics[:1]
        medium_topics = medium_topics[1:]
    if not medium_topics and strong_topics:
        medium_topics = strong_topics[:1]
        strong_topics = strong_topics[1:]

    plan_days = []

    # ─── Days 1-3: Deep dive on weakest topics ───────────────────
    for day_num in range(1, 4):
        if weak_topics:
            # Rotate through weak topics
            topic, accuracy = weak_topics[(day_num - 1) % len(weak_topics)]
            focus = [topic]

            # Add a second weak topic if available and it's day 2 or 3
            if len(weak_topics) > 1 and day_num > 1:
                extra_topic = weak_topics[day_num % len(weak_topics)][0]
                if extra_topic not in focus:
                    focus.append(extra_topic)

            tasks = _generate_intensive_tasks(focus, accuracy)
            test_rec = f"Take a focused test on {', '.join(focus)} — emphasize Medium and Hard questions"
        else:
            focus = [t for t, _ in sorted_topics[:2]]
            tasks = _generate_review_tasks(focus)
            test_rec = f"Take a diagnostic test covering {', '.join(focus)}"

        tasks = _attach_questions_to_tasks(db, tasks)
        plan_days.append(StudyPlanDay(
            day=day_num,
            focus_topics=focus,
            practice_tasks=tasks,
            test_recommendation=test_rec,
            study_resources=_generate_study_resources(focus),
        ))

    # ─── Days 4-5: Medium-weak topics + mixed review ─────────────
    for day_num in range(4, 6):
        focus = []
        if medium_topics:
            topic, accuracy = medium_topics[(day_num - 4) % len(medium_topics)]
            focus.append(topic)
        if weak_topics:
            # Revisit weakest topic briefly
            focus.append(weak_topics[0][0])

        if not focus:
            focus = [t for t, _ in sorted_topics[:2]]

        # Remove duplicates while preserving order
        focus = list(dict.fromkeys(focus))

        tasks = _generate_mixed_tasks(focus)
        test_rec = f"Take a mixed-difficulty test covering {', '.join(focus)} — track time per question"

        tasks = _attach_questions_to_tasks(db, tasks)
        plan_days.append(StudyPlanDay(
            day=day_num,
            focus_topics=focus,
            practice_tasks=tasks,
            test_recommendation=test_rec,
            study_resources=_generate_study_resources(focus),
        ))

    # ─── Day 6: Full revision across all topics ──────────────────
    all_focus = [t for t, _ in sorted_topics[:4]]  # Top 4 topics by priority
    day6_tasks = [
        PracticeTask(
            task="Quick revision of key concepts and formulas",
            topic=t,
            question_count=5,
            difficulty_focus="Medium",
        )
        for t in all_focus
    ]
    day6_tasks = _attach_questions_to_tasks(db, day6_tasks)
    plan_days.append(StudyPlanDay(
        day=6,
        focus_topics=all_focus,
        practice_tasks=day6_tasks,
        test_recommendation="Take a comprehensive revision test with all topics — 15 questions, mixed difficulty",
        study_resources=_generate_study_resources(all_focus),
    ))

    # ─── Day 7: Simulated test + review ──────────────────────────
    plan_days.append(StudyPlanDay(
        day=7,
        focus_topics=[t for t, _ in sorted_topics],  # All topics
        practice_tasks=[
            PracticeTask(
                task="Take a full-length simulated practice test under timed conditions",
                topic="All Topics",
                question_count=15,
                difficulty_focus="Mixed",
            ),
            PracticeTask(
                task="Review all incorrect answers from this week's tests",
                topic="All Topics",
            ),
            PracticeTask(
                task="Identify remaining weak areas and note them for next week",
                topic="All Topics",
            ),
        ],
        test_recommendation="Full simulated exam — 15 questions, strict timing, all difficulty levels",
    ))

    weak_topic_names = [t for t, _ in weak_topics]

    return StudyPlanResponse(
        student_id=student_id,
        plan=plan_days,
        weak_topics_addressed=weak_topic_names,
        message=_generate_plan_message(weak_topic_names, performance.overall_accuracy),
    )


def _generate_intensive_tasks(topics: list[str], accuracy: float) -> list[PracticeTask]:
    """Generate deep-practice tasks for weak topics."""
    tasks = []
    for topic in topics:
        tasks.extend([
            PracticeTask(
                task=f"Study core concepts and theory for {topic}",
                topic=topic,
                difficulty_focus="Easy",
            ),
            PracticeTask(
                task=f"Solve 10 practice problems in {topic}, starting from Easy",
                topic=topic,
                question_count=10,
                difficulty_focus="Easy",
            ),
            PracticeTask(
                task=f"Attempt 5 Medium-difficulty {topic} problems with step-by-step solutions",
                topic=topic,
                question_count=5,
                difficulty_focus="Medium",
            ),
        ])
        # Add hard problems if accuracy isn't extremely low
        if accuracy >= 0.3:
            tasks.append(PracticeTask(
                task=f"Challenge: Try 3 Hard {topic} problems — focus on understanding, not speed",
                topic=topic,
                question_count=3,
                difficulty_focus="Hard",
            ))
    return tasks


def _generate_mixed_tasks(topics: list[str]) -> list[PracticeTask]:
    """Generate mixed-difficulty tasks for medium-weak topics."""
    tasks = []
    for topic in topics:
        tasks.extend([
            PracticeTask(
                task=f"Review key formulas and shortcuts for {topic}",
                topic=topic,
            ),
            PracticeTask(
                task=f"Solve 8 mixed-difficulty problems in {topic}",
                topic=topic,
                question_count=8,
                difficulty_focus="Mixed",
            ),
        ])
    return tasks


def _generate_review_tasks(topics: list[str]) -> list[PracticeTask]:
    """Generate light review tasks for general preparation."""
    return [
        PracticeTask(
            task=f"Quick review: Solve 5 problems in {topic}",
            topic=topic,
            question_count=5,
            difficulty_focus="Mixed",
        )
        for topic in topics
    ]


def _generate_cold_start_plan(
    student_id: int, all_topics: list[str]
) -> StudyPlanResponse:
    """
    Generate a generic diagnostic plan for students with no history.
    The first few days focus on taking diagnostic tests to establish baselines.
    """
    plan_days = []

    # Days 1-2: Diagnostic tests
    for day_num in range(1, 3):
        plan_days.append(StudyPlanDay(
            day=day_num,
            focus_topics=all_topics,
            practice_tasks=[
                PracticeTask(
                    task="Take a diagnostic test to assess your current level",
                    topic="All Topics",
                    question_count=12,
                    difficulty_focus="Mixed",
                ),
                PracticeTask(
                    task="Review your results and note which topics feel challenging",
                    topic="All Topics",
                ),
            ],
            test_recommendation="Take the daily adaptive test — this helps the system learn your strengths and weaknesses",
        ))

    # Days 3-7: General study
    topics_per_day = max(1, len(all_topics) // 5)
    for day_num in range(3, 8):
        day_idx = day_num - 3
        start = (day_idx * topics_per_day) % len(all_topics)
        day_topics = all_topics[start:start + topics_per_day] or all_topics[:2]

        plan_days.append(StudyPlanDay(
            day=day_num,
            focus_topics=day_topics,
            practice_tasks=_generate_review_tasks(day_topics),
            test_recommendation=f"Take a test focused on {', '.join(day_topics)}",
        ))

    return StudyPlanResponse(
        student_id=student_id,
        plan=plan_days,
        weak_topics_addressed=[],
        message="Welcome! Start by taking a few diagnostic tests so we can personalize your study plan. The more tests you take, the smarter your plan becomes!",
    )


def _generate_plan_message(weak_topics: list[str], overall_accuracy: float) -> str:
    """Generate a summary message for the study plan."""
    if not weak_topics:
        return (
            f"Great job! Your overall accuracy is {overall_accuracy:.0%}. "
            "This plan focuses on maintaining your strengths and pushing into harder territory."
        )

    accuracy_pct = f"{overall_accuracy:.0%}"
    topics_str = ", ".join(weak_topics[:3])
    extra = f" and {len(weak_topics) - 3} more" if len(weak_topics) > 3 else ""

    return (
        f"Your overall accuracy is {accuracy_pct}. "
        f"This week's plan targets your weak areas: {topics_str}{extra}. "
        "Days 1-3 focus on intensive practice, Days 4-5 on mixed review, "
        "and Days 6-7 on full revision and simulated testing. Let's go!"
    )


# ─── Study Resource Templates ───────────────────────────────────────────────

_TOPIC_RESOURCES: dict[str, list[dict]] = {
    "Mathematics": [
        {"title": "Algebraic Identities", "content": "Key identities:\n• (a+b)² = a² + 2ab + b²\n• (a-b)² = a² - 2ab + b²\n• a² - b² = (a+b)(a-b)\n• (a+b)³ = a³ + 3a²b + 3ab² + b³\n\nThese appear frequently in factoring and simplification problems.", "resource_type": "formula"},
        {"title": "Quadratic Equations", "content": "The quadratic formula: x = (-b ± √(b²-4ac)) / 2a\n\nDiscriminant D = b²-4ac:\n• D > 0: Two real distinct roots\n• D = 0: Two equal real roots\n• D < 0: No real roots (complex roots)\n\nFor roots α, β: Sum = -b/a, Product = c/a", "resource_type": "notes"},
        {"title": "Area & Perimeter Formulas", "content": "Circle: A = πr², C = 2πr\nTriangle: A = ½bh\nRectangle: A = lw, P = 2(l+w)\nSphere Volume: V = (4/3)πr³\nCone Volume: V = (1/3)πr²h", "resource_type": "formula"},
        {"title": "Pythagorean Theorem", "content": "In a right triangle: a² + b² = c²\n\nCommon triples: (3,4,5), (5,12,13), (8,15,17)\n\nTip: Always identify the hypotenuse (longest side, opposite the right angle).", "resource_type": "tip"},
    ],
    "Physics": [
        {"title": "Newton's Laws of Motion", "content": "1st Law (Inertia): Object at rest stays at rest unless acted upon by a force.\n2nd Law: F = ma (Force equals mass times acceleration)\n3rd Law: Every action has an equal and opposite reaction.\n\nKey: Always draw free-body diagrams.", "resource_type": "notes"},
        {"title": "Energy & Work Formulas", "content": "KE = ½mv²\nPE = mgh\nWork = F·d·cosθ\nPower = Work/Time\n\nConservation of Energy: Total energy is constant in an isolated system.", "resource_type": "formula"},
    ],
    "Chemistry": [
        {"title": "Periodic Table Trends", "content": "Across a period (left to right):\n• Atomic radius decreases\n• Ionization energy increases\n• Electronegativity increases\n\nDown a group:\n• Atomic radius increases\n• Ionization energy decreases\n• Metallic character increases", "resource_type": "notes"},
        {"title": "Chemical Bonding Tips", "content": "Ionic: Metal + Non-metal (electron transfer)\nCovalent: Non-metal + Non-metal (electron sharing)\nMetallic: Metal + Metal (electron sea)\n\nElectronegativity difference > 1.7 → Ionic bond", "resource_type": "tip"},
    ],
}


def _generate_study_resources(topics: list[str]) -> list[StudyResource]:
    """Generate study resources (notes, formulas, tips) for the given topics."""
    resources = []
    for topic in topics:
        templates = _TOPIC_RESOURCES.get(topic, [])
        for tmpl in templates:
            resources.append(StudyResource(
                topic=topic,
                title=tmpl["title"],
                content=tmpl["content"],
                resource_type=tmpl["resource_type"],
            ))
    return resources


def _attach_questions_to_tasks(
    db: Session, tasks: list[PracticeTask]
) -> list[PracticeTask]:
    """Attach actual questions from the question bank to practice tasks."""
    enriched = []
    for task in tasks:
        topic = task.topic
        difficulty = task.difficulty_focus
        count = task.question_count or 3

        if topic == "All Topics":
            enriched.append(task)
            continue

        # Query real questions from the bank
        if difficulty and difficulty not in ("Mixed",):
            questions = get_questions_by_topic_and_difficulty(
                db, topic, difficulty, limit=min(count, 5)
            )
        else:
            questions = get_questions_by_topic(db, topic, limit=min(count, 5))

        content_qs = [
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

        enriched.append(PracticeTask(
            task=task.task,
            topic=task.topic,
            question_count=task.question_count,
            difficulty_focus=task.difficulty_focus,
            content_questions=content_qs,
        ))

    return enriched
