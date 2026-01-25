"""
Fix source-to-notebook linkage and test knowledge graph
"""
import asyncio
import sys
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo


async def fix_source_notebook_link():
    """Link orphan sources to their notebooks"""
    
    # Get all sources with no notebook
    sources = await repo.query("SELECT id, title, notebook FROM source")
    notebooks = await repo.query("SELECT id, name FROM notebook")
    
    print("=== SOURCES ===")
    orphan_sources = []
    for s in sources:
        s_id = s.get('id')
        title = s.get('title', 'Untitled')
        notebook = s.get('notebook')
        
        print(f"Source: {s_id} | Title: {title} | Notebook: {notebook}")
        if not notebook:
            orphan_sources.append(s)
    
    print(f"\n=== NOTEBOOKS ===")
    for nb in notebooks:
        print(f"Notebook: {nb.get('id')} | Name: {nb.get('name')}")
    
    # If there are orphan sources and notebooks, link them
    if orphan_sources and notebooks:
        target_notebook = notebooks[0].get('id')
        print(f"\n=== FIXING ORPHAN SOURCES ===")
        print(f"Will link {len(orphan_sources)} orphan sources to notebook: {target_notebook}")
        
        for s in orphan_sources:
            s_id = s.get('id')
            print(f"Linking source {s_id} to notebook {target_notebook}...")
            await repo.update(s_id, {"notebook": target_notebook})
            print(f"  ✅ Done")
        
        # Verify the fix
        print(f"\n=== VERIFICATION ===")
        result = await repo.query(
            """
            SELECT id, title, full_text FROM source 
            WHERE notebook = $notebook_id AND full_text IS NOT NULL
            """,
            {"notebook_id": target_notebook}
        )
        print(f"Knowledge graph query now returns: {len(result) if result else 0} sources")


if __name__ == "__main__":
    asyncio.run(fix_source_notebook_link())
