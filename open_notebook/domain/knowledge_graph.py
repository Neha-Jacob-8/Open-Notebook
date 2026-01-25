"""
Knowledge Graph Domain Models

Models for concept nodes and edges that form the knowledge graph.
"""

from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

from open_notebook.database.repository import repo


class ConceptNode(BaseModel):
    """A concept node in the knowledge graph"""
    id: Optional[str] = None
    label: str
    type: Literal["concept", "person", "event", "place", "organization"] = "concept"
    description: Optional[str] = None
    source_ids: List[str] = Field(default_factory=list)
    notebook_id: Optional[str] = None
    embedding: Optional[List[float]] = None
    importance: float = Field(default=0.5, ge=0, le=1)
    mentions: int = 1
    created: Optional[datetime] = None
    updated: Optional[datetime] = None
    
    class Config:
        table_name = "concept_node"
    
    @classmethod
    async def get(cls, id: str) -> Optional["ConceptNode"]:
        """Get a concept node by ID"""
        result = await repo.get(id)
        if result:
            return cls(**result)
        return None
    
    @classmethod
    async def find_by_notebook(cls, notebook_id: str) -> List["ConceptNode"]:
        """Get all concept nodes for a notebook"""
        query = f"SELECT * FROM concept_node WHERE notebook_id = $notebook_id"
        results = await repo.query(query, {"notebook_id": notebook_id})
        
        return [cls(**r) for r in results] if results else []
    
    @classmethod
    async def find_by_label(cls, label: str, notebook_id: Optional[str] = None) -> Optional["ConceptNode"]:
        """Find a concept by label, optionally scoped to notebook"""
        if notebook_id:
            query = "SELECT * FROM concept_node WHERE label = $label AND notebook_id = $notebook_id LIMIT 1"
            results = await repo.query(query, {"label": label, "notebook_id": notebook_id})
        else:
            query = "SELECT * FROM concept_node WHERE label = $label LIMIT 1"
            results = await repo.query(query, {"label": label})
        
        if results:
            return cls(**results[0])
        return None
    
    async def save(self) -> "ConceptNode":
        """Save the concept node"""
        self.updated = datetime.now()
        if not self.created:
            self.created = datetime.now()
        
        data = self.model_dump(exclude={"id"}, exclude_none=True)
        
        if self.id:
            result = await repo.update(self.id, data)
        else:
            result = await repo.create("concept_node", data)
        
        if result:
            # repo.create returns a list, extract first element
            if isinstance(result, list) and len(result) > 0:
                result = result[0]
            if isinstance(result, dict):
                return ConceptNode(**result)
        return self
    
    async def delete(self) -> bool:
        """Delete the concept node"""
        if self.id:
            return await repo.delete(self.id)
        return False


class ConceptEdge(BaseModel):
    """An edge/relationship between concept nodes"""
    id: Optional[str] = None
    source_node: str  # concept_node ID
    target_node: str  # concept_node ID
    relationship: str  # is_a, part_of, causes, related_to, etc.
    description: Optional[str] = None
    weight: float = 1.0
    source_ids: List[str] = Field(default_factory=list)
    notebook_id: Optional[str] = None
    created: Optional[datetime] = None
    
    class Config:
        table_name = "concept_edge"
    
    @classmethod
    async def get(cls, id: str) -> Optional["ConceptEdge"]:
        """Get an edge by ID"""
        result = await repo.get(id)
        if result:
            return cls(**result)
        return None
    
    @classmethod
    async def find_by_notebook(cls, notebook_id: str) -> List["ConceptEdge"]:
        """Get all edges for a notebook"""
        query = f"SELECT * FROM concept_edge WHERE notebook_id = $notebook_id"
        results = await repo.query(query, {"notebook_id": notebook_id})
        
        return [cls(**r) for r in results] if results else []
    
    @classmethod
    async def find_by_node(cls, node_id: str) -> List["ConceptEdge"]:
        """Find all edges connected to a node"""
        query = "SELECT * FROM concept_edge WHERE source_node = $node_id OR target_node = $node_id"
        results = await repo.query(query, {"node_id": node_id})
        return [cls(**r) for r in results]
    
    async def save(self) -> "ConceptEdge":
        """Save the edge"""
        if not self.created:
            self.created = datetime.now()
        
        data = self.model_dump(exclude={"id"}, exclude_none=True)
        
        if self.id:
            result = await repo.update(self.id, data)
        else:
            result = await repo.create("concept_edge", data)
        
        if result:
            # repo.create returns a list, extract first element
            if isinstance(result, list) and len(result) > 0:
                result = result[0]
            if isinstance(result, dict):
                return ConceptEdge(**result)
        return self
    
    async def delete(self) -> bool:
        """Delete the edge"""
        if self.id:
            return await repo.delete(self.id)
        return False


