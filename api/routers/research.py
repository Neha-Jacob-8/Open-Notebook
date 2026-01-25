"""
Research API Router

Provides endpoints for the multi-agent research pipeline.
"""

from typing import List, Optional
from datetime import datetime
import uuid

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from loguru import logger

from open_notebook.graphs.research import run_research, research_graph


router = APIRouter(prefix="/research", tags=["research"])


# ============================================================================
# Request/Response Models
# ============================================================================

class ResearchRequest(BaseModel):
    """Request to start a research task"""
    query: str = Field(..., description="The research question or topic")
    source_ids: Optional[List[str]] = Field(default=None, description="Specific source IDs to use")
    research_type: Optional[str] = Field(default=None, description="Override research type detection")
    llm_config: Optional[dict] = Field(default=None, description="Model configuration overrides")


class ResearchProgress(BaseModel):
    """Progress update for a research task"""
    task_id: str
    status: str  # pending, routing, researching, fact_checking, synthesizing, reporting, completed, error
    current_step: str
    progress_percent: int
    message: str
    started_at: datetime
    updated_at: datetime


class Citation(BaseModel):
    """A citation from the research"""
    source_id: str
    title: str
    quote: Optional[str] = None


class ResearchResult(BaseModel):
    """The result of a research task"""
    task_id: str
    query: str
    research_type: str
    scholar_findings: str
    fact_check_results: str
    synthesis: str
    final_report: str
    citations: List[Citation]
    metadata: dict
    created_at: datetime
    completed_at: Optional[datetime] = None


class ResearchSummary(BaseModel):
    """Summary of a research result for listing"""
    task_id: str
    query: str
    research_type: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None


# ============================================================================
# In-memory storage (replace with database in production)
# ============================================================================

_research_tasks: dict = {}
_research_results: dict = {}


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/start", response_model=ResearchProgress)
async def start_research(request: ResearchRequest, background_tasks: BackgroundTasks):
    """
    Start a new research task.
    The research runs asynchronously and progress can be checked via the status endpoint.
    """
    task_id = str(uuid.uuid4())
    now = datetime.now()
    
    progress = ResearchProgress(
        task_id=task_id,
        status="pending",
        current_step="Initializing research pipeline",
        progress_percent=0,
        message="Research task queued",
        started_at=now,
        updated_at=now
    )
    
    _research_tasks[task_id] = progress
    
    # Run research in background
    background_tasks.add_task(execute_research, task_id, request)
    
    logger.info(f"Started research task {task_id} for query: {request.query[:100]}...")
    
    return progress


async def execute_research(task_id: str, request: ResearchRequest):
    """Execute the research pipeline (runs in background)"""
    try:
        # Update status
        _research_tasks[task_id].status = "routing"
        _research_tasks[task_id].current_step = "Analyzing query and determining research approach"
        _research_tasks[task_id].progress_percent = 10
        _research_tasks[task_id].updated_at = datetime.now()
        
        # Build config
        config = request.llm_config or {}
        
        # Add timeout protection (5 minutes for async research)
        import asyncio
        try:
            result = await asyncio.wait_for(
                run_research(request.query, config),
                timeout=300.0  # 5 minutes
            )
        except asyncio.TimeoutError:
            logger.error(f"Research task {task_id} timed out after 300 seconds")
            _research_tasks[task_id].status = "error"
            _research_tasks[task_id].message = "Research timed out. Please try a more specific query."
            _research_tasks[task_id].updated_at = datetime.now()
            return
        
        # Update progress through stages
        _research_tasks[task_id].status = "completed"
        _research_tasks[task_id].current_step = "Research complete"
        _research_tasks[task_id].progress_percent = 100
        _research_tasks[task_id].message = "Research completed successfully"
        _research_tasks[task_id].updated_at = datetime.now()
        
        # Store result
        citations = [
            Citation(
                source_id=c.get("source_id", "") or "",
                title=c.get("title", "") or "Untitled"
            )
            for c in result.get("citations", [])
        ]
        
        _research_results[task_id] = ResearchResult(
            task_id=task_id,
            query=request.query,
            research_type=result.get("research_type", "deep_dive"),
            scholar_findings=result.get("scholar_findings", ""),
            fact_check_results=result.get("fact_check_results", ""),
            synthesis=result.get("synthesis", ""),
            final_report=result.get("final_report", ""),
            citations=citations,
            metadata=result.get("metadata", {}),
            created_at=_research_tasks[task_id].started_at,
            completed_at=datetime.now()
        )
        
        logger.info(f"Research task {task_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Research task {task_id} failed: {str(e)}")
        logger.exception(e)
        _research_tasks[task_id].status = "error"
        _research_tasks[task_id].message = f"Research failed: {str(e)}"
        _research_tasks[task_id].updated_at = datetime.now()


