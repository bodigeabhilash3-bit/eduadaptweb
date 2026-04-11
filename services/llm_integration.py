"""
Optional LLM Integration — for generating human-readable feedback only.

IMPORTANT: This module is NOT used for any core logic, calculations,
or decision-making. It's purely for generating natural-language text
to explain mistakes and provide motivational feedback.

If no LLM API key is configured, all functions gracefully degrade
to template-based fallback responses.

Usage:
    Set environment variable LLM_API_KEY to enable.
    Supports: OpenAI-compatible APIs.
"""

import os
from typing import Optional


# Check if LLM is available
LLM_API_KEY = os.environ.get("LLM_API_KEY")
LLM_ENABLED = bool(LLM_API_KEY)


def explain_mistake(
    question_text: str,
    student_answer: str,
    correct_answer: str,
    topic: str,
) -> str:
    """
    Generate a human-readable explanation for why an answer is wrong.

    If LLM is available, uses it for a detailed explanation.
    Otherwise, returns a template-based fallback.

    Args:
        question_text: The question that was answered incorrectly
        student_answer: What the student chose
        correct_answer: The correct answer
        topic: The topic of the question

    Returns:
        A helpful explanation string
    """
    if LLM_ENABLED:
        return _llm_explain_mistake(question_text, student_answer, correct_answer, topic)

    # Fallback: template-based explanation
    return (
        f"You answered '{student_answer}' but the correct answer is '{correct_answer}'. "
        f"This is a {topic} question. Review the core concepts of {topic} "
        f"and practice similar problems to strengthen your understanding."
    )


def generate_feedback(
    overall_accuracy: float,
    weak_topics: list[str],
    strong_topics: list[str],
    total_questions: int,
) -> str:
    """
    Generate motivational and actionable feedback after analysis.

    Args:
        overall_accuracy: 0.0 to 1.0
        weak_topics: List of topics needing improvement
        strong_topics: List of topics performing well in
        total_questions: Total questions attempted

    Returns:
        A feedback paragraph
    """
    if LLM_ENABLED:
        return _llm_generate_feedback(
            overall_accuracy, weak_topics, strong_topics, total_questions
        )

    # Fallback: template-based feedback
    return _template_feedback(overall_accuracy, weak_topics, strong_topics, total_questions)


def _template_feedback(
    overall_accuracy: float,
    weak_topics: list[str],
    strong_topics: list[str],
    total_questions: int,
) -> str:
    """Template-based feedback when LLM is unavailable."""
    pct = f"{overall_accuracy:.0%}"

    # Opener based on accuracy
    if overall_accuracy >= 0.8:
        opener = f"Excellent work! You scored {pct} across {total_questions} questions."
    elif overall_accuracy >= 0.6:
        opener = f"Good effort! You scored {pct} across {total_questions} questions. There's room to improve."
    elif overall_accuracy >= 0.4:
        opener = f"You scored {pct} across {total_questions} questions. Let's work on improving those weak areas."
    else:
        opener = f"You scored {pct} across {total_questions} questions. Don't worry — consistent practice will get you there."

    # Strengths
    strengths = ""
    if strong_topics:
        strengths = f" You're doing well in {', '.join(strong_topics[:3])} — keep it up!"

    # Weaknesses
    weaknesses = ""
    if weak_topics:
        weaknesses = (
            f" Focus your study on {', '.join(weak_topics[:3])}."
            " Start with Easy problems and work your way up to Hard."
        )

    return f"{opener}{strengths}{weaknesses}"


def _llm_explain_mistake(
    question_text: str,
    student_answer: str,
    correct_answer: str,
    topic: str,
) -> str:
    """Use LLM API to generate a detailed mistake explanation."""
    try:
        # Generic OpenAI-compatible API call
        import httpx

        response = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {LLM_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-3.5-turbo",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a helpful tutor. Explain why the student's answer "
                            "is wrong and why the correct answer is right. Be concise "
                            "and educational. Keep it under 100 words."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Topic: {topic}\n"
                            f"Question: {question_text}\n"
                            f"Student's answer: {student_answer}\n"
                            f"Correct answer: {correct_answer}\n"
                            "Explain the mistake."
                        ),
                    },
                ],
                "max_tokens": 200,
                "temperature": 0.7,
            },
            timeout=10.0,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()

    except Exception as e:
        # Graceful degradation — fall back to template
        return (
            f"You answered '{student_answer}' but the correct answer is '{correct_answer}'. "
            f"Review the core concepts of {topic} for a deeper understanding. "
            f"(LLM explanation unavailable: {str(e)[:50]})"
        )


def _llm_generate_feedback(
    overall_accuracy: float,
    weak_topics: list[str],
    strong_topics: list[str],
    total_questions: int,
) -> str:
    """Use LLM API to generate personalized feedback."""
    try:
        import httpx

        response = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {LLM_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-3.5-turbo",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a supportive exam coach. Provide motivational "
                            "and actionable feedback based on the student's performance. "
                            "Be encouraging but honest. Keep it under 150 words."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Overall accuracy: {overall_accuracy:.0%}\n"
                            f"Total questions: {total_questions}\n"
                            f"Weak topics: {', '.join(weak_topics) or 'None'}\n"
                            f"Strong topics: {', '.join(strong_topics) or 'None'}\n"
                            "Give personalized study feedback."
                        ),
                    },
                ],
                "max_tokens": 300,
                "temperature": 0.7,
            },
            timeout=10.0,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()

    except Exception:
        # Graceful degradation
        return _template_feedback(overall_accuracy, weak_topics, strong_topics, total_questions)
