"""
Debug script to check sources in the database
"""
import asyncio
import sys
from dotenv import load_dotenv
load_dotenv()

from loguru import logger
logger.remove()
logger.add(sys.stderr, level="INFO")

from open_notebook.database.repository import repo
from open_notebook.domain.knowledge_graph import KnowledgeGraphMeta


async def check_sources():
    """Check what sources exist and their text content status"""
    
    # Get all notebooks
    logger.info("=== NOTEBOOKS ===")
    notebooks = await repo.query("SELECT * FROM notebook")
    if not notebooks:
        logger.error("No notebooks found!")
        return
    
    for nb in notebooks:
        nb_id = nb.get('id')
        nb_name = nb.get('name', 'Unnamed')
        print(f"\n📓 Notebook: {nb_name} ({nb_id})")
        
        # Get all sources for this notebook
        sources = await repo.query(
            "SELECT id, title, full_text, content, type, processing_status FROM source WHERE notebook = $nb_id",
            {"nb_id": nb_id}
        )
        
        if not sources:
            print("   No sources in this notebook")
            continue
        
        print(f"   Sources: {len(sources)}")
        for s in sources:
            s_id = s.get('id', 'unknown')
            title = s.get('title', 'Untitled')[:40]
            s_type = s.get('type', 'unknown')
            status = s.get('processing_status', 'unknown')
            
            full_text = s.get('full_text')
            content = s.get('content')
            
            text_len = len(full_text) if full_text else 0
            content_len = len(content) if content else 0
            
            has_text = "✅" if text_len > 0 else "❌"
            print(f"   {has_text} {title} | type: {s_type} | status: {status} | full_text: {text_len} chars | content: {content_len} chars")
        
        # Check knowledge graph status
        meta = await KnowledgeGraphMeta.get_for_notebook(nb_id)
        if meta:
            print(f"\n   📊 Knowledge Graph Status: {meta.build_status}")
            if meta.error_message:
                print(f"   ⚠️ Error: {meta.error_message}")
        else:
            print(f"\n   📊 Knowledge Graph: Not built yet")


if __name__ == "__main__":
    asyncio.run(check_sources())
