"""
Auto-Update Agent API Router

Endpoints for managing source monitoring and update notifications.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from loguru import logger

from open_notebook.domain.auto_update import (
    SourceMonitor,
    UpdateNotification,
    MonitorJobRun,
    SourceMonitorCreate,
    SourceMonitorUpdate,
    NotificationAction,
    MonitoringStats,
)
from open_notebook.services.auto_update_service import auto_update_service


router = APIRouter(prefix="/monitoring", tags=["monitoring"])


# ============================================================================
# Response Models
# ============================================================================

class SourceMonitorResponse(BaseModel):
    """Response model for source monitor."""
    id: Optional[str] = None
    source_id: str
    enabled: bool
    check_frequency: str
    last_checked_at: Optional[str] = None
    last_content_hash: Optional[str] = None
    consecutive_failures: int = 0


class NotificationResponse(BaseModel):
    """Response model for notification."""
    id: Optional[str] = None
    source_id: str
    source_title: str
    change_summary: str
    diff_highlights: List[str]
    old_content_preview: Optional[str] = None
    new_content_preview: Optional[str] = None
    severity: str
    is_read: bool
    is_dismissed: bool
    created_at: str


class JobRunResponse(BaseModel):
    """Response model for job run."""
    id: Optional[str] = None
    started_at: str
    completed_at: Optional[str] = None
    status: str
    sources_checked: int
    updates_found: int
    errors: List[str]


class StatsResponse(BaseModel):
    """Response model for monitoring stats."""
    total_monitors: int
    enabled_monitors: int
    unread_notifications: int
    last_job_run: Optional[str] = None
    last_job_status: Optional[str] = None


# ============================================================================
# Monitor Endpoints
# ============================================================================

@router.post("/monitors", response_model=SourceMonitorResponse)
async def create_monitor(request: SourceMonitorCreate):
    """
    Create or update monitoring for a source.
    
    If monitoring already exists for the source, it will be updated.
    """
    try:
        monitor = await auto_update_service.create_monitor(
            source_id=request.source_id,
            check_frequency=request.check_frequency,
            enabled=request.enabled,
        )
        return SourceMonitorResponse(
            id=monitor.id,
            source_id=monitor.source_id,
            enabled=monitor.enabled,
            check_frequency=monitor.check_frequency,
            last_checked_at=monitor.last_checked_at.isoformat() if monitor.last_checked_at else None,
            last_content_hash=monitor.last_content_hash,
            consecutive_failures=monitor.consecutive_failures,
        )
    except Exception as e:
        logger.error(f"Failed to create monitor: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monitors", response_model=List[SourceMonitorResponse])
async def list_monitors():
    """Get all source monitors."""
    try:
        monitors = await auto_update_service.get_all_monitors()
        return [
            SourceMonitorResponse(
                id=m.id,
                source_id=m.source_id,
                enabled=m.enabled,
                check_frequency=m.check_frequency,
                last_checked_at=m.last_checked_at.isoformat() if m.last_checked_at else None,
                last_content_hash=m.last_content_hash,
                consecutive_failures=m.consecutive_failures,
            )
            for m in monitors
        ]
    except Exception as e:
        logger.error(f"Failed to list monitors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monitors/{source_id}", response_model=SourceMonitorResponse)
async def get_monitor(source_id: str):
    """Get monitor for a specific source."""
    monitor = await auto_update_service.get_monitor(source_id)
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    return SourceMonitorResponse(
        id=monitor.id,
        source_id=monitor.source_id,
        enabled=monitor.enabled,
        check_frequency=monitor.check_frequency,
        last_checked_at=monitor.last_checked_at.isoformat() if monitor.last_checked_at else None,
        last_content_hash=monitor.last_content_hash,
        consecutive_failures=monitor.consecutive_failures,
    )


@router.patch("/monitors/{source_id}", response_model=SourceMonitorResponse)
async def update_monitor(source_id: str, request: SourceMonitorUpdate):
    """Update monitoring settings for a source."""
    monitor = await auto_update_service.update_monitor(
        source_id=source_id,
        check_frequency=request.check_frequency,
        enabled=request.enabled,
    )
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    
    return SourceMonitorResponse(
        id=monitor.id,
        source_id=monitor.source_id,
        enabled=monitor.enabled,
        check_frequency=monitor.check_frequency,
        last_checked_at=monitor.last_checked_at.isoformat() if monitor.last_checked_at else None,
        last_content_hash=monitor.last_content_hash,
        consecutive_failures=monitor.consecutive_failures,
    )


@router.delete("/monitors/{source_id}")
async def delete_monitor(source_id: str):
    """Delete monitoring for a source."""
    success = await auto_update_service.delete_monitor(source_id)
    if not success:
        raise HTTPException(status_code=404, detail="Monitor not found")
    return {"status": "deleted"}


# ============================================================================
# Notification Endpoints
# ============================================================================

@router.get("/notifications", response_model=List[NotificationResponse])
async def list_notifications(
    include_dismissed: bool = False,
    limit: int = 100,
):
    """Get notifications."""
    try:
        notifications = await auto_update_service.get_notifications(
            include_dismissed=include_dismissed,
            limit=limit,
        )
        return [
            NotificationResponse(
                id=n.id,
                source_id=n.source_id,
                source_title=n.source_title,
                change_summary=n.change_summary,
                diff_highlights=n.diff_highlights,
                old_content_preview=n.old_content_preview,
                new_content_preview=n.new_content_preview,
                severity=n.severity,
                is_read=n.is_read,
                is_dismissed=n.is_dismissed,
                created_at=n.created_at.isoformat(),
            )
            for n in notifications
        ]
    except Exception as e:
        logger.error(f"Failed to list notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notifications/unread", response_model=List[NotificationResponse])
async def get_unread_notifications(limit: int = 50):
    """Get unread notifications."""
    try:
        notifications = await auto_update_service.get_unread_notifications(limit=limit)
        return [
            NotificationResponse(
                id=n.id,
                source_id=n.source_id,
                source_title=n.source_title,
                change_summary=n.change_summary,
                diff_highlights=n.diff_highlights,
                old_content_preview=n.old_content_preview,
                new_content_preview=n.new_content_preview,
                severity=n.severity,
                is_read=n.is_read,
                is_dismissed=n.is_dismissed,
                created_at=n.created_at.isoformat(),
            )
            for n in notifications
        ]
    except Exception as e:
        logger.error(f"Failed to get unread notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notifications/count")
async def get_notification_count():
    """Get count of unread notifications."""
    try:
        count = auto_update_service.get_unread_count()
        return {"unread_count": count}
    except Exception as e:
        logger.error(f"Failed to get notification count: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read."""
    success = await auto_update_service.mark_notification_read(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "marked_read"}


