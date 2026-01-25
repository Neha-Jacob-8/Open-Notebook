"""
Knowledge Graph Service

Service for building knowledge graphs from notebook sources.
Uses LLM to extract concepts and relationships.
"""

import json
from typing import List, Dict, Optional
from datetime import datetime
from loguru import logger

from open_notebook.domain.knowledge_graph import (
    ConceptNode, 
    ConceptEdge, 
    KnowledgeGraph, 
    KnowledgeGraphMeta
)
from open_notebook.graphs.utils import provision_langchain_model
from open_notebook.utils import clean_thinking_content


CONCEPT_EXTRACTION_PROMPT = """You are an expert knowledge extraction AI specializing in scientific and technical content. Analyze the following text and extract key concepts, entities, and their relationships with high precision and accuracy.

Text:
{text}

EXTRACTION GUIDELINES:
1. **Concepts**: Scientific principles, theories, laws, equations, formulas, processes, phenomena, properties, materials, techniques
   - Focus on core scientific concepts (e.g., "Electrochemical Cell", "Nernst Equation", "Standard Electrode Potential")
   - Include mathematical relationships and key equations
   - Capture technical processes and methods

2. **People**: Named scientists, researchers, inventors (only if explicitly mentioned)
   - Include scientists who contributed to theories/laws (e.g., "Nernst", "Faraday")

3. **Events**: Historical discoveries, experiments, key developments (only if explicitly mentioned)

4. **Places**: Research institutions, locations (only if relevant to the content)

5. **Organizations**: Institutions, research groups (only if explicitly mentioned)

QUALITY STANDARDS:
- Be precise with technical terminology
- Assign higher importance (0.7-1.0) to fundamental concepts and core principles
- Assign medium importance (0.4-0.6) to supporting concepts and definitions
- Assign lower importance (0.1-0.3) to peripheral or example concepts
- Descriptions should be scientifically accurate and concise (10-30 words)

RELATIONSHIP TYPES (choose the most specific):
- is_a: X is a type of Y (taxonomy/classification)
- part_of: X is a component of Y (composition)
- causes: X causes/produces/leads to Y (causation)
- depends_on: X depends on/requires Y (dependency)
- measures: X measures/quantifies Y (measurement)
- related_to: X is related to Y (general relationship)
- defines: X defines/characterizes Y (definition)
- applies_to: X applies to/used in Y (application)
- derived_from: X is derived from Y (mathematical/logical derivation)
- governed_by: X is governed by Y (law/principle)

IMPORTANT:
- Extract 5-15 key entities per text chunk (focus on quality, not quantity)
- Create meaningful relationships that show conceptual connections
- Avoid redundant or trivial entities
- Use consistent naming (e.g., "Standard Electrode Potential" not "standard potential" or "electrode potential")

Respond with a JSON object in this exact format:
{{
  "entities": [
    {{"name": "Concept Name", "type": "concept|person|event|place|organization", "description": "Precise scientific description", "importance": 0.8}}
  ],
  "relationships": [
    {{"source": "Source Concept", "target": "Target Concept", "relationship": "relationship_type", "description": "How they relate"}}
  ]
}}

Respond ONLY with valid JSON, no additional text."""


