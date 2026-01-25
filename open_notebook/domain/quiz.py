"""
Quiz and Flashcard Domain Models with FSRS Integration
"""

from datetime import datetime
from typing import Any, ClassVar, Dict, List, Literal, Optional

from fsrs import Scheduler, Card, Rating, State
from loguru import logger
from pydantic import Field, field_validator

from open_notebook.database.repository import ensure_record_id, repo_query
from open_notebook.domain.base import ObjectModel
from open_notebook.exceptions import DatabaseOperationError, InvalidInputError


# Initialize FSRS scheduler
fsrs = Scheduler()


class Flashcard(ObjectModel):
    """Flashcard with FSRS spaced repetition scheduling"""
    
    table_name: ClassVar[str] = "flashcard"
    
    user_id: Optional[str] = None
    source_id: Optional[str] = None
    notebook_id: Optional[str] = None
    front: str = Field(..., description="Question or prompt side of the card")
    back: str = Field(..., description="Answer side of the card")
    tags: Optional[List[str]] = Field(default_factory=list)
    
    # FSRS scheduling fields (matching new FSRS library)
    stability: Optional[float] = Field(default=None)
    difficulty: Optional[float] = Field(default=None)
    step: int = Field(default=0)  # Learning step counter
    state: int = Field(default=0)  # FSRS State: 0=New, 1=Learning, 2=Review, 3=Relearning
    due: Optional[datetime] = None
    last_review: Optional[datetime] = None
    
    # Legacy fields (kept for compatibility)
    elapsed_days: int = Field(default=0)
    scheduled_days: int = Field(default=0)
    reps: int = Field(default=0)
    lapses: int = Field(default=0)

    @field_validator("state")
    @classmethod
    def ensure_state_is_int(cls, v) -> int:
        """Ensure state is always stored as integer"""
        if isinstance(v, int):
            return v
        # Handle FSRS State enum - use int() to get value
        try:
            return int(v)
        except (TypeError, ValueError):
            pass
        if isinstance(v, str):
            state_map = {'New': 0, 'Learning': 1, 'Review': 2, 'Relearning': 3}
            return state_map.get(v, 0)
        return 0

    @field_validator("front", "back")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise InvalidInputError("Flashcard content cannot be empty")
        return v

    def to_fsrs_card(self) -> Card:
        """Convert to FSRS Card object"""
        card = Card()
        
        # FSRS expects None for new cards, not 0.0
        # Only set these values if they have been set (reviewed cards)
        if self.stability is not None and self.stability > 0:
            card.stability = self.stability
        if self.difficulty is not None and self.difficulty > 0:
            card.difficulty = self.difficulty
        
        # Set step for learning cards
        card.step = self.step if self.step else 0
        
        # Map state integer to FSRS State enum
        # FSRS State enum: Learning=1, Review=2, Relearning=3
        # Our state 0 (New) maps to Learning for FSRS
        state_map = {
            0: State.Learning,  # New cards treated as Learning
            1: State.Learning,
            2: State.Review,
            3: State.Relearning
        }
        card.state = state_map.get(self.state, State.Learning)
        
        card.due = self.due or datetime.now()
        card.last_review = self.last_review
        return card

    def update_from_fsrs_card(self, card: Card) -> None:
        """Update fields from FSRS Card object"""
        # Handle None values from FSRS - store them properly
        self.stability = card.stability
        self.difficulty = card.difficulty
        self.step = card.step if card.step is not None else 0
        
        # Ensure state is stored as integer using int() which works on FSRS State enum
        try:
            self.state = int(card.state)
        except (TypeError, ValueError):
            # Fallback: convert to string and map
            state_str = str(card.state)
            state_name_map = {
                'Learning': 1,
                'Review': 2,
                'Relearning': 3
            }
            self.state = state_name_map.get(state_str, 1)
        
        # Handle timezone-aware datetime from FSRS
        if card.due:
            # Convert to naive datetime if timezone-aware
            if hasattr(card.due, 'tzinfo') and card.due.tzinfo is not None:
                self.due = card.due.replace(tzinfo=None)
            else:
                self.due = card.due
        
        if card.last_review:
            if hasattr(card.last_review, 'tzinfo') and card.last_review.tzinfo is not None:
                self.last_review = card.last_review.replace(tzinfo=None)
            else:
                self.last_review = card.last_review

    async def review(self, rating: Rating) -> "Flashcard":
        """Process a review and schedule next review using FSRS"""
        logger.info(f"Review started - current state: {self.state} (type: {type(self.state)})")
        card = self.to_fsrs_card()
        logger.info(f"Converted to FSRS card - state: {card.state} (type: {type(card.state)})")
        
        # Use review_card method - returns (Card, ReviewLog) tuple
        new_card, review_log = fsrs.review_card(card, rating)
        logger.info(f"FSRS returned card - state: {new_card.state} (type: {type(new_card.state)})")
        
        self.update_from_fsrs_card(new_card)
        logger.info(f"After update - state: {self.state} (type: {type(self.state)})")
        self.last_review = datetime.now()
        
        await self.save()
        logger.info(f"Saved successfully - final state: {self.state}")
        return self

    @classmethod
    async def get_due_cards(
        cls,
        notebook_id: Optional[str] = None,
        limit: int = 20
    ) -> List["Flashcard"]:
        """Get cards due for review"""
        try:
            now = datetime.now().isoformat()
            
            if notebook_id:
                query = """
                    SELECT * FROM flashcard 
                    WHERE notebook_id = $notebook_id 
                    AND (due IS NONE OR due <= $now)
                    ORDER BY due ASC
                    LIMIT $limit
                """
                params = {"notebook_id": notebook_id, "now": now, "limit": limit}
            else:
                query = """
                    SELECT * FROM flashcard 
                    WHERE (due IS NONE OR due <= $now)
                    ORDER BY due ASC
                    LIMIT $limit
                """
                params = {"now": now, "limit": limit}
            
            result = await repo_query(query, params)
            return [cls(**card) for card in result] if result else []
        except Exception as e:
            logger.error(f"Error fetching due cards: {str(e)}")
            raise DatabaseOperationError(e)

    @classmethod
    async def get_by_notebook(
        cls,
        notebook_id: str,
        limit: int = 100
    ) -> List["Flashcard"]:
        """Get all flashcards for a notebook"""
        try:
            result = await repo_query(
                """
                SELECT * FROM flashcard 
                WHERE notebook_id = $notebook_id
                ORDER BY created DESC
                LIMIT $limit
                """,
                {"notebook_id": notebook_id, "limit": limit}
            )
            return [cls(**card) for card in result] if result else []
        except Exception as e:
            logger.error(f"Error fetching flashcards for notebook {notebook_id}: {str(e)}")
            raise DatabaseOperationError(e)

    @classmethod
    async def get_stats(cls, notebook_id: Optional[str] = None) -> Dict[str, Any]:
        """Get flashcard statistics"""
        try:
            now = datetime.now().isoformat()
            
            if notebook_id:
                base_query = "SELECT * FROM flashcard WHERE notebook_id = $notebook_id"
                params: Dict[str, Any] = {"notebook_id": notebook_id, "now": now}
            else:
                base_query = "SELECT * FROM flashcard"
                params = {"now": now}
            
            # Get all cards
            all_cards = await repo_query(base_query, params if notebook_id else None)
            
            total = len(all_cards)
            new_count = sum(1 for c in all_cards if c.get("state", 0) == 0)
            learning_count = sum(1 for c in all_cards if c.get("state", 0) == 1)
            review_count = sum(1 for c in all_cards if c.get("state", 0) == 2)
            
            # Count due cards
            due_count = sum(
                1 for c in all_cards 
                if c.get("due") is None or c.get("due", "") <= now
            )
            
            return {
                "total": total,
                "new": new_count,
                "learning": learning_count,
                "review": review_count,
                "due": due_count
            }
        except Exception as e:
            logger.error(f"Error fetching flashcard stats: {str(e)}")
            raise DatabaseOperationError(e)


