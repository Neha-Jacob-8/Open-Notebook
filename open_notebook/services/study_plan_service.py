"""
Study Plan Service.
AI-generated personalized study schedules based on content and deadlines.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
import json
from loguru import logger


def _get_now_tz():
    """Get current time that matches deadline timezone (UTC or naive based on SurrealDB return)."""
    return datetime.now(timezone.utc)


def _safe_days_diff(deadline, now):
    """Safely calculate days difference handling timezone mismatches."""
    try:
        # If deadline is timezone-aware and now is naive, make now aware
        if hasattr(deadline, 'tzinfo') and deadline.tzinfo is not None:
            if now.tzinfo is None:
                now = now.replace(tzinfo=timezone.utc)
        # If deadline is naive and now is aware, make deadline aware  
        elif now.tzinfo is not None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        return max(0, (deadline - now).days)
    except Exception:
        return 0

from open_notebook.domain.study_plan import (
    StudyPlan, StudyPlanCreate, StudyPlanUpdate, PlanStatus,
    StudyTopic, StudyTopicCreate, StudyTopicUpdate, TopicStatus, TopicDifficulty,
    StudySession, StudySessionCreate, StudySessionUpdate, SessionStatus, SessionType,
    PlanAdjustment, AdjustmentType, AdjustmentStatus,
    StudyPlanFull, StudyPlanWithTopics, StudyPlanStats,
    DailySchedule, WeeklySchedule,
    TopicAnalysis, PlanGenerationRequest, PlanGenerationResult
)
from open_notebook.database.repository import repo, ensure_record_id
from open_notebook.graphs.utils import provision_langchain_model


class StudyPlanService:
    """Service for managing study plans."""
    
    # Difficulty multipliers for time estimation
    DIFFICULTY_MULTIPLIERS = {
        TopicDifficulty.EASY: 0.8,
        TopicDifficulty.MEDIUM: 1.0,
        TopicDifficulty.HARD: 1.3,
    }
    
    # Session type durations in minutes
    SESSION_DURATIONS = {
        SessionType.LEARN: 45,
        SessionType.REVIEW: 30,
        SessionType.PRACTICE: 45,
        SessionType.QUIZ: 30,
    }
    
    async def create_plan(self, data: StudyPlanCreate) -> StudyPlan:
        """Create a new study plan."""
        now = datetime.now()
        plan_data = {
            "notebook_id": data.notebook_id,
            "title": data.title,
            "description": data.description,
            "deadline": data.deadline,  # Pass datetime directly, not isoformat
            "available_hours_per_day": data.available_hours_per_day,
            "total_study_hours": 0.0,
            "status": PlanStatus.ACTIVE.value,
            "progress_percentage": 0.0,
            "created_at": now,  # Pass datetime directly
            "updated_at": now,  # Pass datetime directly
        }
        
        result = await repo.create("study_plan", plan_data)
        logger.debug(f"repo.create result type: {type(result)}, value: {result}")
        # repo.create returns a list, extract first element
        if isinstance(result, list) and len(result) > 0:
            result = result[0]
            logger.debug(f"After list extraction type: {type(result)}, value: {result}")
        return self._parse_plan(result)
    
    async def get_plan(self, plan_id: str) -> Optional[StudyPlan]:
        """Get a study plan by ID."""
        result = await repo.get(plan_id if ":" in plan_id else f"study_plan:{plan_id}")
        if not result:
            return None
        return self._parse_plan(result)
    
    async def get_plan_full(self, plan_id: str) -> Optional[StudyPlanFull]:
        """Get complete study plan with all related data."""
        plan = await self.get_plan(plan_id)
        if not plan:
            return None
        
        topics = await self.get_topics_for_plan(plan_id)
        sessions = await self.get_sessions_for_plan(plan_id)
        adjustments = await self.get_adjustments_for_plan(plan_id)
        
        # Calculate additional fields
        now = datetime.now()
        days_remaining = _safe_days_diff(plan.deadline, now)
        completed_hours = sum(
            (s.actual_end - s.actual_start).total_seconds() / 3600
            for s in sessions
            if s.status == SessionStatus.COMPLETED and s.actual_start and s.actual_end
        )
        
        # Get upcoming sessions (next 7 days) - use timezone-safe comparison
        def is_upcoming(s):
            try:
                sched = s.scheduled_date
                n = now
                # Handle timezone mismatch
                if hasattr(sched, 'tzinfo') and sched.tzinfo is not None and n.tzinfo is None:
                    n = n.replace(tzinfo=timezone.utc)
                elif n.tzinfo is not None and (not hasattr(sched, 'tzinfo') or sched.tzinfo is None):
                    sched = sched.replace(tzinfo=timezone.utc)
                return s.status == SessionStatus.SCHEDULED and sched > n
            except:
                return False
        upcoming = [s for s in sessions if is_upcoming(s)][:10]
        
        return StudyPlanFull(
            **plan.model_dump(),
            topics=topics,
            sessions=sessions,
            adjustments=adjustments,
            days_remaining=days_remaining,
            completed_hours=completed_hours,
            upcoming_sessions=upcoming,
        )
    
    async def get_plans_for_notebook(self, notebook_id: str) -> List[StudyPlan]:
        """Get all study plans for a notebook."""
        query = """
            SELECT * FROM study_plan
            WHERE notebook_id = $notebook_id
            ORDER BY created_at DESC
        """
        results = await repo.query(query, {"notebook_id": notebook_id})
        return [self._parse_plan(r) for r in results]
    
    async def get_active_plans(self) -> List[StudyPlan]:
        """Get all active study plans."""
        query = """
            SELECT * FROM study_plan
            WHERE status = 'active'
            ORDER BY deadline ASC
        """
        results = await repo.query(query, {})
        return [self._parse_plan(r) for r in results]
    
    async def update_plan(self, plan_id: str, data: StudyPlanUpdate) -> Optional[StudyPlan]:
        """Update a study plan."""
        update_data = data.model_dump(exclude_unset=True)
        if "deadline" in update_data and update_data["deadline"]:
            update_data["deadline"] = update_data["deadline"].isoformat()
        if "status" in update_data and update_data["status"]:
            update_data["status"] = update_data["status"].value
        update_data["updated_at"] = datetime.now().isoformat()
        
        full_plan_id = plan_id if ":" in plan_id else f"study_plan:{plan_id}"
        result = await repo.update(full_plan_id, update_data)
        if not result:
            return None
        return self._parse_plan(result)
    
    async def delete_plan(self, plan_id: str) -> bool:
        """Delete a study plan and all related data."""
        # Delete related data first
        await repo.query("DELETE FROM study_session WHERE plan_id = $plan_id", {"plan_id": plan_id})
        await repo.query("DELETE FROM study_topic WHERE plan_id = $plan_id", {"plan_id": plan_id})
        await repo.query("DELETE FROM plan_adjustment WHERE plan_id = $plan_id", {"plan_id": plan_id})
        
        full_plan_id = plan_id if ":" in plan_id else f"study_plan:{plan_id}"
        return await repo.delete(full_plan_id)
    
    # Topic methods
    
    async def create_topic(self, data: StudyTopicCreate) -> StudyTopic:
        """Create a study topic."""
        topic_data = {
            "plan_id": data.plan_id,
            "name": data.name,
            "description": data.description,
            "difficulty": data.difficulty.value,
            "estimated_hours": data.estimated_hours,
            "priority": data.priority,
            "source_ids": data.source_ids,
            "prerequisites": data.prerequisites,
            "status": TopicStatus.NOT_STARTED.value,
            "mastery_level": 0.0,
            "created_at": datetime.now().isoformat(),
        }
        
        result = await repo.create("study_topic", topic_data)
        # repo.create returns a list, extract first element
        if isinstance(result, list) and len(result) > 0:
            result = result[0]
        
        # Update plan total hours
        await self._update_plan_total_hours(data.plan_id)
        
        return self._parse_topic(result)
    
    async def get_topic(self, topic_id: str) -> Optional[StudyTopic]:
        """Get a topic by ID."""
        full_topic_id = topic_id if ":" in topic_id else f"study_topic:{topic_id}"
        result = await repo.get(full_topic_id)
        if not result:
            return None
        return self._parse_topic(result)
    
    async def get_topics_for_plan(self, plan_id: str) -> List[StudyTopic]:
        """Get all topics for a plan."""
        query = """
            SELECT * FROM study_topic
            WHERE plan_id = $plan_id
            ORDER BY priority DESC, created_at ASC
        """
        results = await repo.query(query, {"plan_id": plan_id})
        return [self._parse_topic(r) for r in results]
    
    async def update_topic(self, topic_id: str, data: StudyTopicUpdate) -> Optional[StudyTopic]:
        """Update a topic."""
        update_data = data.model_dump(exclude_unset=True)
        if "difficulty" in update_data and update_data["difficulty"]:
            update_data["difficulty"] = update_data["difficulty"].value
        if "status" in update_data and update_data["status"]:
            update_data["status"] = update_data["status"].value
        
        full_topic_id = topic_id if ":" in topic_id else f"study_topic:{topic_id}"
        result = await repo.update(full_topic_id, update_data)
        if not result:
            return None
        
        topic = self._parse_topic(result)
        await self._update_plan_progress(topic.plan_id)
        
        return topic
    
    async def delete_topic(self, topic_id: str) -> bool:
        """Delete a topic and its sessions."""
        topic = await self.get_topic(topic_id)
        if not topic:
            return False
        
        await repo.query("DELETE FROM study_session WHERE topic_id = $topic_id", {"topic_id": topic_id})
        full_topic_id = topic_id if ":" in topic_id else f"study_topic:{topic_id}"
        await repo.delete(full_topic_id)
        await self._update_plan_total_hours(topic.plan_id)
        
        return True
    
    # Session methods
    
    async def create_session(self, data: StudySessionCreate) -> StudySession:
        """Create a study session."""
        session_data = {
            "plan_id": data.plan_id,
            "topic_id": data.topic_id,
            "scheduled_date": data.scheduled_date.isoformat(),
            "scheduled_duration_minutes": data.scheduled_duration_minutes,
            "session_type": data.session_type.value,
            "status": SessionStatus.SCHEDULED.value,
            "created_at": datetime.now().isoformat(),
        }
        
        result = await repo.create("study_session", session_data)
        # repo.create returns a list, extract first element
        if isinstance(result, list) and len(result) > 0:
            result = result[0]
        return self._parse_session(result)
    
    async def get_session(self, session_id: str) -> Optional[StudySession]:
        """Get a session by ID."""
        full_session_id = session_id if ":" in session_id else f"study_session:{session_id}"
        result = await repo.get(full_session_id)
        if not result:
            return None
        return self._parse_session(result)
    
    async def get_sessions_for_plan(self, plan_id: str) -> List[StudySession]:
        """Get all sessions for a plan."""
        query = """
            SELECT * FROM study_session
            WHERE plan_id = $plan_id
            ORDER BY scheduled_date ASC
        """
        results = await repo.query(query, {"plan_id": plan_id})
        return [self._parse_session(r) for r in results]
    
    async def get_sessions_for_topic(self, topic_id: str) -> List[StudySession]:
        """Get all sessions for a topic."""
        query = """
            SELECT * FROM study_session
            WHERE topic_id = $topic_id
            ORDER BY scheduled_date ASC
        """
        results = await repo.query(query, {"topic_id": topic_id})
        return [self._parse_session(r) for r in results]
    
    async def get_today_sessions(self, plan_id: Optional[str] = None) -> List[StudySession]:
        """Get sessions scheduled for today."""
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        if plan_id:
            query = """
                SELECT * FROM study_session
                WHERE plan_id = $plan_id
                AND scheduled_date >= $start AND scheduled_date < $end
                ORDER BY scheduled_date ASC
            """
            params = {"plan_id": plan_id, "start": today_start.isoformat(), "end": today_end.isoformat()}
        else:
            query = """
                SELECT * FROM study_session
                WHERE scheduled_date >= $start AND scheduled_date < $end
                ORDER BY scheduled_date ASC
            """
            params = {"start": today_start.isoformat(), "end": today_end.isoformat()}
        
        results = await repo.query(query, params)
        return [self._parse_session(r) for r in results]
    
    async def update_session(self, session_id: str, data: StudySessionUpdate) -> Optional[StudySession]:
        """Update a session."""
        update_data = data.model_dump(exclude_unset=True)
        for date_field in ["scheduled_date", "actual_start", "actual_end"]:
            if date_field in update_data and update_data[date_field]:
                update_data[date_field] = update_data[date_field].isoformat()
        if "session_type" in update_data and update_data["session_type"]:
            update_data["session_type"] = update_data["session_type"].value
        if "status" in update_data and update_data["status"]:
            update_data["status"] = update_data["status"].value
        
        full_session_id = session_id if ":" in session_id else f"study_session:{session_id}"
        result = await repo.update(full_session_id, update_data)
        if not result:
            return None
        
        session = self._parse_session(result)
        
        # Update plan progress if session completed
        if data.status == SessionStatus.COMPLETED:
            await self._update_plan_progress(session.plan_id)
        
        return session
    
    async def start_session(self, session_id: str) -> Optional[StudySession]:
        """Start a study session."""
        return await self.update_session(
            session_id,
            StudySessionUpdate(
                status=SessionStatus.IN_PROGRESS,
                actual_start=datetime.now()
            )
        )
    
    async def complete_session(self, session_id: str, rating: Optional[int] = None, notes: Optional[str] = None) -> Optional[StudySession]:
        """Complete a study session."""
        logger.info(f"Completing session {session_id} with rating={rating}, notes={notes}")
        
        # Get the session first to know its topic
        existing_session = await self.get_session(session_id)
        if not existing_session:
            logger.warning(f"Session {session_id} not found")
            return None
        
        logger.info(f"Found existing session, topic_id={existing_session.topic_id}, plan_id={existing_session.plan_id}")
        
        session = await self.update_session(
            session_id,
            StudySessionUpdate(
                status=SessionStatus.COMPLETED,
                actual_end=datetime.now(),
                rating=rating,
                notes=notes
            )
        )
        
        if session:
            logger.info(f"Session updated to COMPLETED, now updating topic mastery and plan progress")
            # Update topic mastery when session completes
            await self._update_topic_mastery(session.topic_id)
            # Force progress recalculation
            await self._update_plan_progress(session.plan_id)
            logger.info(f"Progress update complete for plan {session.plan_id}")
        else:
            logger.error(f"Failed to update session {session_id}")
        
        return session
    
    async def skip_session(self, session_id: str, reason: Optional[str] = None) -> Optional[StudySession]:
        """Skip a study session."""
        return await self.update_session(
            session_id,
            StudySessionUpdate(
                status=SessionStatus.SKIPPED,
                notes=reason or "Session skipped"
            )
        )
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        return await repo.delete("study_session", session_id)
    
    # Adjustment methods
    
    async def get_adjustments_for_plan(self, plan_id: str) -> List[PlanAdjustment]:
        """Get all adjustments for a plan."""
        query = """
            SELECT * FROM plan_adjustment
            WHERE plan_id = $plan_id
            ORDER BY created_at DESC
        """
        results = await repo.query(query, {"plan_id": plan_id})
        return [self._parse_adjustment(r) for r in results]
    
    async def respond_to_adjustment(self, adjustment_id: str, accepted: bool) -> bool:
        """Accept or reject a plan adjustment."""
        status = AdjustmentStatus.ACCEPTED if accepted else AdjustmentStatus.REJECTED
        full_adjustment_id = adjustment_id if ":" in adjustment_id else f"plan_adjustment:{adjustment_id}"
        await repo.update(full_adjustment_id, {"status": status.value})
        
        if accepted:
            # Apply the adjustment
            adjustment = await repo.get(full_adjustment_id)
            if adjustment:
                await self._apply_adjustment(self._parse_adjustment(adjustment))
        
        return True
    
    # Schedule methods
    
    async def get_weekly_schedule(self, plan_id: str, week_start: Optional[datetime] = None) -> WeeklySchedule:
        """Get weekly schedule for a plan."""
        if not week_start:
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = today - timedelta(days=today.weekday())  # Monday
        
        week_end = week_start + timedelta(days=7)
        
        # Get sessions for the week
        query = """
            SELECT * FROM study_session
            WHERE plan_id = $plan_id
            AND scheduled_date >= $start AND scheduled_date < $end
            ORDER BY scheduled_date ASC
        """
        results = await repo.query(query, {
            "plan_id": plan_id,
            "start": week_start.isoformat(),
            "end": week_end.isoformat()
        })
        sessions = [self._parse_session(r) for r in results]
        
        # Group by day
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        days = []
        total_planned = 0.0
        total_completed = 0.0
        
        for i in range(7):
            day_date = week_start + timedelta(days=i)
            day_sessions = [s for s in sessions if s.scheduled_date.date() == day_date.date()]
            day_hours = sum(s.scheduled_duration_minutes for s in day_sessions) / 60
            total_planned += day_hours
            
            completed_hours = sum(
                (s.actual_end - s.actual_start).total_seconds() / 3600
                for s in day_sessions
                if s.status == SessionStatus.COMPLETED and s.actual_start and s.actual_end
            )
            total_completed += completed_hours
            
            days.append(DailySchedule(
                date=day_date,
                sessions=day_sessions,
                total_hours=day_hours,
                is_today=day_date.date() == today.date()
            ))
        
        return WeeklySchedule(
            plan_id=plan_id,
            week_start=week_start,
            week_end=week_end,
            days=days,
            total_planned_hours=total_planned,
            total_completed_hours=total_completed
        )
    
    async def get_plan_stats(self, plan_id: str) -> StudyPlanStats:
        """Get statistics for a study plan."""
        plan = await self.get_plan(plan_id)
        if not plan:
            return StudyPlanStats(plan_id=plan_id)
        
        topics = await self.get_topics_for_plan(plan_id)
        sessions = await self.get_sessions_for_plan(plan_id)
        
        completed_topics = sum(1 for t in topics if t.status == TopicStatus.COMPLETED)
        completed_sessions = [s for s in sessions if s.status == SessionStatus.COMPLETED]
        
        total_planned_hours = plan.total_study_hours
        total_completed_hours = sum(
            (s.actual_end - s.actual_start).total_seconds() / 3600
            for s in completed_sessions
            if s.actual_start and s.actual_end
        )
        
        ratings = [s.rating for s in completed_sessions if s.rating]
        average_rating = sum(ratings) / len(ratings) if ratings else None
        
        now = datetime.now()
        days_remaining = _safe_days_diff(plan.deadline, now)
        remaining_hours = total_planned_hours - total_completed_hours
        hours_per_day_needed = remaining_hours / days_remaining if days_remaining > 0 else remaining_hours
        
        on_track = hours_per_day_needed <= plan.available_hours_per_day * 1.2  # 20% buffer
        
        return StudyPlanStats(
            plan_id=plan_id,
            total_topics=len(topics),
            completed_topics=completed_topics,
            total_sessions=len(sessions),
            completed_sessions=len(completed_sessions),
            total_planned_hours=total_planned_hours,
            total_completed_hours=total_completed_hours,
            average_rating=average_rating,
            on_track=on_track,
            days_remaining=days_remaining,
            hours_per_day_needed=hours_per_day_needed
        )
    
    # AI-powered plan generation
    
    async def generate_plan(self, request: PlanGenerationRequest) -> PlanGenerationResult:
        """Generate a complete study plan using AI."""
        warnings = []
        
        # 1. Create the base plan
        plan = await self.create_plan(StudyPlanCreate(
            notebook_id=request.notebook_id,
            title=request.title,
            description=request.description,
            deadline=request.deadline,
            available_hours_per_day=request.available_hours_per_day
        ))
        
        # 2. Get notebook sources (sources are connected via 'reference' relationship)
        logger.info(f"Generating plan for notebook: {request.notebook_id}")
        sources_query = """
            SELECT in.* as source FROM reference 
            WHERE out = $notebook_id
            FETCH source
        """
        notebook_id_value = ensure_record_id(f"notebook:{request.notebook_id.replace('notebook:', '')}")
        logger.debug(f"Querying sources with notebook_id: {notebook_id_value}")
        sources_result = await repo.query(sources_query, {"notebook_id": notebook_id_value})
        logger.info(f"Found {len(sources_result)} sources")
        
        # Extract the actual source data from the query result
        sources_data = []
        for r in sources_result:
            if r.get("source"):
                sources_data.append(r["source"])
        logger.info(f"Extracted {len(sources_data)} source objects")
        
        if not sources_data:
            warnings.append("No sources found in notebook. Add sources to generate topics.")
            logger.warning("No sources found in notebook - returning empty plan")
            return PlanGenerationResult(
                plan=plan,
                topics=[],
                sessions=[],
                total_hours=0,
                days_with_sessions=0,
                warnings=warnings
            )
        
        # 3. Extract topics using AI
        source_contents = "\n\n---\n\n".join([
            f"Source: {s.get('title', 'Untitled')}\n{s.get('full_text', '')[:2000]}"
            for s in sources_data[:10]  # Limit to 10 sources
        ])
        logger.debug(f"Source content length: {len(source_contents)} chars")
        
        topic_analysis = await self._extract_topics_with_ai(source_contents, request.focus_areas)
        logger.info(f"AI extracted {len(topic_analysis)} topics")
        
        # 4. Create topics
        created_topics = []
        for analysis in topic_analysis:
            topic = await self.create_topic(StudyTopicCreate(
                plan_id=plan.id,
                name=analysis.name,
                description=analysis.description,
                difficulty=analysis.difficulty,
                estimated_hours=analysis.estimated_hours,
                priority=analysis.priority,
                source_ids=analysis.source_ids,
                prerequisites=analysis.prerequisites
            ))
            created_topics.append(topic)
        
        # 5. Calculate total hours and check feasibility
        total_hours = sum(t.estimated_hours for t in created_topics)
        days_until_deadline = max(1, _safe_days_diff(request.deadline, datetime.now()))
        available_hours = days_until_deadline * request.available_hours_per_day
        
        if total_hours > available_hours:
            warnings.append(
                f"Estimated {total_hours:.1f} hours needed but only {available_hours:.1f} hours available. "
                "Consider extending deadline or increasing daily study time."
            )
        
        # 6. Generate sessions
        created_sessions = await self._generate_sessions(
            plan=plan,
            topics=created_topics,
            include_reviews=request.include_reviews,
            include_practice=request.include_practice
        )
        
        # 7. Update plan total hours
        await self._update_plan_total_hours(plan.id)
        plan = await self.get_plan(plan.id)
        
        # Count days with sessions
        session_dates = set(s.scheduled_date.date() for s in created_sessions)
        
        return PlanGenerationResult(
            plan=plan,
            topics=created_topics,
            sessions=created_sessions,
            total_hours=total_hours,
            days_with_sessions=len(session_dates),
            warnings=warnings
        )
    
    async def _extract_topics_with_ai(
        self, 
        source_content: str, 
        focus_areas: Optional[List[str]] = None
    ) -> List[TopicAnalysis]:
        """Use AI to extract study topics from source content."""
        logger.info(f"Starting AI topic extraction, content length: {len(source_content)}")
        
        if not source_content or len(source_content.strip()) < 50:
            logger.warning("Source content too short for topic extraction")
            # Generate better fallback topics based on available time
            return [
                TopicAnalysis(
                    name="Core Concepts Review",
                    description="Review and understand the main concepts from your materials",
                    difficulty=TopicDifficulty.MEDIUM,
                    estimated_hours=4.0,
                    priority=10,
                    source_ids=[],
                    prerequisites=[],
                    key_concepts=[]
                ),
                TopicAnalysis(
                    name="Practice & Application",
                    description="Apply learned concepts through practice exercises",
                    difficulty=TopicDifficulty.MEDIUM,
                    estimated_hours=3.0,
                    priority=8,
                    source_ids=[],
                    prerequisites=["Core Concepts Review"],
                    key_concepts=[]
                ),
                TopicAnalysis(
                    name="Review & Consolidation",
                    description="Final review and knowledge consolidation",
                    difficulty=TopicDifficulty.EASY,
                    estimated_hours=2.0,
                    priority=6,
                    source_ids=[],
                    prerequisites=["Practice & Application"],
                    key_concepts=[]
                )
            ]
        
        focus_instruction = ""
        if focus_areas:
            focus_instruction = f"\n\nFocus on these areas: {', '.join(focus_areas)}"
        
        prompt = f"""Analyze the following content and extract key study topics.

