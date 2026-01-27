"""
Quiz and Flashcard API Router
"""

from datetime import datetime
from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException
from fsrs import Rating
from loguru import logger
from pydantic import BaseModel, Field

from open_notebook.domain.quiz import (
    Flashcard,
    QuizQuestion,
    QuizSession,
    UserStudyStats,
)
from open_notebook.services.quiz_service import QuizGenerationService


router = APIRouter(prefix="/quiz", tags=["quiz"])


# ==================== Request/Response Models ====================

class QuizGenerateRequest(BaseModel):
    notebook_id: str = Field(..., description="ID of the notebook to generate quiz from")
    num_questions: int = Field(default=10, ge=1, le=50, description="Number of questions")
    difficulty: Literal["easy", "medium", "hard", "mixed"] = Field(
        default="mixed", description="Quiz difficulty"
    )
    source_ids: Optional[List[str]] = Field(
        default=None, description="Specific source IDs to use (optional)"
    )
    model_id: Optional[str] = Field(
        default=None, description="Model ID to use for generation"
    )


class QuizQuestionResponse(BaseModel):
    id: str
    question: str
    question_type: str
    options: List[str]
    difficulty: str
    user_answer: Optional[int] = None
    is_correct: Optional[bool] = None
    # Only include after answering
    correct_index: Optional[int] = None
    explanation: Optional[str] = None


class QuizSessionResponse(BaseModel):
    id: str
    notebook_id: str
    title: Optional[str]
    question_count: int
    correct_count: int
    score: Optional[float]
    difficulty: str
    status: str
    started_at: Optional[str]
    completed_at: Optional[str]
    created: str


class QuizSessionDetailResponse(QuizSessionResponse):
    questions: List[QuizQuestionResponse]


class SubmitAnswerRequest(BaseModel):
    question_id: str
    answer: int = Field(..., ge=0, le=3, description="Index of selected answer (0-3)")
    time_spent_seconds: Optional[int] = Field(
        default=None, description="Time spent on question in seconds"
    )


class SubmitAnswerResponse(BaseModel):
    is_correct: bool
    correct_index: int
    explanation: str
    session_progress: dict


# ==================== Flashcard Models ====================

class FlashcardCreateRequest(BaseModel):
    notebook_id: str
    front: str = Field(..., min_length=1, description="Front of card (question)")
    back: str = Field(..., min_length=1, description="Back of card (answer)")
    source_id: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)


class FlashcardGenerateRequest(BaseModel):
    notebook_id: str
    num_cards: int = Field(default=20, ge=1, le=100, description="Number of cards to generate")
    source_ids: Optional[List[str]] = None
    model_id: Optional[str] = None


class FlashcardResponse(BaseModel):
    id: str
    front: str
    back: str
    tags: List[str]
    difficulty: Optional[float] = None
    state: int
    due: Optional[str]
    reps: int
    created: str


class FlashcardReviewRequest(BaseModel):
    rating: int = Field(
        ..., ge=1, le=4,
        description="Review rating: 1=Again, 2=Hard, 3=Good, 4=Easy"
    )


class FlashcardStatsResponse(BaseModel):
    total: int
    new: int
    learning: int
    review: int
    due: int


# ==================== Study Stats Models ====================

class StudyStatsResponse(BaseModel):
    user_id: str
    current_streak: int
    longest_streak: int
    total_xp: int
    level: int
    badges: List[str]
    total_quizzes_completed: int
    total_flashcards_reviewed: int
    total_correct_answers: int
    xp_to_next_level: int


# ==================== Quiz Endpoints ====================

