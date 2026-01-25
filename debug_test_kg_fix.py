"""
Test the fixed knowledge graph query and then build the graph
"""
import asyncio
import sys
from dotenv import load_dotenv
load_dotenv()

from loguru import logger
logger.remove()
logger.add(sys.stderr, level="INFO")

from open_notebook.database.repository import repo
from open_notebook.services.knowledge_graph_service import knowledge_graph_service
from open_notebook.domain.knowledge_graph import KnowledgeGraphMeta


async def test_and_build():
    """Test fixed query and build knowledge graph"""
    
    # Get the notebook
    notebooks = await repo.query("SELECT id, name FROM notebook LIMIT 1")
    if not notebooks:
        print("No notebooks found!")
        return
    
    notebook = notebooks[0]
    notebook_id = notebook.get('id')
    print(f"Notebook: {notebook_id} ({notebook.get('name')})")
    
    # Test the FIXED query (using edge relationships)
    print("\n=== Testing FIXED query ===")
    query = """
        SELECT in.id as id, in.title as title, in.full_text as full_text 
        FROM reference 
        WHERE out = $notebook_id AND in.full_text IS NOT NULL
    """
    sources = await repo.query(query, {"notebook_id": notebook_id})
    
    print(f"Found {len(sources) if sources else 0} sources!")
    
    if sources:
        for s in sources:
            text_len = len(s.get('full_text', '')) if s.get('full_text') else 0
            print(f"  ✅ {s.get('id')}: {s.get('title')} ({text_len} chars)")
        
        # Now build the knowledge graph!
        print("\n=== BUILDING KNOWLEDGE GRAPH ===")
        
        # Reset meta first
        meta = await KnowledgeGraphMeta.get_for_notebook(notebook_id)
        if meta:
            meta.build_status = "building"
            await meta.save()
        
        try:
            kg = await knowledge_graph_service.build_knowledge_graph(
                notebook_id,
                sources,
                model_id=None
            )
            print(f"\n✅ SUCCESS!")
            print(f"   Nodes: {len(kg.nodes) if kg else 0}")
            print(f"   Edges: {len(kg.edges) if kg else 0}")
            
            if kg and kg.nodes:
                print("\n   Sample nodes:")
                for node in kg.nodes[:5]:
                    print(f"     - {node.label} ({node.type})")
                    
        except Exception as e:
            print(f"\n❌ FAILED: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("❌ Query returned no sources - there may be an issue with the edge relationship")


if __name__ == "__main__":
    asyncio.run(test_and_build())
