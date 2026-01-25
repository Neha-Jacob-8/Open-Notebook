"""
Check specific source details and test knowledge graph query
"""
import asyncio
import sys
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo


async def check_source_details():
    """Check source details and knowledge graph query"""
    
    # Get the source
    sources = await repo.query("SELECT id, title, notebook, full_text FROM source LIMIT 5")
    
    print("=== SOURCES ===")
    for s in sources:
        s_id = s.get('id')
        title = s.get('title', 'Untitled')
        notebook = s.get('notebook')
        full_text = s.get('full_text')
        
        print(f"\nSource ID: {s_id}")
        print(f"Title: {title}")
        print(f"Notebook: {notebook}")
        print(f"Notebook type: {type(notebook)}")
        print(f"full_text exists: {full_text is not None}")
        print(f"full_text length: {len(full_text) if full_text else 0}")
        
        if notebook:
            # Try the exact query used by knowledge graph
            # The issue might be how notebook is stored/compared
            print(f"\nTesting knowledge graph query with notebook_id = '{notebook}'")
            result = await repo.query(
                """
                SELECT id, title, full_text FROM source 
                WHERE notebook = $notebook_id AND full_text IS NOT NULL
                """,
                {"notebook_id": notebook}
            )
            print(f"Query result: {len(result) if result else 0} sources found")
            
            # Also try direct comparison
            print(f"\nTrying with string comparison...")
            result2 = await repo.query(
                f"SELECT id, title FROM source WHERE notebook = '{notebook}'"
            )
            print(f"Direct query result: {len(result2) if result2 else 0} sources found")


if __name__ == "__main__":
    asyncio.run(check_source_details())