@router.post("/notifications/{notification_id}/dismiss")
async def dismiss_notification(notification_id: str):
    """Dismiss a notification."""
    success = await auto_update_service.dismiss_notification(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "dismissed"}


@router.post("/notifications/mark-all-read")
async def mark_all_notifications_read():
    """Mark all notifications as read."""
    try:
        count = await auto_update_service.mark_all_read()
        return {"status": "success", "count": count}
    except Exception as e:
        logger.error(f"Failed to mark all read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Job Endpoints
# ============================================================================

@router.post("/jobs/run")
async def trigger_check_job(
    background_tasks: BackgroundTasks,
    frequency: Optional[str] = None,
):
    """
    Trigger a monitoring job to check sources for updates.
    
    The job runs in the background. Use /jobs/history to check status.
    """
    try:
        # Check if already running
        running = await MonitorJobRun.get_running()
        if running:
            return {
                "status": "already_running",
                "job_id": running.id,
                "started_at": running.started_at.isoformat(),
            }
        
        # Run in background
        background_tasks.add_task(
            auto_update_service.run_check_job,
            frequency
        )
        
        return {"status": "started", "message": "Job started in background"}
    except Exception as e:
        logger.error(f"Failed to trigger job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/history", response_model=List[JobRunResponse])
async def get_job_history(limit: int = 10):
    """Get history of monitoring jobs."""
    try:
        jobs = await MonitorJobRun.get_latest(limit)
        return [
            JobRunResponse(
                id=j.id,
                started_at=j.started_at.isoformat(),
                completed_at=j.completed_at.isoformat() if j.completed_at else None,
                status=j.status,
                sources_checked=j.sources_checked,
                updates_found=j.updates_found,
                errors=j.errors,
            )
            for j in jobs
        ]
    except Exception as e:
        logger.error(f"Failed to get job history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/current")
async def get_current_job():
    """Get currently running job if any."""
    job = await MonitorJobRun.get_running()
    if not job:
        return {"status": "no_job_running"}
    
    return JobRunResponse(
        id=job.id,
        started_at=job.started_at.isoformat(),
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
        status=job.status,
        sources_checked=job.sources_checked,
        updates_found=job.updates_found,
        errors=job.errors,
    )


# ============================================================================
# Stats Endpoint
# ============================================================================

@router.get("/stats", response_model=StatsResponse)
async def get_monitoring_stats():
    """Get monitoring statistics."""
    try:
        stats = await auto_update_service.get_stats()
        return StatsResponse(
            total_monitors=stats.total_monitors,
            enabled_monitors=stats.enabled_monitors,
            unread_notifications=stats.unread_notifications,
            last_job_run=stats.last_job_run.isoformat() if stats.last_job_run else None,
            last_job_status=stats.last_job_status,
        )
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
