"""
Study Plan API Router.
AI-generated personalized study schedules.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from loguru import logger

from open_notebook.domain.study_plan import (
    StudyPlan, StudyPlanCreate, StudyPlanUpdate,
    StudyPlanFull, StudyPlanWithTopics, StudyPlanStats,
    StudyTopic, StudyTopicCreate, StudyTopicUpdate,
    StudySession, StudySessionCreate, StudySessionUpdate,
    PlanAdjustment, PlanAdjustmentResponse,
    WeeklySchedule, DailySchedule,
    PlanGenerationRequest, PlanGenerationResult
)
from open_notebook.services.study_plan_service import study_plan_service

router = APIRouter(prefix="/study-plans", tags=["study-plans"])


# ============ Study Plan Endpoints ============

@router.post("", response_model=StudyPlan)
async def create_plan(data: StudyPlanCreate):
    """Create a new study plan."""
    return await study_plan_service.create_plan(data)


@router.post("/generate", response_model=PlanGenerationResult)
async def generate_plan(request: PlanGenerationRequest):
    """Generate a complete study plan using AI."""
    return await study_plan_service.generate_plan(request)


@router.get("", response_model=List[StudyPlan])
async def list_plans(
    notebook_id: Optional[str] = Query(None, description="Filter by notebook ID"),
    active_only: bool = Query(False, description="Only return active plans")
):
    """List study plans."""
    if notebook_id:
        plans = await study_plan_service.get_plans_for_notebook(notebook_id)
    elif active_only:
        plans = await study_plan_service.get_active_plans()
    else:
        plans = await study_plan_service.get_active_plans()  # Default to active
    return plans


@router.get("/today", response_model=List[StudySession])
async def get_today_sessions(plan_id: Optional[str] = Query(None)):
    """Get study sessions scheduled for today."""
    return await study_plan_service.get_today_sessions(plan_id)


@router.get("/{plan_id}", response_model=StudyPlanFull)
async def get_plan(plan_id: str):
    """Get a study plan with all details."""
    plan = await study_plan_service.get_plan_full(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    return plan


@router.patch("/{plan_id}", response_model=StudyPlan)
async def update_plan(plan_id: str, data: StudyPlanUpdate):
    """Update a study plan."""
    plan = await study_plan_service.update_plan(plan_id, data)
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    return plan


@router.delete("/{plan_id}")
async def delete_plan(plan_id: str):
    """Delete a study plan and all related data."""
    success = await study_plan_service.delete_plan(plan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Study plan not found")
    return {"status": "deleted", "plan_id": plan_id}


@router.get("/{plan_id}/stats", response_model=StudyPlanStats)
async def get_plan_stats(plan_id: str):
    """Get statistics for a study plan."""
    return await study_plan_service.get_plan_stats(plan_id)


@router.get("/{plan_id}/schedule", response_model=WeeklySchedule)
async def get_weekly_schedule(
    plan_id: str,
    week_start: Optional[datetime] = Query(None, description="Start of week (defaults to current week)")
):
    """Get weekly schedule for a study plan."""
    return await study_plan_service.get_weekly_schedule(plan_id, week_start)


# ============ Topic Endpoints ============

@router.post("/{plan_id}/topics", response_model=StudyTopic)
async def create_topic(plan_id: str, data: StudyTopicCreate):
    """Create a study topic."""
    if data.plan_id != plan_id:
        data.plan_id = plan_id
    return await study_plan_service.create_topic(data)


@router.get("/{plan_id}/topics", response_model=List[StudyTopic])
async def list_topics(plan_id: str):
    """List topics for a study plan."""
    return await study_plan_service.get_topics_for_plan(plan_id)


@router.get("/topics/{topic_id}", response_model=StudyTopic)
async def get_topic(topic_id: str):
    """Get a study topic."""
    topic = await study_plan_service.get_topic(topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@router.patch("/topics/{topic_id}", response_model=StudyTopic)
async def update_topic(topic_id: str, data: StudyTopicUpdate):
    """Update a study topic."""
    topic = await study_plan_service.update_topic(topic_id, data)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@router.delete("/topics/{topic_id}")
async def delete_topic(topic_id: str):
    """Delete a study topic."""
    success = await study_plan_service.delete_topic(topic_id)
    if not success:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {"status": "deleted", "topic_id": topic_id}


# ============ Session Endpoints ============

@router.post("/{plan_id}/sessions", response_model=StudySession)
async def create_session(plan_id: str, data: StudySessionCreate):
    """Create a study session."""
    if data.plan_id != plan_id:
        data.plan_id = plan_id
    return await study_plan_service.create_session(data)


@router.get("/{plan_id}/sessions", response_model=List[StudySession])
async def list_sessions(plan_id: str):
    """List sessions for a study plan."""
    return await study_plan_service.get_sessions_for_plan(plan_id)


@router.get("/sessions/{session_id}", response_model=StudySession)
async def get_session(session_id: str):
    """Get a study session."""
    session = await study_plan_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.patch("/sessions/{session_id}", response_model=StudySession)
async def update_session(session_id: str, data: StudySessionUpdate):
    """Update a study session."""
    session = await study_plan_service.update_session(session_id, data)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/sessions/{session_id}/start", response_model=StudySession)
async def start_session(session_id: str):
    """Start a study session."""
    session = await study_plan_service.start_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/sessions/{session_id}/complete", response_model=StudySession)
async def complete_session(
    session_id: str,
    rating: Optional[int] = Query(None, ge=1, le=5),
    notes: Optional[str] = Query(None)
):
    """Complete a study session."""
    try:
        logger.info(f"API: complete_session called with session_id={session_id}, rating={rating}, notes={notes}")
        session = await study_plan_service.complete_session(session_id, rating, notes)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        logger.info(f"API: Session completed successfully: {session.id}")
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API: Error completing session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a study session."""
    success = await study_plan_service.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted", "session_id": session_id}


@router.post("/sessions/{session_id}/skip", response_model=StudySession)
async def skip_session(
    session_id: str,
    reason: Optional[str] = Query(None, description="Reason for skipping")
):
    """Skip a study session."""
    session = await study_plan_service.skip_session(session_id, reason)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


# ============ Adjustment Endpoints ============

@router.get("/{plan_id}/adjustments", response_model=List[PlanAdjustment])
async def list_adjustments(plan_id: str):
    """List adjustments for a study plan."""
    return await study_plan_service.get_adjustments_for_plan(plan_id)


@router.post("/adjustments/{adjustment_id}/respond")
async def respond_to_adjustment(adjustment_id: str, response: PlanAdjustmentResponse):
    """Accept or reject a plan adjustment."""
    success = await study_plan_service.respond_to_adjustment(adjustment_id, response.accepted)
    return {"status": "accepted" if response.accepted else "rejected", "adjustment_id": adjustment_id}
