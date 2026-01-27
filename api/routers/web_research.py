"""
Web Research API Router

Endpoints for AI-powered topic-based web research.
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from loguru import logger

from open_notebook.services.web_research_service import web_research_service, ResearchResult, CuratedSource


router = APIRouter(prefix="/web-research", tags=["web-research"])


# ============================================================================
# Request/Response Models
# ============================================================================

class WebResearchRequest(BaseModel):
    """Request to start web research on a topic"""
    topic: str = Field(..., description="The topic to research")
    num_sources: int = Field(default=5, ge=1, le=10, description="Number of sources to find")
    notebook_id: Optional[str] = Field(default=None, description="Notebook to add sources to")
    auto_add_sources: bool = Field(default=False, description="Automatically add sources to notebook")
    search_queries: Optional[List[str]] = Field(default=None, description="Custom search queries")


class CuratedSourceResponse(BaseModel):
    """A curated source in the response"""
    title: str
    url: str
    snippet: str
    relevance_score: float
    summary: str
    key_points: List[str]
    citation: str
    source_type: str


class WebResearchResponse(BaseModel):
    """Complete web research response"""
    topic: str
    overview: str
    sources: List[CuratedSourceResponse]
    key_insights: List[str]
    suggested_questions: List[str]
    sources_added: int = 0
    created_at: datetime


class QuickSearchRequest(BaseModel):
    """Request for quick web search without full curation"""
    query: str = Field(..., description="Search query")
    num_results: int = Field(default=10, ge=1, le=20, description="Number of results")


class SearchResultResponse(BaseModel):
    """A simple search result"""
    title: str
    url: str
    snippet: str
    source_domain: str


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/research", response_model=WebResearchResponse)
async def research_topic(request: WebResearchRequest):
    """
    Research a topic using AI-powered web search.
    
    This endpoint:
    1. Searches the web for relevant content
    2. Curates the best sources using AI
    3. Generates a comprehensive overview
    4. Optionally adds sources to a notebook
    """
    logger.info(f"Web research request for topic: {request.topic}")
    
    try:
        result = await web_research_service.research_topic(
            topic=request.topic,
            num_sources=request.num_sources,
            search_queries=request.search_queries
        )
        
        sources_added = 0
        
        # Add sources to notebook if requested
        if request.auto_add_sources and request.notebook_id and result.sources:
            try:
                from api.sources_service import sources_service
                
                for source in result.sources:
                    try:
                        # Create source from curated content
                        sources_service.create_source(
                            notebook_id=request.notebook_id,
                            source_type="link",
                            url=source.url,
                            title=source.title,
                            embed=True,
                            async_processing=True
                        )
                        sources_added += 1
                    except Exception as e:
                        logger.warning(f"Failed to add source {source.url}: {e}")
                        continue
                        
                logger.info(f"Added {sources_added} sources to notebook {request.notebook_id}")
                
            except Exception as e:
                logger.error(f"Error adding sources to notebook: {e}")
        
        return WebResearchResponse(
            topic=result.topic,
            overview=result.overview,
            sources=[
                CuratedSourceResponse(
                    title=s.title,
                    url=s.url,
                    snippet=s.snippet,
                    relevance_score=s.relevance_score,
                    summary=s.summary,
                    key_points=s.key_points,
                    citation=s.citation,
                    source_type=s.source_type
                )
                for s in result.sources
            ],
            key_insights=result.key_insights,
            suggested_questions=result.suggested_questions,
            sources_added=sources_added,
            created_at=result.created_at
        )
        
    except Exception as e:
        logger.error(f"Web research failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=List[SearchResultResponse])
async def quick_search(request: QuickSearchRequest):
    """
    Quick web search without AI curation.
    Returns raw search results for the query.
    """
    try:
        results = await web_research_service.search_web(
            query=request.query,
            num_results=request.num_results
        )
        
        return [
            SearchResultResponse(
                title=r.title,
                url=r.url,
                snippet=r.snippet,
                source_domain=r.source_domain
            )
            for r in results
        ]
        
    except Exception as e:
        logger.error(f"Quick search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add-sources")
async def add_research_sources(
    notebook_id: str,
    urls: List[str],
    background_tasks: BackgroundTasks
):
    """
    Add multiple URLs as sources to a notebook.
    Processing happens in the background.
    """
    try:
        from api.sources_service import sources_service
        
        added = []
        failed = []
        
        for url in urls:
            try:
                result = sources_service.create_source(
                    notebook_id=notebook_id,
                    source_type="link",
                    url=url,
                    embed=True,
                    async_processing=True
                )
                added.append(url)
            except Exception as e:
                logger.warning(f"Failed to add {url}: {e}")
                failed.append({"url": url, "error": str(e)})
        
        return {
            "message": f"Added {len(added)} sources",
            "added": added,
            "failed": failed
        }
        
    except Exception as e:
        logger.error(f"Error adding sources: {e}")
        raise HTTPException(status_code=500, detail=str(e))