@router.post("/generate", response_model=QuizSessionResponse)
async def generate_quiz(request: QuizGenerateRequest):
    """Generate a new quiz from notebook content"""
    try:
        session = await QuizGenerationService.generate_quiz(
            notebook_id=request.notebook_id,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
            source_ids=request.source_ids,
            model_id=request.model_id
        )
        
        return QuizSessionResponse(
            id=session.id,
            notebook_id=session.notebook_id,
            title=session.title,
            question_count=session.question_count,
            correct_count=session.correct_count,
            score=session.score,
            difficulty=session.difficulty,
            status=session.status,
            started_at=session.started_at.isoformat() if session.started_at else None,
            completed_at=session.completed_at.isoformat() if session.completed_at else None,
            created=session.created.isoformat() if session.created else ""
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        logger.exception(e)  # This will log the full traceback
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")


@router.get("/sessions", response_model=List[QuizSessionResponse])
async def get_quiz_sessions(
    notebook_id: str,
    limit: int = 20
):
    """Get quiz sessions for a notebook"""
    try:
        sessions = await QuizSession.get_by_notebook(notebook_id, limit)
        return [
            QuizSessionResponse(
                id=s.id,
                notebook_id=s.notebook_id,
                title=s.title,
                question_count=s.question_count,
                correct_count=s.correct_count,
                score=s.score,
                difficulty=s.difficulty,
                status=s.status,
                started_at=s.started_at.isoformat() if s.started_at else None,
                completed_at=s.completed_at.isoformat() if s.completed_at else None,
                created=s.created.isoformat() if s.created else ""
            )
            for s in sessions
        ]
    except Exception as e:
        logger.error(f"Error fetching quiz sessions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch quiz sessions")


@router.get("/sessions/{session_id}", response_model=QuizSessionDetailResponse)
async def get_quiz_session(session_id: str, show_answers: bool = False):
    """Get a quiz session with questions"""
    try:
        session = await QuizSession.get(session_id)
        questions = await session.get_questions()
        
        question_responses = []
        for q in questions:
            resp = QuizQuestionResponse(
                id=q.id,
                question=q.question,
                question_type=q.question_type,
                options=q.options,
                difficulty=q.difficulty,
                user_answer=q.user_answer,
                is_correct=q.is_correct
            )
            # Include answers if already answered or show_answers is True
            if q.user_answer is not None or show_answers or session.status == "completed":
                resp.correct_index = q.correct_index
                resp.explanation = q.explanation
            question_responses.append(resp)
        
        return QuizSessionDetailResponse(
            id=session.id,
            notebook_id=session.notebook_id,
            title=session.title,
            question_count=session.question_count,
            correct_count=session.correct_count,
            score=session.score,
            difficulty=session.difficulty,
            status=session.status,
            started_at=session.started_at.isoformat() if session.started_at else None,
            completed_at=session.completed_at.isoformat() if session.completed_at else None,
            created=session.created.isoformat() if session.created else "",
            questions=question_responses
        )
    except Exception as e:
        logger.error(f"Error fetching quiz session: {str(e)}")
        raise HTTPException(status_code=404, detail="Quiz session not found")


@router.post("/sessions/{session_id}/answer", response_model=SubmitAnswerResponse)
async def submit_answer(session_id: str, request: SubmitAnswerRequest):
    """Submit an answer for a quiz question"""
    try:
        session = await QuizSession.get(session_id)
        
        if session.status != "in_progress":
            raise HTTPException(status_code=400, detail="Quiz is not in progress")
        
        question = await session.submit_answer(
            question_id=request.question_id,
            answer=request.answer,
            time_spent_seconds=request.time_spent_seconds
        )
        
        # Check if all questions answered
        questions = await session.get_questions()
        answered_count = sum(1 for q in questions if q.user_answer is not None)
        
        return SubmitAnswerResponse(
            is_correct=question.is_correct,
            correct_index=question.correct_index,
            explanation=question.explanation,
            session_progress={
                "answered": answered_count,
                "total": session.question_count,
                "correct": session.correct_count
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answer: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit answer")


@router.post("/sessions/{session_id}/complete", response_model=QuizSessionResponse)
async def complete_quiz(session_id: str):
    """Complete a quiz session and calculate final score"""
    try:
        session = await QuizSession.get(session_id)
        session = await session.complete()
        
        # Update user stats (use default user for now)
        stats = await UserStudyStats.get_or_create("default_user")
        perfect = session.score == 100.0
        await stats.record_quiz_completion(session.score, perfect)
        
        return QuizSessionResponse(
            id=session.id,
            notebook_id=session.notebook_id,
            title=session.title,
            question_count=session.question_count,
            correct_count=session.correct_count,
            score=session.score,
            difficulty=session.difficulty,
            status=session.status,
            started_at=session.started_at.isoformat() if session.started_at else None,
            completed_at=session.completed_at.isoformat() if session.completed_at else None,
            created=session.created.isoformat() if session.created else ""
        )
    except Exception as e:
        logger.error(f"Error completing quiz: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to complete quiz")


# ==================== Flashcard Endpoints ====================

@router.post("/flashcards", response_model=FlashcardResponse)
async def create_flashcard(request: FlashcardCreateRequest):
    """Create a new flashcard"""
    try:
        flashcard = Flashcard(
            notebook_id=request.notebook_id,
            source_id=request.source_id,
            front=request.front,
            back=request.back,
            tags=request.tags or []
        )
        await flashcard.save()
        
        # Award XP for creating flashcard
        stats = await UserStudyStats.get_or_create("default_user")
        await stats.add_xp(stats.XP_CREATE_FLASHCARD, "Created flashcard")
        
        return FlashcardResponse(
            id=flashcard.id,
            front=flashcard.front,
            back=flashcard.back,
            tags=flashcard.tags or [],
            difficulty=flashcard.difficulty,
            state=flashcard.state,
            due=flashcard.due.isoformat() if flashcard.due else None,
            reps=flashcard.reps,
            created=flashcard.created.isoformat() if flashcard.created else ""
        )
    except Exception as e:
        logger.error(f"Error creating flashcard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create flashcard")


@router.post("/flashcards/generate", response_model=List[FlashcardResponse])
async def generate_flashcards(request: FlashcardGenerateRequest):
    """Generate flashcards from notebook content using AI"""
    try:
        flashcards = await QuizGenerationService.generate_flashcards(
            notebook_id=request.notebook_id,
            num_cards=request.num_cards,
            source_ids=request.source_ids,
            model_id=request.model_id
        )
        
        return [
            FlashcardResponse(
                id=f.id,
                front=f.front,
                back=f.back,
                tags=f.tags or [],
                difficulty=f.difficulty,
                state=f.state,
                due=f.due.isoformat() if f.due else None,
                reps=f.reps,
                created=f.created.isoformat() if f.created else ""
            )
            for f in flashcards
        ]
    except ValueError as e:
        logger.error(f"ValueError generating flashcards: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating flashcards: {str(e)}")
        logger.exception(e)  # Log full traceback
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")


@router.get("/flashcards", response_model=List[FlashcardResponse])
async def get_flashcards(
    notebook_id: Optional[str] = None,
    due_only: bool = False,
    limit: int = 100
):
    """Get flashcards, optionally filtered by notebook or due status"""
    try:
        if due_only:
            flashcards = await Flashcard.get_due_cards(notebook_id, limit)
        elif notebook_id:
            flashcards = await Flashcard.get_by_notebook(notebook_id, limit)
        else:
            flashcards = await Flashcard.get_all()
        
        return [
            FlashcardResponse(
                id=f.id,
                front=f.front,
                back=f.back,
                tags=f.tags or [],
                difficulty=f.difficulty,
                state=f.state,
                due=f.due.isoformat() if f.due else None,
                reps=f.reps,
                created=f.created.isoformat() if f.created else ""
            )
            for f in flashcards
        ]
    except Exception as e:
        logger.error(f"Error fetching flashcards: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch flashcards")


@router.get("/flashcards/stats", response_model=FlashcardStatsResponse)
async def get_flashcard_stats(notebook_id: Optional[str] = None):
    """Get flashcard statistics"""
    try:
        stats = await Flashcard.get_stats(notebook_id)
        return FlashcardStatsResponse(**stats)
    except Exception as e:
        logger.error(f"Error fetching flashcard stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch stats")


@router.post("/flashcards/{flashcard_id}/review", response_model=FlashcardResponse)
async def review_flashcard(flashcard_id: str, request: FlashcardReviewRequest):
    """Review a flashcard and update FSRS scheduling"""
    try:
        logger.info(f"Reviewing flashcard {flashcard_id} with rating {request.rating}")
        flashcard = await Flashcard.get(flashcard_id)
        logger.info(f"Found flashcard: {flashcard.front[:50]}")
        
        # Map rating int to FSRS Rating enum
        rating_map = {
            1: Rating.Again,
            2: Rating.Hard,
            3: Rating.Good,
            4: Rating.Easy
        }
        rating = rating_map.get(request.rating, Rating.Good)
        logger.info(f"Mapped rating to FSRS: {rating}")
        
        flashcard = await flashcard.review(rating)
        logger.info(f"Flashcard reviewed successfully, new due: {flashcard.due}")
        
        # Update user stats
        stats = await UserStudyStats.get_or_create("default_user")
        await stats.record_flashcard_review(correct=request.rating >= 3)
        logger.info(f"User stats updated")
        
        return FlashcardResponse(
            id=flashcard.id,
            front=flashcard.front,
            back=flashcard.back,
            tags=flashcard.tags or [],
            difficulty=flashcard.difficulty if flashcard.difficulty is not None else 0.0,
            state=flashcard.state,
            due=flashcard.due.isoformat() if flashcard.due else None,
            reps=flashcard.reps if hasattr(flashcard, 'reps') and flashcard.reps else 0,
            created=flashcard.created.isoformat() if flashcard.created else ""
        )
    except Exception as e:
        logger.error(f"Error reviewing flashcard: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to review flashcard: {str(e)}")


@router.delete("/flashcards/{flashcard_id}")
async def delete_flashcard(flashcard_id: str):
    """Delete a flashcard"""
    try:
        flashcard = await Flashcard.get(flashcard_id)
        await flashcard.delete()
        return {"message": "Flashcard deleted"}
    except Exception as e:
        logger.error(f"Error deleting flashcard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete flashcard")


# ==================== Study Stats Endpoints ====================

@router.get("/stats", response_model=StudyStatsResponse)
async def get_study_stats(user_id: str = "default_user"):
    """Get user study statistics"""
    try:
        stats = await UserStudyStats.get_or_create(user_id)
        
        xp_to_next = stats.XP_PER_LEVEL - (stats.total_xp % stats.XP_PER_LEVEL)
        
        return StudyStatsResponse(
            user_id=stats.user_id,
            current_streak=stats.current_streak,
            longest_streak=stats.longest_streak,
            total_xp=stats.total_xp,
            level=stats.level,
            badges=stats.badges,
            total_quizzes_completed=stats.total_quizzes_completed,
            total_flashcards_reviewed=stats.total_flashcards_reviewed,
            total_correct_answers=stats.total_correct_answers,
            xp_to_next_level=xp_to_next
        )
    except Exception as e:
        logger.error(f"Error fetching study stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch study stats")
