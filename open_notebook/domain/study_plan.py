"""
Study Plan domain models.
AI-generated personalized study schedules based on content and deadlines.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class PlanStatus(str, Enum):
    """Study plan status."""
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class TopicDifficulty(str, Enum):
    """Topic difficulty level."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class TopicStatus(str, Enum):
    """Study topic status."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class SessionType(str, Enum):
    """Study session type."""
    LEARN = "learn"
    REVIEW = "review"
    PRACTICE = "practice"
    QUIZ = "quiz"


class SessionStatus(str, Enum):
    """Study session status."""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    RESCHEDULED = "rescheduled"


class AdjustmentType(str, Enum):
    """Plan adjustment type."""
    RESCHEDULE = "reschedule"
    ADD_REVIEW = "add_review"
    EXTEND_DEADLINE = "extend_deadline"
    INCREASE_HOURS = "increase_hours"
    REDUCE_SCOPE = "reduce_scope"


class AdjustmentStatus(str, Enum):
    """Plan adjustment status."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


# Request/Response models

class StudyPlanCreate(BaseModel):
    """Create a new study plan."""
    notebook_id: str
    title: str
    description: Optional[str] = None
    deadline: datetime
    available_hours_per_day: float = Field(default=2.0, ge=0.5, le=12.0)


class StudyPlanUpdate(BaseModel):
    """Update study plan."""
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    available_hours_per_day: Optional[float] = Field(default=None, ge=0.5, le=12.0)
    status: Optional[PlanStatus] = None


class StudyPlan(BaseModel):
    """Study plan model."""
    id: str
    notebook_id: str
    title: str
    description: Optional[str] = None
    deadline: datetime
    available_hours_per_day: float = 2.0
    total_study_hours: float = 0.0
    status: PlanStatus = PlanStatus.ACTIVE
    progress_percentage: float = 0.0
    created_at: datetime
    updated_at: datetime


class StudyTopicCreate(BaseModel):
    """Create a study topic."""
    plan_id: str
    name: str
    description: Optional[str] = None
    difficulty: TopicDifficulty = TopicDifficulty.MEDIUM
    estimated_hours: float = Field(ge=0.25)
    priority: int = Field(default=5, ge=1, le=10)
    source_ids: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)


class StudyTopicUpdate(BaseModel):
    """Update study topic."""
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[TopicDifficulty] = None
    estimated_hours: Optional[float] = Field(default=None, ge=0.25)
    priority: Optional[int] = Field(default=None, ge=1, le=10)
    status: Optional[TopicStatus] = None
    mastery_level: Optional[float] = Field(default=None, ge=0.0, le=100.0)


class StudyTopic(BaseModel):
    """Study topic model."""
    id: str
    plan_id: str
    name: str
    description: Optional[str] = None
    difficulty: TopicDifficulty = TopicDifficulty.MEDIUM
    estimated_hours: float
    priority: int = 5
    source_ids: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)
    status: TopicStatus = TopicStatus.NOT_STARTED
    mastery_level: float = 0.0
    created_at: datetime


class StudySessionCreate(BaseModel):
    """Create a study session."""
    plan_id: str
    topic_id: str
    scheduled_date: datetime
    scheduled_duration_minutes: int = Field(ge=15, le=480)
    session_type: SessionType = SessionType.LEARN


class StudySessionUpdate(BaseModel):
    """Update study session."""
    scheduled_date: Optional[datetime] = None
    scheduled_duration_minutes: Optional[int] = Field(default=None, ge=15, le=480)
    session_type: Optional[SessionType] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    status: Optional[SessionStatus] = None
    notes: Optional[str] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)


class StudySession(BaseModel):
    """Study session model."""
    id: str
    plan_id: str
    topic_id: str
    scheduled_date: datetime
    scheduled_duration_minutes: int
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    session_type: SessionType = SessionType.LEARN
    status: SessionStatus = SessionStatus.SCHEDULED
    notes: Optional[str] = None
    rating: Optional[int] = None
    created_at: datetime
    # Populated when joined
    topic_name: Optional[str] = None


class PlanAdjustment(BaseModel):
    """Plan adjustment suggestion."""
    id: str
    plan_id: str
    adjustment_type: AdjustmentType
    reason: str
    original_value: Optional[str] = None
    suggested_value: Optional[str] = None
    status: AdjustmentStatus = AdjustmentStatus.PENDING
    created_at: datetime


class PlanAdjustmentResponse(BaseModel):
    """Response to a plan adjustment."""
    adjustment_id: str
    accepted: bool


# Response models with nested data

class StudyPlanWithTopics(StudyPlan):
    """Study plan with topics."""
    topics: List[StudyTopic] = Field(default_factory=list)


class StudyPlanFull(StudyPlanWithTopics):
    """Complete study plan with all data."""
    sessions: List[StudySession] = Field(default_factory=list)
    adjustments: List[PlanAdjustment] = Field(default_factory=list)
    days_remaining: int = 0
    completed_hours: float = 0.0
    upcoming_sessions: List[StudySession] = Field(default_factory=list)


class DailySchedule(BaseModel):
    """Schedule for a single day."""
    date: datetime
    sessions: List[StudySession] = Field(default_factory=list)
    total_hours: float = 0.0
    is_today: bool = False


class WeeklySchedule(BaseModel):
    """Weekly schedule view."""
    plan_id: str
    week_start: datetime
    week_end: datetime
    days: List[DailySchedule] = Field(default_factory=list)
    total_planned_hours: float = 0.0
    total_completed_hours: float = 0.0


class StudyPlanStats(BaseModel):
    """Statistics for study plan."""
    plan_id: str
    total_topics: int = 0
    completed_topics: int = 0
    total_sessions: int = 0
    completed_sessions: int = 0
    total_planned_hours: float = 0.0
    total_completed_hours: float = 0.0
    average_rating: Optional[float] = None
    on_track: bool = True
    days_remaining: int = 0
    hours_per_day_needed: float = 0.0


class TopicAnalysis(BaseModel):
    """AI-extracted topic from sources."""
    name: str
    description: str
    difficulty: TopicDifficulty
    estimated_hours: float
    priority: int
    source_ids: List[str]
    prerequisites: List[str] = Field(default_factory=list)
    key_concepts: List[str] = Field(default_factory=list)


class PlanGenerationRequest(BaseModel):
    """Request to generate a study plan."""
    notebook_id: str
    title: str
    description: Optional[str] = None
    deadline: datetime
    available_hours_per_day: float = Field(default=2.0, ge=0.5, le=12.0)
    include_reviews: bool = True
    include_practice: bool = True
    focus_areas: Optional[List[str]] = None  # Optional list of topics to prioritize


class PlanGenerationResult(BaseModel):
    """Result of plan generation."""
    plan: StudyPlan
    topics: List[StudyTopic]
    sessions: List[StudySession]
    total_hours: float
    days_with_sessions: int
    warnings: List[str] = Field(default_factory=list)
