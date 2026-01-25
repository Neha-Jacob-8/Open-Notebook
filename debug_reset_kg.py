"""
Debug and reset stuck knowledge graph builds
"""
import asyncio
import sys
from dotenv import load_dotenv
load_dotenv()

from loguru import logger
logger.remove()
logger.add(sys.stderr, level="INFO")

from open_notebook.database.repository import repo


async def reset_knowledge_graph_status():
    """Reset all stuck knowledge graphs to 'not_built' status"""
    
    # Get all knowledge graph metadata
    logger.info("=== KNOWLEDGE GRAPH STATUS ===")
    metas = await repo.query("SELECT * FROM knowledge_graph_meta")
    
    if not metas:
        logger.info("No knowledge graph metadata found")
        return
    
    for meta in metas:
        meta_id = meta.get('id')
        nb_id = meta.get('notebook_id')
        status = meta.get('build_status', 'unknown')
        error = meta.get('error_message')
        nodes = meta.get('node_count', 0)
        edges = meta.get('edge_count', 0)
        
        print(f"\n📊 Meta ID: {meta_id}")
        print(f"   Notebook: {nb_id}")
        print(f"   Status: {status}")
        print(f"   Nodes: {nodes}, Edges: {edges}")
        if error:
            print(f"   Error: {error}")
        
        # If stuck in "building" status, reset it
        if status == "building":
            logger.warning(f"Resetting stuck build for {nb_id}")
            # Use proper SurrealDB update syntax
            await repo.update(
                meta_id,
                {
                    "build_status": "not_built",
                    "error_message": "Reset - add sources with text content to your notebook first"
                }
            )
            print(f"   ✅ Reset to 'not_built'")


if __name__ == "__main__":
    asyncio.run(reset_knowledge_graph_status())
