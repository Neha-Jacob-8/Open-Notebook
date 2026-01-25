"""
Verify fix and build knowledge graph
"""
import asyncio
import sys
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo
from open_notebook.services.knowledge_graph_service import knowledge_graph_service


async def verify_and_build():
    """Verify fix and attempt knowledge graph build"""
    
    # Get the source and notebook
    sources = await repo.query("SELECT id, title, notebook, full_text FROM source LIMIT 1")
    notebooks = await repo.query("SELECT id, name FROM notebook LIMIT 1")
    
    if not sources:
        print("No sources found!")
        return
    
    if not notebooks:
        print("No notebooks found!")
        return
    
    source = sources[0]
    notebook = notebooks[0]
    
    print(f"Source: {source.get('id')}")
    print(f"  Title: {source.get('title')}")
    print(f"  Notebook field: {source.get('notebook')}")
    print(f"  Has full_text: {source.get('full_text') is not None}")
    print(f"  full_text length: {len(source.get('full_text', ''))}")
    
    print(f"\nNotebook: {notebook.get('id')}")
    print(f"  Name: {notebook.get('name')}")
    
    notebook_id = notebook.get('id')
    
    # Force update the source to have the notebook
    source_id = source.get('id')
    print(f"\nForce updating source {source_id} to notebook {notebook_id}...")
    
    # Use direct query update
    update_result = await repo.query(
        f"UPDATE {source_id} SET notebook = type::string('{notebook_id}')"
    )
    print(f"Update result: {update_result}")
    
    # Verify
    print("\nVerifying...")
    check = await repo.query(f"SELECT id, notebook FROM {source_id}")
    print(f"Source now has notebook: {check}")
    
    # Now run the query used by knowledge graph
    print("\nTesting knowledge graph query...")
    result = await repo.query(
        """
        SELECT id, title, full_text FROM source 
        WHERE notebook = $notebook_id AND full_text IS NOT NULL
        """,
        {"notebook_id": notebook_id}
    )
    print(f"Query result: {len(result) if result else 0} sources found")
    
    if result:
        print("\n=== BUILDING KNOWLEDGE GRAPH ===")
        try:
            kg = await knowledge_graph_service.build_knowledge_graph(
                notebook_id,
                result,
                model_id=None
            )
            print(f"\n✅ SUCCESS! Built knowledge graph with {len(kg.nodes)} nodes and {len(kg.edges)} edges")
        except Exception as e:
            print(f"\n❌ FAILED: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(verify_and_build())