class QuizQuestion(ObjectModel):
    """Individual quiz question"""
    
    table_name: ClassVar[str] = "quiz_question"
    
    quiz_session_id: str
    source_id: Optional[str] = None
    question: str
    question_type: Literal["mcq", "true_false", "short_answer"] = "mcq"
    options: List[str] = Field(default_factory=list)
    correct_index: int
    explanation: str
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    user_answer: Optional[int] = None
    is_correct: Optional[bool] = None
    answered_at: Optional[datetime] = None
    time_spent_seconds: Optional[int] = None


class QuizSession(ObjectModel):
    """Quiz session containing multiple questions"""
    
    table_name: ClassVar[str] = "quiz_session"
    
    notebook_id: str
    title: Optional[str] = None
    question_count: int = 0
    correct_count: int = 0
    score: Optional[float] = None
    difficulty: Literal["easy", "medium", "hard", "mixed"] = "mixed"
    status: Literal["in_progress", "completed", "abandoned"] = "in_progress"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    @field_validator("notebook_id")
    @classmethod
    def notebook_id_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise InvalidInputError("Notebook ID cannot be empty")
        return v

    async def get_questions(self) -> List[QuizQuestion]:
        """Get all questions for this quiz session"""
        try:
            result = await repo_query(
                """
                SELECT * FROM quiz_question 
                WHERE quiz_session_id = $session_id
                ORDER BY created ASC
                """,
                {"session_id": self.id}
            )
            return [QuizQuestion(**q) for q in result] if result else []
        except Exception as e:
            logger.error(f"Error fetching questions for session {self.id}: {str(e)}")
            raise DatabaseOperationError(e)

    async def submit_answer(
        self,
        question_id: str,
        answer: int,
        time_spent_seconds: Optional[int] = None
    ) -> QuizQuestion:
        """Submit an answer for a question"""
        try:
            question = await QuizQuestion.get(question_id)
            question.user_answer = answer
            question.is_correct = answer == question.correct_index
            question.answered_at = datetime.now()
            question.time_spent_seconds = time_spent_seconds
            await question.save()
            
            # Update session stats
            if question.is_correct:
                self.correct_count += 1
            
            await self.save()
            return question
        except Exception as e:
            logger.error(f"Error submitting answer: {str(e)}")
            raise DatabaseOperationError(e)

    async def complete(self) -> "QuizSession":
        """Complete the quiz session and calculate final score"""
        try:
            self.status = "completed"
            self.completed_at = datetime.now()
            
            if self.question_count > 0:
                self.score = (self.correct_count / self.question_count) * 100
            else:
                self.score = 0.0
            
            await self.save()
            return self
        except Exception as e:
            logger.error(f"Error completing quiz session: {str(e)}")
            raise DatabaseOperationError(e)

    @classmethod
    async def get_by_notebook(
        cls,
        notebook_id: str,
        limit: int = 20
    ) -> List["QuizSession"]:
        """Get quiz sessions for a notebook"""
        try:
            result = await repo_query(
                """
                SELECT * FROM quiz_session 
                WHERE notebook_id = $notebook_id
                ORDER BY created DESC
                LIMIT $limit
                """,
                {"notebook_id": notebook_id, "limit": limit}
            )
            return [cls(**session) for session in result] if result else []
        except Exception as e:
            logger.error(f"Error fetching quiz sessions for notebook {notebook_id}: {str(e)}")
            raise DatabaseOperationError(e)