class KnowledgeGraphMeta(BaseModel):
    """Metadata about a notebook's knowledge graph"""
    id: Optional[str] = None
    notebook_id: str
    node_count: int = 0
    edge_count: int = 0
    last_built: Optional[datetime] = None
    build_status: Literal["pending", "building", "completed", "error"] = "pending"
    error_message: Optional[str] = None
    created: Optional[datetime] = None
    updated: Optional[datetime] = None
    
    class Config:
        table_name = "knowledge_graph_meta"
    
    @classmethod
    async def get_for_notebook(cls, notebook_id: str) -> Optional["KnowledgeGraphMeta"]:
        """Get metadata for a notebook's knowledge graph"""
        query = "SELECT * FROM knowledge_graph_meta WHERE notebook_id = $notebook_id LIMIT 1"
        results = await repo.query(query, {"notebook_id": notebook_id})
        if results:
            return cls(**results[0])
        return None
    
    async def save(self) -> "KnowledgeGraphMeta":
        """Save the metadata"""
        self.updated = datetime.now()
        if not self.created:
            self.created = datetime.now()
        
        data = self.model_dump(exclude={"id"}, exclude_none=True)
        
        if self.id:
            result = await repo.update(self.id, data)
        else:
            result = await repo.create("knowledge_graph_meta", data)
        
        if result:
            # repo.create returns a list, extract first element
            if isinstance(result, list) and len(result) > 0:
                result = result[0]
            if isinstance(result, dict):
                return KnowledgeGraphMeta(**result)
        return self


class KnowledgeGraph(BaseModel):
    """A complete knowledge graph with nodes and edges"""
    notebook_id: str
    nodes: List[ConceptNode] = Field(default_factory=list)
    edges: List[ConceptEdge] = Field(default_factory=list)
    meta: Optional[KnowledgeGraphMeta] = None
    
    @classmethod
    async def load(cls, notebook_id: str) -> "KnowledgeGraph":
        """Load the complete knowledge graph for a notebook"""
        nodes = await ConceptNode.find_by_notebook(notebook_id)
        edges = await ConceptEdge.find_by_notebook(notebook_id)
        meta = await KnowledgeGraphMeta.get_for_notebook(notebook_id)
        
        return cls(
            notebook_id=notebook_id,
            nodes=nodes,
            edges=edges,
            meta=meta
        )
    
    def to_graph_data(self) -> dict:
        """Convert to format suitable for visualization libraries"""
        return {
            "nodes": [
                {
                    "id": node.id,
                    "label": node.label,
                    "type": node.type,
                    "description": node.description,
                    "importance": node.importance,
                    "mentions": node.mentions,
                    "val": node.importance * 10 + node.mentions,  # Size for force graph
                    "color": self._get_node_color(node.type),
                }
                for node in self.nodes
            ],
            "links": [
                {
                    "source": edge.source_node,
                    "target": edge.target_node,
                    "relationship": edge.relationship,
                    "weight": edge.weight,
                }
                for edge in self.edges
            ],
        }
    
    @staticmethod
    def _get_node_color(node_type: str) -> str:
        """Get color for node type"""
        colors = {
            "concept": "#60a5fa",    # blue-400
            "person": "#a78bfa",     # violet-400
            "event": "#fbbf24",      # amber-400
            "place": "#34d399",      # emerald-400
            "organization": "#f87171",  # red-400
        }
        return colors.get(node_type, "#94a3b8")  # slate-400 default
