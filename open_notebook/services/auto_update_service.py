"""
Auto-Update Agent Service

Monitors web sources for changes and generates notifications with LLM summaries.
"""

import hashlib
import asyncio
from datetime import datetime
from typing import Optional, List, Tuple
from difflib import unified_diff

import httpx
from loguru import logger
from ai_prompter import Prompter
from langchain_core.runnables import RunnableConfig

from open_notebook.domain.auto_update import (
    SourceMonitor,
    UpdateNotification,
    MonitorJobRun,
    MonitoringStats,
)
from open_notebook.domain.notebook import Source
from open_notebook.graphs.utils import provision_langchain_model


class AutoUpdateService:
    """Service for monitoring sources and detecting updates."""

    def __init__(self):
        self.http_client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                "User-Agent": "OpenNotebook/1.0 (Source Monitor)"
            }
        )

    async def close(self):
        """Close HTTP client."""
        await self.http_client.aclose()

    def _compute_hash(self, content: str) -> str:
        """Compute hash of content for change detection."""
        return hashlib.sha256(content.encode()).hexdigest()

    async def _fetch_url_content(self, url: str) -> Optional[str]:
        """Fetch content from URL."""
        try:
            response = await self.http_client.get(url)
            response.raise_for_status()
            return response.text
        except Exception as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return None

    def _generate_diff(self, old_content: str, new_content: str) -> List[str]:
        """Generate diff highlights between old and new content."""
        old_lines = old_content.splitlines()
        new_lines = new_content.splitlines()
        
        diff = list(unified_diff(old_lines, new_lines, lineterm='', n=3))
        
        # Extract just the changed lines (limited)
        highlights = []
        for line in diff:
            if line.startswith('+') and not line.startswith('+++'):
                highlights.append(f"Added: {line[1:].strip()[:200]}")
            elif line.startswith('-') and not line.startswith('---'):
                highlights.append(f"Removed: {line[1:].strip()[:200]}")
            if len(highlights) >= 10:  # Limit highlights
                break
        
        return highlights

    async def _generate_change_summary(
        self, 
        source_title: str,
        old_content: str, 
        new_content: str,
        diff_highlights: List[str]
    ) -> Tuple[str, str]:
        """Generate LLM summary of changes and determine severity."""
        
        # Truncate content for LLM
        old_preview = old_content[:2000] if old_content else ""
        new_preview = new_content[:2000] if new_content else ""
        
        prompt_text = f"""Analyze the changes detected in this web source.

Source Title: {source_title}

Key Changes Detected:
{chr(10).join(diff_highlights[:5])}

Old Content Preview:
{old_preview}

New Content Preview:
{new_preview}

Please provide:
1. A brief summary (2-3 sentences) of what changed
2. The severity level: "info" (minor updates), "warning" (significant changes), or "critical" (major content changes or breaking changes)

Format your response as:
SUMMARY: <your summary>
SEVERITY: <info|warning|critical>"""

        try:
            # Use the same pattern as other graphs
            model = provision_langchain_model()
            response = await model.ainvoke(prompt_text)
            response_text = response.content if hasattr(response, 'content') else str(response)
            
            # Parse response
            summary = "Content has been updated."
            severity = "info"
            
            if response_text:
                lines = response_text.strip().split("\n")
                for line in lines:
                    if line.startswith("SUMMARY:"):
                        summary = line.replace("SUMMARY:", "").strip()
                    elif line.startswith("SEVERITY:"):
                        sev = line.replace("SEVERITY:", "").strip().lower()
                        if sev in ["info", "warning", "critical"]:
                            severity = sev
            
            return summary, severity
        except Exception as e:
            logger.error(f"Failed to generate change summary: {e}")
            return "Content has been updated.", "info"

    async def check_source(
        self, 
        monitor: SourceMonitor
    ) -> Optional[UpdateNotification]:
        """Check a single source for updates."""
        try:
            # Get the source
            source = Source.get(monitor.source_id)
            if not source:
                logger.warning(f"Source {monitor.source_id} not found")
                return None
            
            # Get URL from source asset
            url = getattr(source.asset, 'url', None) if source.asset else None
            if not url:
                logger.debug(f"Source {monitor.source_id} has no URL to monitor")
                return None
            
            # Fetch current content
            new_content = await self._fetch_url_content(url)
            if not new_content:
                # Update failure count
                monitor.consecutive_failures += 1
                monitor.updated_at = datetime.now()
                await monitor.save()
                return None
            
            # Reset failure count on success
            monitor.consecutive_failures = 0
            monitor.last_checked_at = datetime.now()
            
            # Compute new hash
            new_hash = self._compute_hash(new_content)
            
            # Check if content changed
            if monitor.last_content_hash and monitor.last_content_hash != new_hash:
                logger.info(f"Content change detected for source {source.title}")
                
                # Get old content from source
                old_content = source.full_text or ""
                
                # Generate diff highlights
                diff_highlights = self._generate_diff(old_content, new_content)
                
                # Generate summary
                summary, severity = await self._generate_change_summary(
                    source.title or "Untitled",
                    old_content,
                    new_content,
                    diff_highlights
                )
                
                # Create notification
                notification = UpdateNotification(
                    source_id=monitor.source_id,
                    source_title=source.title or "Untitled",
                    change_summary=summary,
                    diff_highlights=diff_highlights,
                    old_content_preview=old_content[:500] if old_content else None,
                    new_content_preview=new_content[:500] if new_content else None,
                    severity=severity,
                )
                await notification.save()
                
                # Update monitor hash
                monitor.last_content_hash = new_hash
                monitor.updated_at = datetime.now()
                await monitor.save()
                
                return notification
            
            # No change, just update hash and timestamp
            monitor.last_content_hash = new_hash
            monitor.updated_at = datetime.now()
            await monitor.save()
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking source {monitor.source_id}: {e}")
            monitor.consecutive_failures += 1
            monitor.updated_at = datetime.now()
            await monitor.save()
            return None

    async def run_check_job(
        self, 
        frequency: Optional[str] = None
    ) -> MonitorJobRun:
        """Run a monitoring job for all due sources."""
        
        # Check if job already running
        running = await MonitorJobRun.get_running()
        if running:
            logger.warning("Monitor job already running")
            return running
        
        # Create job record
        job = MonitorJobRun(status="running")
        await job.save()
        
        try:
            # Get monitors due for check
            if frequency:
                monitors = await SourceMonitor.get_due_for_check(frequency)
            else:
                # Check all frequencies
                monitors = []
                for freq in ["hourly", "daily", "weekly"]:
                    monitors.extend(await SourceMonitor.get_due_for_check(freq))
            
            logger.info(f"Checking {len(monitors)} sources for updates")
            
            updates_found = 0
            errors = []
            
            for monitor in monitors:
                try:
                    notification = await self.check_source(monitor)
                    if notification:
                        updates_found += 1
                except Exception as e:
                    errors.append(f"Source {monitor.source_id}: {str(e)}")
            
            # Update job record
            job.status = "completed"
            job.completed_at = datetime.now()
            job.sources_checked = len(monitors)
            job.updates_found = updates_found
            job.errors = errors
            await job.save()
            
            logger.info(
                f"Monitor job completed: {len(monitors)} checked, "
                f"{updates_found} updates, {len(errors)} errors"
            )
            
            return job
            
        except Exception as e:
            logger.error(f"Monitor job failed: {e}")
            job.status = "failed"
            job.completed_at = datetime.now()
            job.errors = [str(e)]
            await job.save()
            return job

    # Source monitor management
    async def create_monitor(
        self, 
        source_id: str, 
        check_frequency: str = "daily",
        enabled: bool = True
    ) -> SourceMonitor:
        """Create a monitor for a source."""
        # Check if already exists
        existing = await SourceMonitor.get_by_source(source_id)
        if existing:
            # Update existing
            existing.check_frequency = check_frequency
            existing.enabled = enabled
            existing.updated_at = datetime.now()
            await existing.save()
            return existing
        
        # Create new
        monitor = SourceMonitor(
            source_id=source_id,
            check_frequency=check_frequency,
            enabled=enabled,
        )
        await monitor.save()
        return monitor

    async def get_monitor(self, source_id: str) -> Optional[SourceMonitor]:
        """Get monitor for a source."""
        return await SourceMonitor.get_by_source(source_id)

    async def update_monitor(
        self, 
        source_id: str, 
        check_frequency: Optional[str] = None,
        enabled: Optional[bool] = None
    ) -> Optional[SourceMonitor]:
        """Update a source monitor."""
        monitor = await SourceMonitor.get_by_source(source_id)
        if not monitor:
            return None
        
        if check_frequency is not None:
            monitor.check_frequency = check_frequency
        if enabled is not None:
            monitor.enabled = enabled
        monitor.updated_at = datetime.now()
        await monitor.save()
        return monitor

    async def delete_monitor(self, source_id: str) -> bool:
        """Delete a source monitor."""
        monitor = await SourceMonitor.get_by_source(source_id)
        if monitor:
            monitor.delete()
            return True
        return False

    async def get_all_monitors(self) -> List[SourceMonitor]:
        """Get all monitors."""
        return await SourceMonitor.get_enabled_monitors()

    # Notifications
    async def get_notifications(
        self, 
        include_dismissed: bool = False,
        limit: int = 100
    ) -> List[UpdateNotification]:
        """Get notifications."""
        return await UpdateNotification.get_all(include_dismissed, limit)

    async def get_unread_notifications(self, limit: int = 50) -> List[UpdateNotification]:
        """Get unread notifications."""
        return await UpdateNotification.get_unread(limit)

    async def mark_notification_read(self, notification_id: str) -> bool:
        """Mark notification as read."""
        notification = UpdateNotification.get(notification_id)
        if notification:
            notification.is_read = True
            await notification.save()
            return True
        return False

    async def dismiss_notification(self, notification_id: str) -> bool:
        """Dismiss a notification."""
        notification = UpdateNotification.get(notification_id)
        if notification:
            notification.is_dismissed = True
            await notification.save()
            return True
        return False

    async def mark_all_read(self) -> int:
        """Mark all notifications as read."""
        return await UpdateNotification.mark_all_read()

    async def get_unread_count(self) -> int:
        """Get count of unread notifications."""
        return await UpdateNotification.get_unread_count()

    async def get_stats(self) -> MonitoringStats:
        """Get monitoring statistics."""
        from open_notebook.database.repository import repo
        
        # Get total monitors
        total_result = await repo.query("SELECT count() FROM source_monitor GROUP ALL")
        total = total_result[0].get("count", 0) if total_result else 0
        
        # Get enabled monitors
        enabled_result = await repo.query(
            "SELECT count() FROM source_monitor WHERE enabled = true GROUP ALL"
        )
        enabled = enabled_result[0].get("count", 0) if enabled_result else 0
        
        # Get unread count
        unread = await self.get_unread_count()
        
        # Get last job
        jobs = await MonitorJobRun.get_latest(1)
        last_job = jobs[0] if jobs else None
        
        return MonitoringStats(
            total_monitors=total,
            enabled_monitors=enabled,
            unread_notifications=unread,
            last_job_run=last_job.started_at if last_job else None,
            last_job_status=last_job.status if last_job else None,
        )


# Create singleton instance
auto_update_service = AutoUpdateService()