class UserStudyStats(ObjectModel):
    """User study statistics for gamification"""
    
    table_name: ClassVar[str] = "user_study_stats"
    
    user_id: str
    current_streak: int = 0
    longest_streak: int = 0
    total_xp: int = 0
    level: int = 1
    badges: List[str] = Field(default_factory=list)
    last_study_date: Optional[datetime] = None
    total_quizzes_completed: int = 0
    total_flashcards_reviewed: int = 0
    total_correct_answers: int = 0

    # XP reward constants
    XP_QUIZ_COMPLETE: ClassVar[int] = 50
    XP_PERFECT_QUIZ: ClassVar[int] = 100
    XP_DAILY_REVIEW: ClassVar[int] = 25
    XP_CREATE_FLASHCARD: ClassVar[int] = 10
    XP_STREAK_BONUS_PER_DAY: ClassVar[int] = 10
    XP_PER_LEVEL: ClassVar[int] = 500

    def calculate_level(self) -> int:
        """Calculate level from XP"""
        return max(1, (self.total_xp // self.XP_PER_LEVEL) + 1)

    async def add_xp(self, amount: int, reason: str = "") -> int:
        """Add XP and update level"""
        self.total_xp += amount
        old_level = self.level
        self.level = self.calculate_level()
        
        await self.save()
        
        # Return level up indicator
        if self.level > old_level:
            logger.info(f"User {self.user_id} leveled up to {self.level}!")
            return self.level - old_level
        return 0

    async def update_streak(self) -> int:
        """Update study streak and return new streak count"""
        now = datetime.now()
        today = now.date()
        
        if self.last_study_date:
            last_date = self.last_study_date.date()
            days_diff = (today - last_date).days
            
            if days_diff == 0:
                # Same day, no change
                pass
            elif days_diff == 1:
                # Consecutive day
                self.current_streak += 1
                # Streak bonus XP
                await self.add_xp(
                    self.current_streak * self.XP_STREAK_BONUS_PER_DAY,
                    f"Streak bonus for {self.current_streak} days"
                )
            else:
                # Streak broken
                self.current_streak = 1
        else:
            # First study session
            self.current_streak = 1
        
        # Update longest streak
        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak
        
        self.last_study_date = now
        await self.save()
        
        return self.current_streak

    async def record_quiz_completion(self, score: float, perfect: bool = False) -> None:
        """Record a completed quiz"""
        self.total_quizzes_completed += 1
        
        await self.add_xp(self.XP_QUIZ_COMPLETE, "Quiz completed")
        if perfect:
            await self.add_xp(self.XP_PERFECT_QUIZ, "Perfect quiz score!")
        
        await self.update_streak()
        await self.save()

    async def record_flashcard_review(self, correct: bool) -> None:
        """Record a flashcard review"""
        self.total_flashcards_reviewed += 1
        if correct:
            self.total_correct_answers += 1
        
        await self.save()

    @classmethod
    async def get_or_create(cls, user_id: str) -> "UserStudyStats":
        """Get existing stats or create new"""
        try:
            result = await repo_query(
                "SELECT * FROM user_study_stats WHERE user_id = $user_id",
                {"user_id": user_id}
            )
            
            if result:
                return cls(**result[0])
            
            # Create new stats
            stats = cls(user_id=user_id)
            await stats.save()
            return stats
        except Exception as e:
            logger.error(f"Error getting/creating study stats for user {user_id}: {str(e)}")
            raise DatabaseOperationError(e)
