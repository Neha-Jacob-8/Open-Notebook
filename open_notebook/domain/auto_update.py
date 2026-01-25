"""
Auto-Update Agent Domain Models

Handles source monitoring, content change detection, and notifications.
"""

from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field

from open_notebook.domain.base import ObjectModel


class SourceMonitor(ObjectModel):
    """Configuration for monitoring a source for updates."""
    
    table_name = "source_monitor"
    
    source_id: str = Field(..., description="ID of the source to monitor")
    enabled: bool = Field(default=True, description="Whether monitoring is enabled")
    check_frequency: Literal["hourly", "daily", "weekly"] = Field(
        default="daily", 
        description="How often to check for updates"
    )
    last_checked_at: Optional[datetime] = Field(
        default=None, 
        description="When the source was last checked"
    )
    last_content_hash: Optional[str] = Field(
        default=None, 
        description="Hash of content at last check"
    )
    consecutive_failures: int = Field(
        default=0, 
        description="Number of consecutive check failures"
    )
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    @classmethod
    async def get_by_source(cls, source_id: str) -> Optional["SourceMonitor"]:
        """Get monitor config for a source."""
        from open_notebook.database.repository import repo
        
        result = await repo.query(
            f"SELECT * FROM {cls.table_name} WHERE source_id = $source_id LIMIT 1",
            {"source_id": source_id}
        )
        if result and len(result) > 0:
            return cls(**result[0])
        return None

    @classmethod
    async def get_enabled_monitors(cls) -> List["SourceMonitor"]:
        """Get all enabled monitors."""
        from open_notebook.database.repository import repo
        
        result = await repo.query(
            f"SELECT * FROM {cls.table_name} WHERE enabled = true"
        )
        return [cls(**r) for r in result] if result else []

    @classmethod
    async def get_due_for_check(cls, frequency: str) -> List["SourceMonitor"]:
        """Get monitors due for checking based on frequency."""
        from open_notebook.database.repository import repo
        
        # Calculate cutoff time based on frequency
        frequency_hours = {"hourly": 1, "daily": 24, "weekly": 168}
        hours = frequency_hours.get(frequency, 24)
        
        result = await repo.query(
            f"""SELECT * FROM {cls.table_name} 
            WHERE enabled = true 
            AND check_frequency = $frequency
            AND (last_checked_at IS NONE OR last_checked_at < time::now() - {hours}h)
            ORDER BY last_checked_at ASC"""
            ,
            {"frequency": frequency}
        )
        return [cls(**r) for r in result] if result else []


class UpdateNotification(ObjectModel):
    """Notification about a source content update."""
    
    table_name = "update_notification"
    
    source_id: str = Field(..., description="ID of the updated source")
    source_title: str = Field(..., description="Title of the source")
    change_summary: str = Field(..., description="LLM-generated summary of changes")
    diff_highlights: List[str] = Field(
        default_factory=list, 
        description="Key differences found"
    )
    old_content_preview: Optional[str] = Field(
        default=None, 
        description="Preview of old content"
    )
    new_content_preview: Optional[str] = Field(
        default=None, 
        description="Preview of new content"
    )
    severity: Literal["info", "warning", "critical"] = Field(
        default="info", 
        description="Severity level of the update"
    )
    is_read: bool = Field(default=False, description="Whether notification was read")
    is_dismissed: bool = Field(default=False, description="Whether notification was dismissed")
    created_at: datetime = Field(default_factory=datetime.now)

    @classmethod
    async def get_unread(cls, limit: int = 50) -> List["UpdateNotification"]:
        """Get unread notifications."""
        from open_notebook.database.repository import repo
        
        result = await repo.query(
            f"""SELECT * FROM {cls.table_name} 
            WHERE is_read = false AND is_dismissed = false 
            ORDER BY created_at DESC 
            LIMIT $limit""",
            {"limit": limit}
        )
        return [cls(**r) for r in result] if result else []

    @classmethod
    async def get_all(cls, include_dismissed: bool = False, limit: int = 100) -> List["UpdateNotification"]:
        """Get all notifications."""
        from open_notebook.database.repository import repo
        
        where_clause = "" if include_dismissed else "WHERE is_dismissed = false"
        result = await repo.query(
            f"""SELECT * FROM {cls.table_name} 
            {where_clause}
            ORDER BY created_at DESC 
            LIMIT $limit""",
            {"limit": limit}
        )
        return [cls(**r) for r in result] if result else []

    @classmethod
    async def get_for_source(cls, source_id: str, limit: int = 20) -> List["UpdateNotification"]:
        """Get notifications for a specific source."""
        from open_notebook.database.repository import repo
        
        result = await repo.query(
            f"""SELECT * FROM {cls.table_name} 
            WHERE source_id = $source_id 
            ORDER BY created_at DESC 
            LIMIT $limit""",
            {"source_id": source_id, "limit": limit}
        )
        return [cls(**r) for r in result] if result else []

    @classmethod
    async def mark_all_read(cls) -> int:
        """Mark all notifications as read."""
        from open_notebook.database.repository import repo
        
        result = await repo.query(
            f"UPDATE {cls.table_name} SET is_read = true WHERE is_read = false"
        )
        return len(result) if result else 0

    @classmethod
    async def get_unread_count(cls) -> int:
        """Get count of unread notifications."""
        from open_notebook.database.repository import repo
        
        result = await repo.query(
            f"SELECT count() FROM {cls.table_name} WHERE is_read = false AND is_dismissed = false GROUP ALL"
        )
        if result and len(result) > 0:
            return result[0].get("count", 0)
        return 0


class MonitorJobRun(ObjectModel):
    """Record of a monitoring job execution."""
    
    table_name = "monitor_job_run"
    
    started_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = Field(default=None)
    status: Literal["running", "completed", "failed"] = Field(default="running")
    sources_checked: int = Field(default=0)
    updates_found: int = Field(default=0)
    errors: List[str] = Field(default_factory=list)

    @classmethod
    async def get_latest(cls, limit: int = 10) -> List["MonitorJobRun"]:
        """Get latest job runs."""
        from open_notebook.database.repository import repo
        
        result = await repo.query(
            f"""SELECT * FROM {cls.table_name} 
            ORDER BY started_at DESC 
            LIMIT $limit""",
            {"limit": limit}
        )
        return [cls(**r) for r in result] if result else []

    @classmethod
    async def get_running(cls) -> Optional["MonitorJobRun"]:
        """Get currently running job if any."""
        from open_notebook.database.repository import repo
        
        result = await repo.query(
            f"SELECT * FROM {cls.table_name} WHERE status = 'running' LIMIT 1"
        )
        if result and len(result) > 0:
            return cls(**result[0])
        return None


# Request/Response models for API
class SourceMonitorCreate(BaseModel):
    """Request to create source monitoring."""
    source_id: str
    check_frequency: Literal["hourly", "daily", "weekly"] = "daily"
    enabled: bool = True


class SourceMonitorUpdate(BaseModel):
    """Request to update source monitoring."""
    check_frequency: Optional[Literal["hourly", "daily", "weekly"]] = None
    enabled: Optional[bool] = None


class NotificationAction(BaseModel):
    """Action to perform on notifications."""
    action: Literal["mark_read", "dismiss", "mark_all_read", "dismiss_all"]
    notification_ids: Optional[List[str]] = None


class MonitoringStats(BaseModel):
    """Statistics about monitoring."""
    total_monitors: int
    enabled_monitors: int
    unread_notifications: int
    last_job_run: Optional[datetime]
    last_job_status: Optional[str]