@router.get("/status/{task_id}", response_model=ResearchProgress)
async def get_research_status(task_id: str):
    """Get the current status of a research task"""
    if task_id not in _research_tasks:
        raise HTTPException(status_code=404, detail="Research task not found")
    
    return _research_tasks[task_id]


@router.get("/result/{task_id}", response_model=ResearchResult)
async def get_research_result(task_id: str):
    """Get the result of a completed research task"""
    if task_id not in _research_results:
        if task_id in _research_tasks:
            status = _research_tasks[task_id].status
            if status != "completed":
                raise HTTPException(
                    status_code=202, 
                    detail=f"Research still in progress. Current status: {status}"
                )
        raise HTTPException(status_code=404, detail="Research result not found")
    
    return _research_results[task_id]


@router.get("/history", response_model=List[ResearchSummary])
async def get_research_history(limit: int = 20, offset: int = 0):
    """Get history of research tasks"""
    summaries = []
    
    for task_id, progress in list(_research_tasks.items())[offset:offset + limit]:
        result = _research_results.get(task_id)
        summaries.append(ResearchSummary(
            task_id=task_id,
            query=result.query if result else "Unknown",
            research_type=result.research_type if result else "unknown",
            status=progress.status,
            created_at=progress.started_at,
            completed_at=result.completed_at if result else None
        ))
    
    return summaries


@router.post("/quick", response_model=ResearchResult)
async def quick_research(request: ResearchRequest):
    """
    Run a synchronous research task and return results immediately.
    Use for shorter queries where waiting is acceptable.
    """
    task_id = str(uuid.uuid4())
    now = datetime.now()
    
    logger.info(f"Running quick research for query: {request.query[:100]}...")
    
    try:
        config = request.llm_config or {}
        
        # Add timeout protection (2 minutes for quick research)
        import asyncio
        try:
            result = await asyncio.wait_for(
                run_research(request.query, config),
                timeout=120.0  # 2 minutes
            )
        except asyncio.TimeoutError:
            logger.error(f"Quick research timed out after 120 seconds")
            raise HTTPException(
                status_code=408, 
                detail="Research took too long to complete. Please try a more specific query or use the async endpoint."
            )
        
        citations = [
            Citation(
                source_id=c.get("source_id", "") or "",
                title=c.get("title", "") or "Untitled"
            )
            for c in result.get("citations", [])
        ]
        
        return ResearchResult(
            task_id=task_id,
            query=request.query,
            research_type=result.get("research_type", "deep_dive"),
            scholar_findings=result.get("scholar_findings", ""),
            fact_check_results=result.get("fact_check_results", ""),
            synthesis=result.get("synthesis", ""),
            final_report=result.get("final_report", ""),
            citations=citations,
            metadata=result.get("metadata", {}),
            created_at=now,
            completed_at=datetime.now()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quick research failed: {str(e)}")
        logger.exception(e)
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")


@router.delete("/{task_id}")
async def delete_research(task_id: str):
    """Delete a research task and its results"""
    if task_id not in _research_tasks:
        raise HTTPException(status_code=404, detail="Research task not found")
    
    del _research_tasks[task_id]
    if task_id in _research_results:
        del _research_results[task_id]
    
    return {"status": "deleted", "task_id": task_id}
