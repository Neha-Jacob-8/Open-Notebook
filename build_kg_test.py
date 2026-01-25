"""Complete knowledge graph test with full error handling"""
import asyncio
import sys
import os

# Set UTF-8 encoding for console output
os.environ['PYTHONIOENCODING'] = 'utf-8'

from dotenv import load_dotenv
load_dotenv()

from loguru import logger
logger.remove()
logger.add(sys.stderr, level="DEBUG", format="{time} | {level} | {message}")

from open_notebook.database.repository import repo, ensure_record_id
from open_notebook.services.knowledge_graph_service import knowledge_graph_service
from open_notebook.domain.knowledge_graph import KnowledgeGraphMeta


async def build_kg():
    """Build knowledge graph with full debugging"""
    
    # Get notebook
    print("=" * 60)
    print("KNOWLEDGE GRAPH BUILD TEST")
    print("=" * 60)
    
    notebooks = await repo.query("SELECT id, name FROM notebook LIMIT 1")
    if not notebooks:
        print("ERROR: No notebooks found!")
        return
    
    notebook_id = notebooks[0].get('id')
    print(f"\n1. Notebook: {notebook_id} ({notebooks[0].get('name')})")
    
    # Get sources
    query = """
        SELECT in.id as id, in.title as title, in.full_text as full_text 
        FROM reference 
        WHERE out = $id AND in.full_text IS NOT NULL
    """
    sources = await repo.query(query, {"id": ensure_record_id(notebook_id)})
    
    print(f"\n2. Sources found: {len(sources) if sources else 0}")
    if sources:
        for s in sources:
            text_len = len(s.get('full_text', '')) if s.get('full_text') else 0
            print(f"   - {s.get('title')}: {text_len} chars")
    else:
        print("ERROR: No sources with text!")
        return
    
    # Build knowledge graph
    print(f"\n3. Building knowledge graph...")
    print("   (This may take 30-60 seconds as it calls the AI model)")
    
    try:
        kg = await knowledge_graph_service.build_knowledge_graph(
            notebook_id,
            sources,
            model_id=None
        )
        
        print(f"\n4. BUILD RESULT:")
        print(f"   Nodes: {len(kg.nodes) if kg else 0}")
        print(f"   Edges: {len(kg.edges) if kg else 0}")
        
        if kg and kg.nodes:
            print(f"\n   Sample nodes:")
            for node in kg.nodes[:10]:
                print(f"      - {node.label} ({node.type}): {node.description[:50] if node.description else 'No description'}...")
        
        # Check meta
        meta = await KnowledgeGraphMeta.get_for_notebook(notebook_id)
        if meta:
            print(f"\n5. Meta status: {meta.build_status}")
            print(f"   Node count: {meta.node_count}")
            print(f"   Edge count: {meta.edge_count}")
            if meta.error_message:
                print(f"   Error: {meta.error_message}")
        
        print("\n" + "=" * 60)
        print("SUCCESS! Knowledge graph built.")
        print("=" * 60)
        
    except Exception as e:
        print(f"\nERROR during build: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(build_kg())
