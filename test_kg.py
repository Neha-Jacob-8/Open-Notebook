"""Simple test for knowledge graph fix"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo, ensure_record_id


async def test():
    # Get notebook
    notebooks = await repo.query("SELECT id FROM notebook LIMIT 1")
    if not notebooks:
        print("No notebooks!")
        return
    
    notebook_id = notebooks[0].get('id')
    print(f"Notebook: {notebook_id}")
    
    # Test fixed query
    query = """
        SELECT in.id as id, in.title as title, in.full_text as full_text 
        FROM reference 
        WHERE out = $id AND in.full_text IS NOT NULL
    """
    sources = await repo.query(query, {"id": ensure_record_id(notebook_id)})
    
    print(f"Found {len(sources) if sources else 0} sources")
    if sources:
        for s in sources:
            print(f"  Source: {s.get('id')}, Title: {s.get('title')}, Text length: {len(s.get('full_text', ''))}")
        print("\nQuery WORKS! Knowledge graph should build now.")
    else:
        print("Query returned no sources - checking raw edges...")
        edges = await repo.query("SELECT * FROM reference")
        print(f"Total reference edges: {len(edges) if edges else 0}")


if __name__ == "__main__":
    asyncio.run(test())
