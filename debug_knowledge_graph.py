"""
Debug script for knowledge graph building
"""
import asyncio
import sys
from dotenv import load_dotenv
load_dotenv()

from loguru import logger
logger.remove()
logger.add(sys.stderr, level="DEBUG")

from open_notebook.database.repository import repo
from open_notebook.services.knowledge_graph_service import knowledge_graph_service
from open_notebook.domain.knowledge_graph import KnowledgeGraphMeta


async def debug_knowledge_graph():
    """Debug the knowledge graph build process"""
    
    # First, let's see what notebooks exist
    logger.info("Fetching all notebooks...")
    notebooks = await repo.query("SELECT * FROM notebook LIMIT 10")
    
    if not notebooks:
        logger.error("No notebooks found in the database!")
        return
    
    logger.info(f"Found {len(notebooks)} notebooks:")
    for nb in notebooks:
        print(f"  - {nb.get('id')}: {nb.get('name', 'Unnamed')}")
    
    # Pick the first notebook
    notebook = notebooks[0]
    notebook_id = notebook.get('id')
    logger.info(f"\nUsing notebook: {notebook_id}")
    
    # Check knowledge graph meta status
    meta = await KnowledgeGraphMeta.get_for_notebook(notebook_id)
    if meta:
        logger.info(f"Current knowledge graph status: {meta.build_status}")
        logger.info(f"Error message: {meta.error_message}")
        logger.info(f"Node count: {meta.node_count}, Edge count: {meta.edge_count}")
    else:
        logger.info("No knowledge graph meta found for this notebook")
    
    # Get sources for this notebook
    logger.info("\nFetching sources for notebook...")
    sources = await repo.query(
        """
        SELECT id, title, full_text FROM source 
        WHERE notebook = $notebook_id AND full_text IS NOT NULL
        """,
        {"notebook_id": notebook_id}
    )
    
    if not sources:
        logger.error("No sources with text content found for this notebook!")
        return
    
    logger.info(f"Found {len(sources)} sources with text content")
    for s in sources:
        text_len = len(s.get('full_text', '')) if s.get('full_text') else 0
        logger.info(f"  - {s.get('id')}: {s.get('title', 'Untitled')} ({text_len} chars)")
    
    # Try to extract concepts from first source
    first_source = sources[0]
    text = first_source.get('full_text', '')
    if len(text) > 500:
        text_preview = text[:500] + "..."
    else:
        text_preview = text
    
    logger.info(f"\nText preview from first source:\n{text_preview}")
    
    # Now try to build the knowledge graph
    logger.info("\n\n=== Attempting to build knowledge graph ===")
    try:
        result = await knowledge_graph_service.build_knowledge_graph(
            notebook_id,
            sources,
            model_id=None  # Will use default model
        )
        logger.success(f"Knowledge graph built successfully!")
        logger.info(f"Nodes: {len(result.nodes) if result else 0}")
        logger.info(f"Edges: {len(result.edges) if result else 0}")
    except Exception as e:
        logger.error(f"Failed to build knowledge graph: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(debug_knowledge_graph())
