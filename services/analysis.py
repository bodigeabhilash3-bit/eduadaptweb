"""
Error Analysis Engine — the core computation module.

All functions are stateless and operate on lists of TestDataItem.
No LLM calls, no side effects — pure mathematical analysis.

Key computations:
    - Per-topic accuracy, average time, correct/incorrect counts
    - Per-difficulty accuracy
    - Overall accuracy
"""

from collections import defaultdict
from models.schemas import (
    TestDataItem, TopicInsight, DifficultyInsight, AnalysisResponse, WeakAreaDetail
)


def compute_topic_stats(test_data: list[TestDataItem]) -> list[TopicInsight]:
    """
    Compute accuracy and timing stats grouped by topic.

    Algorithm:
        1. Group all records by topic
        2. For each topic, count correct/total and average time
        3. Return sorted by accuracy (weakest first)

    Args:
        test_data: List of individual question results

    Returns:
        List of TopicInsight objects, sorted ascending by accuracy
    """
    # Accumulate stats per topic
    topic_stats: dict[str, dict] = defaultdict(
        lambda: {"correct": 0, "total": 0, "total_time": 0.0}
    )

    for item in test_data:
        stats = topic_stats[item.topic]
        stats["total"] += 1
        stats["total_time"] += item.time_taken
        if item.is_correct:
            stats["correct"] += 1

    # Build insight objects
    insights = []
    for topic, stats in topic_stats.items():
        total = stats["total"]
        correct = stats["correct"]
        accuracy = correct / total if total > 0 else 0.0

        insights.append(TopicInsight(
            topic=topic,
            accuracy=round(accuracy, 4),
            avg_time=round(stats["total_time"] / total, 2) if total > 0 else 0.0,
            total_questions=total,
            correct=correct,
            incorrect=total - correct,
        ))

    # Sort by accuracy ascending — weakest topics first
    insights.sort(key=lambda x: x.accuracy)
    return insights


def compute_difficulty_stats(test_data: list[TestDataItem]) -> list[DifficultyInsight]:
    """
    Compute accuracy grouped by difficulty level.

    Returns insights for Easy, Medium, Hard in that order.
    """
    difficulty_stats: dict[str, dict] = defaultdict(
        lambda: {"correct": 0, "total": 0}
    )

    for item in test_data:
        stats = difficulty_stats[item.difficulty.value]
        stats["total"] += 1
        if item.is_correct:
            stats["correct"] += 1

    # Fixed ordering: Easy → Medium → Hard
    order = ["Easy", "Medium", "Hard"]
    insights = []
    for diff in order:
        if diff in difficulty_stats:
            stats = difficulty_stats[diff]
            total = stats["total"]
            correct = stats["correct"]
            insights.append(DifficultyInsight(
                difficulty=diff,
                accuracy=round(correct / total, 4) if total > 0 else 0.0,
                total_questions=total,
                correct=correct,
            ))

    return insights


def compute_topic_difficulty_accuracy(
    test_data: list[TestDataItem],
) -> dict[tuple[str, str], float]:
    """
    Compute accuracy for every (topic, difficulty) pair.

    Used by weak area detection to find specific weaknesses
    like "Hard Algebra" or "Medium Physics".

    Returns:
        Dict mapping (topic, difficulty) → accuracy float
    """
    combo_stats: dict[tuple[str, str], dict] = defaultdict(
        lambda: {"correct": 0, "total": 0}
    )

    for item in test_data:
        key = (item.topic, item.difficulty.value)
        combo_stats[key]["total"] += 1
        if item.is_correct:
            combo_stats[key]["correct"] += 1

    return {
        key: round(stats["correct"] / stats["total"], 4) if stats["total"] > 0 else 0.0
        for key, stats in combo_stats.items()
    }


def compute_overall_accuracy(test_data: list[TestDataItem]) -> float:
    """Simple overall accuracy across all questions."""
    if not test_data:
        return 0.0
    correct = sum(1 for item in test_data if item.is_correct)
    return round(correct / len(test_data), 4)


def generate_full_analysis(
    student_id: int,
    test_data: list[TestDataItem],
    weakness_threshold: float = 0.6,
) -> AnalysisResponse:
    """
    Master analysis function — computes all insights and detects weak areas.

    This is the main entry point called by the /analyze API endpoint.

    Args:
        student_id: The student being analyzed
        test_data: All question results to analyze
        weakness_threshold: Accuracy below this = weak (default 60%)

    Returns:
        Complete AnalysisResponse with topic insights, difficulty insights,
        weak topics, and specific weak areas
    """
    topic_insights = compute_topic_stats(test_data)
    difficulty_insights = compute_difficulty_stats(test_data)
    overall = compute_overall_accuracy(test_data)
    topic_diff_accuracy = compute_topic_difficulty_accuracy(test_data)

    # Identify weak topics (below threshold)
    weak_topics = [t.topic for t in topic_insights if t.accuracy < weakness_threshold]

    # Identify specific weak areas (topic + difficulty combos)
    weak_areas = []
    for (topic, difficulty), accuracy in topic_diff_accuracy.items():
        if accuracy < weakness_threshold:
            weak_areas.append(WeakAreaDetail(
                topic=topic,
                difficulty=difficulty,
                accuracy=accuracy,
            ))
    # Sort weakest first
    weak_areas.sort(key=lambda x: x.accuracy)

    return AnalysisResponse(
        student_id=student_id,
        overall_accuracy=overall,
        total_questions=len(test_data),
        topic_insights=topic_insights,
        difficulty_insights=difficulty_insights,
        weak_topics=weak_topics,
        weak_areas=weak_areas,
    )