For each topic, provide:
1. name: A clear, concise topic name
2. description: Brief description of what the topic covers
3. difficulty: easy, medium, or hard
4. estimated_hours: How many hours to study this topic (0.5-8 hours)
5. priority: 1-10 (10 being most important/foundational)
6. key_concepts: List of key concepts within this topic
7. prerequisites: Names of other topics that should be studied first

Return as a JSON array of topics. Limit to 5-10 most important topics.
{focus_instruction}

Content:
{source_content}

Return ONLY valid JSON array, no markdown formatting."""

        try:
            # Use the LangChain model provisioning
            logger.debug("Provisioning LangChain model for topic extraction...")
            llm = await provision_langchain_model(prompt, None, "study_plan")
            logger.debug("Invoking LLM...")
            response = await llm.ainvoke(prompt)
            response_text = response.content if hasattr(response, 'content') else str(response)
            logger.debug(f"LLM response length: {len(response_text)}")
            
            # Parse JSON response - clean markdown if present
            response_text = response_text.strip()
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                response_text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
            
            topics_data = json.loads(response_text)
            logger.info(f"Parsed {len(topics_data)} topics from AI response")
            
            topics = []
            for t in topics_data:
                topics.append(TopicAnalysis(
                    name=t.get("name", "Unknown Topic"),
                    description=t.get("description", ""),
                    difficulty=TopicDifficulty(t.get("difficulty", "medium").lower()),
                    estimated_hours=float(t.get("estimated_hours", 2.0)),
                    priority=int(t.get("priority", 5)),
                    source_ids=[],  # Would need to map back to actual sources
                    prerequisites=t.get("prerequisites", []),
                    key_concepts=t.get("key_concepts", [])
                ))
            
            logger.info(f"Successfully created {len(topics)} TopicAnalysis objects")
            return topics
            
        except Exception as e:
            logger.error(f"Error extracting topics with AI: {e}", exc_info=True)
            # Return better fallback topics
            return [
                TopicAnalysis(
                    name="Core Material Study",
                    description="Study the main content and concepts",
                    difficulty=TopicDifficulty.MEDIUM,
                    estimated_hours=4.0,
                    priority=10,
                    source_ids=[],
                    prerequisites=[],
                    key_concepts=[]
                ),
                TopicAnalysis(
                    name="Deep Dive & Practice",
                    description="Practice and reinforce understanding",
                    difficulty=TopicDifficulty.MEDIUM,
                    estimated_hours=3.0,
                    priority=8,
                    source_ids=[],
                    prerequisites=["Core Material Study"],
                    key_concepts=[]
                ),
                TopicAnalysis(
                    name="Final Review",
                    description="Final review and preparation",
                    difficulty=TopicDifficulty.EASY,
                    estimated_hours=2.0,
                    priority=6,
                    source_ids=[],
                    prerequisites=["Deep Dive & Practice"],
                    key_concepts=[]
                )
            ]
    
    async def _generate_sessions(
        self,
        plan: StudyPlan,
        topics: List[StudyTopic],
        include_reviews: bool = True,
        include_practice: bool = True
    ) -> List[StudySession]:
        """Generate study sessions for topics."""
        sessions = []
        current_date = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
        
        # Normalize deadline to naive datetime for comparison
        deadline = plan.deadline
        if hasattr(deadline, 'tzinfo') and deadline.tzinfo is not None:
            deadline = deadline.replace(tzinfo=None)
        
        logger.info(f"Generating sessions: current_date={current_date}, deadline={deadline}, available_hours={plan.available_hours_per_day}")
        
        # If current time is past 9am, start tomorrow
        if current_date < datetime.now():
            current_date += timedelta(days=1)
        
        daily_hours_used = 0.0
        
        # Sort topics by priority and prerequisites
        sorted_topics = sorted(topics, key=lambda t: (-t.priority, t.created_at))
        logger.info(f"Processing {len(sorted_topics)} topics for session generation")
        
        for topic in sorted_topics:
            logger.info(f"Topic: {topic.name}, estimated_hours={topic.estimated_hours}, difficulty={topic.difficulty}")
            # Calculate number of learn sessions needed
            hours_remaining = topic.estimated_hours
            session_count = 0
            
            while hours_remaining > 0:
                session_duration = min(self.SESSION_DURATIONS[SessionType.LEARN], hours_remaining * 60)
                
                # Check if we have time today
                if daily_hours_used + (session_duration / 60) > plan.available_hours_per_day:
                    current_date += timedelta(days=1)
                    daily_hours_used = 0.0
                
                # Don't schedule past deadline
                if current_date >= deadline:
                    break
                
                # Create learn session
                session = await self.create_session(StudySessionCreate(
                    plan_id=plan.id,
                    topic_id=topic.id,
                    scheduled_date=current_date,
                    scheduled_duration_minutes=int(session_duration),
                    session_type=SessionType.LEARN
                ))
                sessions.append(session)
                
                hours_remaining -= session_duration / 60
                daily_hours_used += session_duration / 60
                session_count += 1
                
                # Move to next time slot
                current_date += timedelta(hours=1)
            
            # Add review session (3 days after last learn session)
            if include_reviews and session_count > 0:
                review_date = current_date + timedelta(days=3)
                if review_date < deadline:
                    review_session = await self.create_session(StudySessionCreate(
                        plan_id=plan.id,
                        topic_id=topic.id,
                        scheduled_date=review_date,
                        scheduled_duration_minutes=self.SESSION_DURATIONS[SessionType.REVIEW],
                        session_type=SessionType.REVIEW
                    ))
                    sessions.append(review_session)
            
            # Add practice session for hard topics
            if include_practice and topic.difficulty == TopicDifficulty.HARD:
                practice_date = current_date + timedelta(days=1)
                if practice_date < deadline:
                    practice_session = await self.create_session(StudySessionCreate(
                        plan_id=plan.id,
                        topic_id=topic.id,
                        scheduled_date=practice_date,
                        scheduled_duration_minutes=self.SESSION_DURATIONS[SessionType.PRACTICE],
                        session_type=SessionType.PRACTICE
                    ))
                    sessions.append(practice_session)
        
        logger.info(f"Generated {len(sessions)} total sessions for plan")
        return sessions
    
    # Helper methods
    
    async def _update_plan_total_hours(self, plan_id: str) -> None:
        """Update the total study hours for a plan."""
        topics = await self.get_topics_for_plan(plan_id)
        total_hours = sum(t.estimated_hours for t in topics)
        full_plan_id = plan_id if ":" in plan_id else f"study_plan:{plan_id}"
        await repo.update(full_plan_id, {
            "total_study_hours": total_hours,
            "updated_at": datetime.now().isoformat()
        })
    
    async def _update_plan_progress(self, plan_id: str) -> None:
        """Update the progress percentage for a plan based on completed sessions."""
        sessions = await self.get_sessions_for_plan(plan_id)
        if not sessions:
            return
        
        # Calculate progress based on completed session time vs total session time
        total_minutes = sum(s.scheduled_duration_minutes for s in sessions)
        completed_minutes = sum(
            s.scheduled_duration_minutes 
            for s in sessions 
            if s.status == SessionStatus.COMPLETED
        )
        
        progress = (completed_minutes / total_minutes * 100) if total_minutes > 0 else 0
        
        status = PlanStatus.ACTIVE
        if progress >= 100:
            status = PlanStatus.COMPLETED
        elif progress >= 95:  # Almost done
            status = PlanStatus.ACTIVE
        
        full_plan_id = plan_id if ":" in plan_id else f"study_plan:{plan_id}"
        await repo.update(full_plan_id, {
            "progress_percentage": progress,
            "status": status.value,
            "updated_at": datetime.now().isoformat()
        })
        logger.info(f"Updated plan {plan_id} progress to {progress:.1f}%")
    
    async def _update_topic_mastery(self, topic_id: str) -> None:
        """Update topic mastery based on completed sessions."""
        topic = await self.get_topic(topic_id)
        if not topic:
            return
        
        sessions = await self.get_sessions_for_topic(topic_id)
        if not sessions:
            return
        
        # Calculate mastery based on:
        # 1. Percentage of sessions completed
        # 2. Average rating (if available)
        total_sessions = len(sessions)
        completed_sessions = [s for s in sessions if s.status == SessionStatus.COMPLETED]
        completion_ratio = len(completed_sessions) / total_sessions if total_sessions > 0 else 0
        
        # Average rating contribution (0-1 scale)
        ratings = [s.rating for s in completed_sessions if s.rating]
        avg_rating = sum(ratings) / len(ratings) / 5 if ratings else 0.5
        
        # Mastery = 70% completion + 30% quality (rating)
        mastery = (completion_ratio * 0.7 + avg_rating * 0.3) * 100
        
        # Determine topic status
        new_status = topic.status
        if mastery >= 80:
            new_status = TopicStatus.COMPLETED
        elif mastery > 0:
            new_status = TopicStatus.IN_PROGRESS
        
        full_topic_id = topic_id if ":" in topic_id else f"study_topic:{topic_id}"
        await repo.update(full_topic_id, {
            "mastery_level": mastery,
            "status": new_status.value
        })
        logger.info(f"Updated topic {topic_id} mastery to {mastery:.1f}%, status: {new_status.value}")
    
    async def _apply_adjustment(self, adjustment: PlanAdjustment) -> None:
        """Apply an accepted adjustment to the plan."""
        if adjustment.adjustment_type == AdjustmentType.EXTEND_DEADLINE:
            if adjustment.suggested_value:
                await repo.update("study_plan", adjustment.plan_id, {
                    "deadline": adjustment.suggested_value
                })
        elif adjustment.adjustment_type == AdjustmentType.INCREASE_HOURS:
            if adjustment.suggested_value:
                await repo.update("study_plan", adjustment.plan_id, {
                    "available_hours_per_day": float(adjustment.suggested_value)
                })
        # Add more adjustment types as needed
    
    def _parse_plan(self, data: Dict[str, Any]) -> StudyPlan:
        """Parse plan from database result."""
        # Handle unexpected data types - sometimes SurrealDB returns wrapped results
        if isinstance(data, str):
            # If it's a string ID, we need to fetch the full record
            logger.warning(f"_parse_plan received string instead of dict: {data}")
            raise ValueError(f"Invalid plan data format: expected dict, got string '{data}'")
        
        if isinstance(data, list):
            if len(data) > 0:
                data = data[0]
            else:
                raise ValueError("Empty list returned from database")
        
        if not isinstance(data, dict):
            raise ValueError(f"Invalid plan data format: expected dict, got {type(data)}")
        
        plan_id = data.get("id", "")
        if isinstance(plan_id, dict):
            plan_id = f"{plan_id.get('tb', '')}:{plan_id.get('id', {}).get('String', '')}"
        
        return StudyPlan(
            id=str(plan_id),
            notebook_id=data.get("notebook_id", ""),
            title=data.get("title", ""),
            description=data.get("description"),
            deadline=self._parse_datetime(data.get("deadline")),
            available_hours_per_day=float(data.get("available_hours_per_day", 2.0)),
            total_study_hours=float(data.get("total_study_hours", 0.0)),
            status=PlanStatus(data.get("status", "active")),
            progress_percentage=float(data.get("progress_percentage", 0.0)),
            created_at=self._parse_datetime(data.get("created_at")),
            updated_at=self._parse_datetime(data.get("updated_at")),
        )
    
    def _parse_topic(self, data: Dict[str, Any]) -> StudyTopic:
        """Parse topic from database result."""
        # Handle list input (from repo.update which returns a list)
        if isinstance(data, list):
            if len(data) > 0:
                data = data[0]
            else:
                raise ValueError("Empty list returned from database")
        
        if not isinstance(data, dict):
            raise ValueError(f"Invalid topic data format: expected dict, got {type(data)}")
        
        topic_id = data.get("id", "")
        if isinstance(topic_id, dict):
            topic_id = f"{topic_id.get('tb', '')}:{topic_id.get('id', {}).get('String', '')}"
        
        return StudyTopic(
            id=str(topic_id),
            plan_id=data.get("plan_id", ""),
            name=data.get("name", ""),
            description=data.get("description"),
            difficulty=TopicDifficulty(data.get("difficulty", "medium")),
            estimated_hours=float(data.get("estimated_hours", 1.0)),
            priority=int(data.get("priority", 5)),
            source_ids=data.get("source_ids", []),
            prerequisites=data.get("prerequisites", []),
            status=TopicStatus(data.get("status", "not_started")),
            mastery_level=float(data.get("mastery_level", 0.0)),
            created_at=self._parse_datetime(data.get("created_at")),
        )
    
    def _parse_session(self, data: Dict[str, Any]) -> StudySession:
        """Parse session from database result."""
        # Handle list input (from repo.update which returns a list)
        if isinstance(data, list):
            if len(data) > 0:
                data = data[0]
            else:
                raise ValueError("Empty list returned from database")
        
        if not isinstance(data, dict):
            raise ValueError(f"Invalid session data format: expected dict, got {type(data)}")
        
        session_id = data.get("id", "")
        if isinstance(session_id, dict):
            session_id = f"{session_id.get('tb', '')}:{session_id.get('id', {}).get('String', '')}"
        
        return StudySession(
            id=str(session_id),
            plan_id=data.get("plan_id", ""),
            topic_id=data.get("topic_id", ""),
            scheduled_date=self._parse_datetime(data.get("scheduled_date")),
            scheduled_duration_minutes=int(data.get("scheduled_duration_minutes", 45)),
            actual_start=self._parse_datetime(data.get("actual_start")) if data.get("actual_start") else None,
            actual_end=self._parse_datetime(data.get("actual_end")) if data.get("actual_end") else None,
            session_type=SessionType(data.get("session_type", "learn")),
            status=SessionStatus(data.get("status", "scheduled")),
            notes=data.get("notes"),
            rating=data.get("rating"),
            created_at=self._parse_datetime(data.get("created_at")),
        )
    
    def _parse_adjustment(self, data: Dict[str, Any]) -> PlanAdjustment:
        """Parse adjustment from database result."""
        # Handle list input (from repo.update which returns a list)
        if isinstance(data, list):
            if len(data) > 0:
                data = data[0]
            else:
                raise ValueError("Empty list returned from database")
        
        if not isinstance(data, dict):
            raise ValueError(f"Invalid adjustment data format: expected dict, got {type(data)}")
        
        adj_id = data.get("id", "")
        if isinstance(adj_id, dict):
            adj_id = f"{adj_id.get('tb', '')}:{adj_id.get('id', {}).get('String', '')}"
        
        return PlanAdjustment(
            id=str(adj_id),
            plan_id=data.get("plan_id", ""),
            adjustment_type=AdjustmentType(data.get("adjustment_type", "reschedule")),
            reason=data.get("reason", ""),
            original_value=data.get("original_value"),
            suggested_value=data.get("suggested_value"),
            status=AdjustmentStatus(data.get("status", "pending")),
            created_at=self._parse_datetime(data.get("created_at")),
        )
    
    def _parse_datetime(self, value: Any) -> datetime:
        """Parse datetime from various formats."""
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except:
                return datetime.now()
        return datetime.now()


# Singleton instance
study_plan_service = StudyPlanService()
