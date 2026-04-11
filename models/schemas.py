"""
Pydantic schemas — define API request/response contracts.

These models are independent of the database and define what the API
accepts and returns. This separation allows the API contract to evolve
independently of the storage layer.
"""

from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class Difficulty(str, Enum):
    """Valid difficulty levels."""
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"


class Mood(str, Enum):
    """Student mood states that control adaptive difficulty."""
    FOCUSED = "focused"
    OKAY = "okay"
    CONFUSED = "confused"
    TIRED = "tired"
    FRUSTRATED = "frustrated"


# ─── Input Schemas ────────────────────────────────────────────────────────────

class TestDataItem(BaseModel):
    """
    A single question result from a test.
    This is the fundamental input unit for the analysis engine.
    """
    question_id: int
    topic: str
    difficulty: Difficulty
    is_correct: bool
    time_taken: float = Field(ge=0, description="Time in seconds")


class AnalysisRequest(BaseModel):
    """Request body for POST /analyze — a batch of test results."""
    student_id: int
    test_data: list[TestDataItem]


class SubmitTestRequest(BaseModel):
    """
    Request body for POST /submit-test.
    answers is a dict mapping question_id (as string key) to the student's answer.
    time_per_question optionally maps question_id to seconds spent.
    """
    student_id: int
    test_id: int
    answers: dict[str, str]  # {"question_id": "chosen_answer"}
    time_per_question: Optional[dict[str, float]] = None  # {"question_id": seconds}


class GeneratePlanRequest(BaseModel):
    """Request body for POST /generate-plan."""
    student_id: int


class AddQuestionRequest(BaseModel):
    """Request body for adding a question to the bank."""
    question_text: str
    options: list[str] = Field(min_length=2, max_length=6)
    answer: str
    topic: str
    difficulty: Difficulty


class CreateStudentRequest(BaseModel):
    """Request body for POST /students — create a learner profile for the UI."""
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(default=None, max_length=200)
    phone: Optional[str] = Field(default=None, max_length=20)
    stream: Optional[str] = Field(default=None, description="MPC or BIPC")


class UpdateMoodRequest(BaseModel):
    """Request body for POST /mood — update how the student is feeling."""
    student_id: int
    mood: Mood
    context: Optional[str] = Field(default=None, description="quiz, study, chat, pet")


# ─── Output Schemas ───────────────────────────────────────────────────────────

class TopicInsight(BaseModel):
    """Performance breakdown for a single topic."""
    topic: str
    accuracy: float = Field(ge=0, le=1, description="0.0 to 1.0")
    avg_time: float = Field(description="Average seconds per question")
    total_questions: int
    correct: int
    incorrect: int


class DifficultyInsight(BaseModel):
    """Performance breakdown for a single difficulty level."""
    difficulty: str
    accuracy: float = Field(ge=0, le=1)
    total_questions: int
    correct: int


class WeakAreaDetail(BaseModel):
    """A specific weakness: topic + difficulty combination."""
    topic: str
    difficulty: Optional[str] = None
    accuracy: float


class AnalysisResponse(BaseModel):
    """Full analysis output returned by POST /analyze."""
    student_id: int
    overall_accuracy: float
    total_questions: int
    topic_insights: list[TopicInsight]
    difficulty_insights: list[DifficultyInsight]
    weak_topics: list[str]
    weak_areas: list[WeakAreaDetail]
    coaching_feedback: str = Field(
        default="",
        description="Motivational coaching text (LLM when configured, else templates)",
    )


class QuestionOut(BaseModel):
    """Question as returned by the API (includes id, excludes answer for tests)."""
    id: int
    question_text: str
    options: list[str]
    topic: str
    difficulty: str


class QuestionWithAnswer(QuestionOut):
    """Question with answer included (for admin/review endpoints)."""
    answer: str


class DailyTestResponse(BaseModel):
    """Response for GET /daily-test — the generated adaptive test."""
    test_id: int
    student_id: int
    total_questions: int
    questions: list[QuestionOut]


class QuestionResult(BaseModel):
    """Result for a single question after evaluation."""
    question_id: int
    topic: str
    difficulty: str
    is_correct: bool
    student_answer: str
    correct_answer: str
    explanation: Optional[str] = Field(
        default=None,
        description="Why the answer was wrong (set only when incorrect)",
    )


class SubmitTestResponse(BaseModel):
    """Response for POST /submit-test — evaluation results."""
    test_id: int
    student_id: int
    score: float
    total_questions: int
    correct_count: int
    results: list[QuestionResult]
    updated_weak_topics: list[str]
    coaching_feedback: str = Field(
        default="",
        description="Overall coaching after this test (LLM when configured, else templates)",
    )


class StudyResource(BaseModel):
    """A study resource (notes, formulas, tips) for a topic."""
    topic: str
    title: str
    content: str
    resource_type: str = Field(
        default="notes",
        description="Type: notes, formula, tip, concept, video",
    )
    youtube_id: Optional[str] = Field(
        default=None,
        description="YouTube video ID for video resources",
    )


class PracticeTask(BaseModel):
    """A single practice task within a study day."""
    task: str
    topic: str
    question_count: Optional[int] = None
    difficulty_focus: Optional[str] = None
    content_questions: list["QuestionWithAnswer"] = Field(
        default_factory=list,
        description="Actual questions from the bank attached to this task",
    )


class StudyPlanDay(BaseModel):
    """One day in the 7-day study plan."""
    day: int
    focus_topics: list[str]
    practice_tasks: list[PracticeTask]
    test_recommendation: str
    study_resources: list[StudyResource] = Field(
        default_factory=list,
        description="Study notes and tips for the day's focus topics",
    )


class StudyPlanResponse(BaseModel):
    """Full 7-day personalized study plan."""
    student_id: int
    plan: list[StudyPlanDay]
    weak_topics_addressed: list[str]
    message: str


class StudentOut(BaseModel):
    """Student row returned to the UI."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    stream: Optional[str] = None
    mood: Optional[str] = Field(default="okay")
    created_at: datetime


class MoodResponse(BaseModel):
    """Response for mood endpoints."""
    student_id: int
    mood: str
    message: str


class MoodLogEntry(BaseModel):
    """A single mood log entry."""
    mood: str
    context: Optional[str] = None
    timestamp: datetime


class StudentPerformanceSnapshot(BaseModel):
    """Cached performance for dashboards (same source as adaptive test / plan)."""
    student_id: int
    weak_topics: list[str]
    overall_accuracy: float
    total_questions_attempted: int
    topic_accuracies: dict[str, float]
    difficulty_accuracies: dict[str, float]
    last_updated: Optional[datetime] = None
