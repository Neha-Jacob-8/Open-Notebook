"""
Knowledge Graph API Router

Endpoints for building and querying knowledge graphs.
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from loguru import logger

from open_notebook.domain.knowledge_graph import (
    KnowledgeGraph, 
    ConceptNode, 
    ConceptEdge,
    KnowledgeGraphMeta
)
from open_notebook.services.knowledge_graph_service import knowledge_graph_service
from open_notebook.database.repository import repo


router = APIRouter(prefix="/knowledge-graph", tags=["knowledge-graph"])


# ============================================================================
# Request/Response Models
# ============================================================================

class BuildGraphRequest(BaseModel):
    """Request to build a knowledge graph"""
    notebook_id: str
    model_id: Optional[str] = None


class GraphNode(BaseModel):
    """A node in the graph visualization format"""
    id: str
    label: str
    type: str
    description: Optional[str] = None
    importance: float = 0.5
    mentions: int = 1
    val: float = 5  # Size for visualization
    color: str = "#3b82f6"


class GraphLink(BaseModel):
    """A link/edge in the graph visualization format"""
    source: str
    target: str
    relationship: str
    weight: float = 1.0


class GraphData(BaseModel):
    """Complete graph data for visualization"""
    nodes: List[GraphNode]
    links: List[GraphLink]


class GraphMetaResponse(BaseModel):
    """Metadata about a knowledge graph"""
    notebook_id: str
    node_count: int
    edge_count: int
    last_built: Optional[datetime]
    build_status: str
    error_message: Optional[str] = None


class NodeDetailResponse(BaseModel):
    """Detailed information about a concept node"""
    node: dict
    connections: List[dict]
    edges: List[dict]


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/build", response_model=GraphMetaResponse)
async def build_knowledge_graph(request: BuildGraphRequest, background_tasks: BackgroundTasks):
    """
    Build a knowledge graph for a notebook.
    This starts a background task and returns immediately with status.
    """
    notebook_id = request.notebook_id
    
    # Check if notebook exists
    notebook_result = await repo.get(notebook_id)
    if not notebook_result:
        raise HTTPException(status_code=404, detail="Notebook not found")
    
    # Get or create metadata
    meta = await KnowledgeGraphMeta.get_for_notebook(notebook_id)
    if not meta:
        meta = KnowledgeGraphMeta(notebook_id=notebook_id)
        await meta.save()
    
    # Start background build
    background_tasks.add_task(
        _build_graph_task, 
        notebook_id, 
        request.model_id
    )
    
    meta.build_status = "building"
    await meta.save()
    
    logger.info(f"Started knowledge graph build for notebook {notebook_id}")
    
    return GraphMetaResponse(
        notebook_id=notebook_id,
        node_count=meta.node_count,
        edge_count=meta.edge_count,
        last_built=meta.last_built,
        build_status="building",
        error_message=None
    )


async def _build_graph_task(notebook_id: str, model_id: Optional[str]):
    """Background task to build the knowledge graph"""
    meta = None
    try:
        logger.info(f"Starting knowledge graph build task for notebook {notebook_id}")
        
        # Get sources for the notebook via reference table - include both full_text and insights
        # Sources are linked to notebooks via the 'reference' edge table (source -> notebook)
        # Use type::thing() to convert the string parameter to a record ID for proper matching
        query = """
            SELECT 
                in.id AS id, 
                in.title AS title, 
                in.full_text AS full_text,
                (SELECT array::group(content) FROM insight WHERE insight.source = in.id) AS insights
            FROM reference 
            WHERE out = type::thing($notebook_id) 
                AND (in.full_text IS NOT NONE OR in.id IN (SELECT source FROM insight))
        """
        logger.info(f"Executing KG query for notebook {notebook_id}")
        sources = await repo.query(query, {"notebook_id": notebook_id})
        
        logger.info(f"KG Query result: Found {len(sources) if sources else 0} sources")
        if sources:
            for s in sources:
                has_text = bool(s.get('full_text'))
                insights_len = len(s.get('insights', []) or [])
                logger.info(f"Source {s.get('id')}: full_text={has_text}, insights={insights_len}")
        
        if not sources:
            logger.warning(f"No sources with content or insights found for notebook {notebook_id}")
            meta = await KnowledgeGraphMeta.get_for_notebook(notebook_id)
            if meta:
                meta.build_status = "completed"
                meta.node_count = 0
                meta.edge_count = 0
                meta.last_built = datetime.now()
                meta.error_message = "No sources with text content found"
                await meta.save()
            return
        
        # Build the graph
        result = await knowledge_graph_service.build_knowledge_graph(
            notebook_id, 
            sources, 
            model_id
        )
        
        logger.info(f"Knowledge graph build completed for notebook {notebook_id}")
        
    except Exception as e:
        logger.error(f"Knowledge graph build failed for {notebook_id}: {e}", exc_info=True)
        # Update metadata with error
        if not meta:
            meta = await KnowledgeGraphMeta.get_for_notebook(notebook_id)
        if meta:
            meta.build_status = "error"
            meta.error_message = str(e)
            await meta.save()


@router.get("/status/{notebook_id}", response_model=GraphMetaResponse)
async def get_graph_status(notebook_id: str):
    """Get the build status of a notebook's knowledge graph"""
    meta = await KnowledgeGraphMeta.get_for_notebook(notebook_id)
    
    if not meta:
        return GraphMetaResponse(
            notebook_id=notebook_id,
            node_count=0,
            edge_count=0,
            last_built=None,
            build_status="not_built",
            error_message=None
        )
    
    return GraphMetaResponse(
        notebook_id=notebook_id,
        node_count=meta.node_count,
        edge_count=meta.edge_count,
        last_built=meta.last_built,
        build_status=meta.build_status,
        error_message=meta.error_message
    )


