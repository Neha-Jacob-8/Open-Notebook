"""
Test the query with proper RecordID conversion
"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo, ensure_record_id
from open_notebook.services.knowledge_graph_service import knowledge_graph_service
from open_notebook.domain.knowledge_graph import KnowledgeGraphMeta


async def test_query():
    """Test the fixed query"""
    
    notebooks = await repo.query("SELECT id, name FROM notebook LIMIT 1")
    if not notebooks:
        print("No notebooks!")
        return
    
    notebook_id = notebooks[0].get('id')
    print(f"Notebook: {notebook_id}")
    
    # Test with ensure_record_id
    query = """
        SELECT in.id as id, in.title as title, in.full_text as full_text 
        FROM reference 
        WHERE out = $id AND in.full_text IS NOT NULL
    """
    sources = await repo.query(query, {"id": ensure_record_id(notebook_id)})
    
    print(f"\nQuery returned: {len(sources) if sources else 0} sources")
    
    if sources:
        for s in sources:
            title = s.get('title', 'Untitled')
            text_len = len(s.get('full_text', '')) if s.get('full_text') else 0
            print(f"  ✅ {s.get('id')}: {title[:40]} ({text_len} chars)")
        
        print("\n=== BUILDING KNOWLEDGE GRAPH ===")
        try:
            kg = await knowledge_graph_service.build_knowledge_graph(
                notebook_id, sources, model_id=None
            )
            print(f"\n✅ SUCCESS! Nodes: {len(kg.nodes)}, Edges: {len(kg.edges)}")
            for node in (kg.nodes or [])[:5]:
                print(f"   - {node.label} ({node.type})")
        except Exception as e:
            print(f"\n❌ Failed: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("❌ No sources found")


if __name__ == "__main__":
    asyncio.run(test_query())
