"""
Build knowledge graph directly (bypassing API background task)
Uses same approach as the updated API code
"""
import asyncio
import sys
from dotenv import load_dotenv
load_dotenv()

# Force UTF-8
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from open_notebook.domain.notebook import Notebook, Source
from open_notebook.domain.knowledge_graph import KnowledgeGraphMeta
from open_notebook.services.knowledge_graph_service import knowledge_graph_service
from open_notebook.database.repository import repo


async def build_directly():
    print("=" * 60)
    print("BUILDING KNOWLEDGE GRAPH DIRECTLY")
    print("=" * 60)
    
    # Get notebook
    notebooks = await repo.query("SELECT id, name FROM notebook LIMIT 1")
    if not notebooks:
        print("No notebooks found!")
        return
    
    notebook_id = notebooks[0].get('id')
    print(f"\n1. Notebook: {notebook_id} ({notebooks[0].get('name')})")
    
    # Get notebook object
    notebook = await Notebook.get(notebook_id)
    if not notebook:
        print("Failed to get notebook object!")
        return
    
    print(f"   Notebook object: {notebook}")
    
    # Get sources via working method
    print("\n2. Fetching sources via get_sources()...")
    source_refs = await notebook.get_sources()
    print(f"   Found {len(source_refs)} source references")
    
    if not source_refs:
        print("   No sources found!")
        return
    
    # Get full source content
    print("\n3. Fetching full source content...")
    sources_with_text = []
    for source_ref in source_refs:
        print(f"   Fetching {source_ref.id}...")
        try:
            full_source = await Source.get(source_ref.id)
            if full_source:
                print(f"     Title: {full_source.title}")
                print(f"     Has full_text: {full_source.full_text is not None}")
                if full_source.full_text:
                    print(f"     Text length: {len(full_source.full_text)}")
                    sources_with_text.append({
                        "id": full_source.id,
                        "title": full_source.title or "Untitled",
                        "full_text": full_source.full_text
                    })
        except Exception as e:
            print(f"     ERROR: {e}")
    
    if not sources_with_text:
        print("\nNo sources with text content!")
        return
    
    print(f"\n4. Building knowledge graph from {len(sources_with_text)} sources...")
    print("   (This may take 30-60 seconds)")
    
    try:
        result = await knowledge_graph_service.build_knowledge_graph(
            notebook_id,
            sources_with_text,
            model_id=None
        )
        
        print(f"\n5. BUILD COMPLETE!")
        print(f"   Nodes: {len(result.nodes) if result else 0}")
        print(f"   Edges: {len(result.edges) if result else 0}")
        
        if result and result.nodes:
            print("\n   Sample nodes:")
            for node in result.nodes[:10]:
                desc = (node.description[:40] + "...") if node.description else "No desc"
                print(f"     - {node.label} ({node.type}): {desc}")
        
    except Exception as e:
        print(f"\n   BUILD FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(build_directly())