@router.get("/{notebook_id}", response_model=GraphData)
async def get_knowledge_graph(notebook_id: str):
    """Get the complete knowledge graph for a notebook"""
    graph = await KnowledgeGraph.load(notebook_id)
    
    if not graph.nodes:
        return GraphData(nodes=[], links=[])
    
    graph_data = graph.to_graph_data()
    
    return GraphData(
        nodes=[GraphNode(**n) for n in graph_data["nodes"]],
        links=[GraphLink(**l) for l in graph_data["links"]]
    )


@router.get("/node/{node_id}", response_model=NodeDetailResponse)
async def get_node_details(node_id: str):
    """Get detailed information about a specific concept node"""
    details = await knowledge_graph_service.get_node_details(node_id)
    
    if not details:
        raise HTTPException(status_code=404, detail="Node not found")
    
    return NodeDetailResponse(**details)


@router.get("/nodes/{notebook_id}", response_model=List[dict])
async def get_nodes(notebook_id: str, type: Optional[str] = None):
    """Get all nodes for a notebook, optionally filtered by type"""
    nodes = await ConceptNode.find_by_notebook(notebook_id)
    
    if type:
        nodes = [n for n in nodes if n.type == type]
    
    return [n.model_dump() for n in nodes]


@router.delete("/{notebook_id}")
async def delete_knowledge_graph(notebook_id: str):
    """Delete a notebook's knowledge graph"""
    # Delete nodes
    nodes = await ConceptNode.find_by_notebook(notebook_id)
    for node in nodes:
        await node.delete()
    
    # Delete edges
    edges = await ConceptEdge.find_by_notebook(notebook_id)
    for edge in edges:
        await edge.delete()
    
    # Delete metadata
    meta = await KnowledgeGraphMeta.get_for_notebook(notebook_id)
    if meta and meta.id:
        await repo.delete(meta.id)
    
    logger.info(f"Deleted knowledge graph for notebook {notebook_id}")
    
    return {"status": "deleted", "notebook_id": notebook_id}
