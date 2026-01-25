"""
Debug edge relationships in SurrealDB
"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo


async def debug_edges():
    """Debug edge relationships"""
    
    # Get all edges
    print("=== ALL REFERENCE EDGES ===")
    edges = await repo.query("SELECT * FROM reference LIMIT 10")
    if edges:
        for e in edges:
            print(f"Edge: {e}")
    else:
        print("No reference edges found!")
    
    # Get notebooks
    print("\n=== NOTEBOOKS ===")
    notebooks = await repo.query("SELECT id, name FROM notebook")
    for nb in notebooks:
        print(f"  {nb}")
    
    # Get sources
    print("\n=== SOURCES ===")
    sources = await repo.query("SELECT id, title FROM source")
    for s in sources:
        print(f"  {s}")
    
    # Now try different query approaches
    if notebooks and edges:
        notebook_id = notebooks[0].get('id')
        print(f"\n=== Testing queries for notebook: {notebook_id} ===")
        
        # Approach 1: Direct edge query with type conversion
        print("\nApproach 1: Using type::thing()")
        q1 = await repo.query(f"SELECT * FROM reference WHERE out = type::thing('{notebook_id}')")
        print(f"Result: {len(q1) if q1 else 0} edges")
        if q1:
            print(f"First edge: {q1[0]}")
        
        # Approach 2: Using ->reference<-
        print("\nApproach 2: Using graph traversal")
        q2 = await repo.query(f"SELECT <-reference<-source FROM {notebook_id}")
        print(f"Result: {q2}")
        
        # Approach 3: Just directly select from reference
        print("\nApproach 3: Direct reference query")
        q3 = await repo.query("SELECT in, out FROM reference")
        print(f"All references: {q3}")


if __name__ == "__main__":
    asyncio.run(debug_edges())