class KnowledgeGraphService:
    """Service for building and managing knowledge graphs"""
    
    def __init__(self):
        pass
    
    def _chunk_text(self, text: str, max_chars: int = 6000) -> List[str]:
        """Split text into chunks for better processing"""
        if len(text) <= max_chars:
            return [text]
        
        chunks = []
        # Split by paragraphs first
        paragraphs = text.split('\n\n')
        current_chunk = ""
        
        for para in paragraphs:
            if len(current_chunk) + len(para) <= max_chars:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para + "\n\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks

    async def extract_concepts_from_text(
        self, 
        text: str, 
        source_id: str,
        model_id: Optional[str] = None
    ) -> Dict:
        """Extract concepts and relationships from text using LLM"""
        
        # Split text into chunks
        chunks = self._chunk_text(text, max_chars=6000)
        all_entities = []
        all_relationships = []
        
        for i, chunk in enumerate(chunks):
            logger.debug(f"Processing chunk {i+1}/{len(chunks)} for source {source_id}")
            
            prompt = CONCEPT_EXTRACTION_PROMPT.format(text=chunk)
            
            try:
                model = await provision_langchain_model(
                    prompt,
                    model_id,
                    "transformation",
                    max_tokens=4000
                )
                
                response = await model.ainvoke(prompt)
                content = response.content if isinstance(response.content, str) else str(response.content)
                content = clean_thinking_content(content)
                
                # Extract JSON from markdown code blocks if present
                import re
                json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
                if json_match:
                    content = json_match.group(1)
                
                # Also try to find raw JSON object/array
                if not content.strip().startswith('{'):
                    json_obj_match = re.search(r'\{[\s\S]*\}', content)
                    if json_obj_match:
                        content = json_obj_match.group(0)
                
                # Parse JSON response
                result = json.loads(content)
                all_entities.extend(result.get('entities', []))
                all_relationships.extend(result.get('relationships', []))
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse concept extraction response for chunk {i+1}: {e}")
                continue
            except Exception as e:
                logger.error(f"Concept extraction failed for chunk {i+1}: {e}")
                continue
        
        logger.info(f"Extracted {len(all_entities)} entities and {len(all_relationships)} relationships from {len(chunks)} chunks")
        return {"entities": all_entities, "relationships": all_relationships}
    
    async def build_knowledge_graph(
        self,
        notebook_id: str,
        sources: List[Dict],
        model_id: Optional[str] = None
    ) -> KnowledgeGraph:
        """Build a knowledge graph from notebook sources"""
        
        logger.info(f"Building knowledge graph for notebook {notebook_id} with {len(sources)} sources")
        
        # Update or create metadata
        meta = await KnowledgeGraphMeta.get_for_notebook(notebook_id)
        if not meta:
            meta = KnowledgeGraphMeta(notebook_id=notebook_id)
        
        meta.build_status = "building"
        await meta.save()
        
        try:
            # Clear existing nodes and edges for this notebook
            existing_nodes = await ConceptNode.find_by_notebook(notebook_id)
            for node in existing_nodes:
                await node.delete()
            
            existing_edges = await ConceptEdge.find_by_notebook(notebook_id)
            for edge in existing_edges:
                await edge.delete()
            
            # Track all nodes by label for deduplication
            nodes_by_label: Dict[str, ConceptNode] = {}
            all_edges: List[ConceptEdge] = []
            
            # Process each source
            for source in sources:
                source_id = source.get("id", "")
                
                # Combine full_text and insights for comprehensive content
                text_parts = []
                
                # Add full_text if available
                full_text = source.get("full_text", source.get("content", ""))
                if full_text:
                    text_parts.append(full_text)
                
                # Add insights if available (from transformations)
                insights = source.get("insights", [])
                if insights and isinstance(insights, list):
                    for insight in insights:
                        if insight:  # Skip None/empty insights
                            text_parts.append(insight)
                
                # Combine all text with separators for context
                text = "\n\n--- \n\n".join(text_parts)
                
                if not text:
                    logger.warning(f"Source {source_id} has no content or insights, skipping")
                    continue
                
                logger.debug(f"Extracting concepts from source {source_id} ({len(text)} chars)")
                
                # Extract concepts
                extraction = await self.extract_concepts_from_text(text, source_id, model_id)
                
                # Process entities
                for entity in extraction.get("entities", []):
                    label = entity.get("name", "").strip()
                    if not label:
                        continue
                    
                    # Deduplicate by label (case-insensitive)
                    label_key = label.lower()
                    
                    if label_key in nodes_by_label:
                        # Update existing node
                        node = nodes_by_label[label_key]
                        if source_id not in node.source_ids:
                            node.source_ids.append(source_id)
                        node.mentions += 1
                        # Average importance
                        node.importance = (node.importance + entity.get("importance", 0.5)) / 2
                    else:
                        # Create new node
                        node = ConceptNode(
                            label=label,
                            type=entity.get("type", "concept"),
                            description=entity.get("description"),
                            source_ids=[source_id],
                            notebook_id=notebook_id,
                            importance=entity.get("importance", 0.5),
                            mentions=1
                        )
                        nodes_by_label[label_key] = node
                
                # Process relationships
                for rel in extraction.get("relationships", []):
                    source_label = rel.get("source", "").strip().lower()
                    target_label = rel.get("target", "").strip().lower()
                    relationship = rel.get("relationship", "related_to")
                    
                    # Only create edge if both nodes exist
                    if source_label in nodes_by_label and target_label in nodes_by_label:
                        all_edges.append({
                            "source_label": source_label,
                            "target_label": target_label,
                            "relationship": relationship,
                            "description": rel.get("description"),
                            "source_id": source_id
                        })
            
            # Save all nodes
            saved_nodes: Dict[str, ConceptNode] = {}
            for label_key, node in nodes_by_label.items():
                saved_node = await node.save()
                saved_nodes[label_key] = saved_node
            
            # Create and save edges
            for edge_data in all_edges:
                source_node = saved_nodes.get(edge_data["source_label"])
                target_node = saved_nodes.get(edge_data["target_label"])
                
                if source_node and target_node and source_node.id and target_node.id:
                    edge = ConceptEdge(
                        source_node=source_node.id,
                        target_node=target_node.id,
                        relationship=edge_data["relationship"],
                        description=edge_data.get("description"),
                        source_ids=[edge_data["source_id"]],
                        notebook_id=notebook_id
                    )
                    await edge.save()
            
            # Update metadata
            meta.node_count = len(saved_nodes)
            meta.edge_count = len(all_edges)
            meta.last_built = datetime.now()
            meta.build_status = "completed"
            meta.error_message = None
            await meta.save()
            
            logger.info(f"Knowledge graph built: {len(saved_nodes)} nodes, {len(all_edges)} edges")
            
            # Return the complete graph
            return await KnowledgeGraph.load(notebook_id)
            
        except Exception as e:
            logger.error(f"Failed to build knowledge graph: {e}")
            meta.build_status = "error"
            meta.error_message = str(e)
            await meta.save()
            raise
    
    async def get_node_details(self, node_id: str) -> Optional[Dict]:
        """Get detailed information about a node including its connections"""
        node = await ConceptNode.get(node_id)
        if not node:
            return None
        
        edges = await ConceptEdge.find_by_node(node_id)
        
        # Get connected nodes
        connected_ids = set()
        for edge in edges:
            connected_ids.add(edge.source_node)
            connected_ids.add(edge.target_node)
        connected_ids.discard(node_id)
        
        connected_nodes = []
        for cid in connected_ids:
            cn = await ConceptNode.get(cid)
            if cn:
                connected_nodes.append(cn)
        
        return {
            "node": node.model_dump(),
            "connections": [cn.model_dump() for cn in connected_nodes],
            "edges": [e.model_dump() for e in edges]
        }


# Singleton instance
knowledge_graph_service = KnowledgeGraphService()
