"""Check and fix nodes manually"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from open_notebook.database.repository import repo


async def check_and_fix():
    # Check current state
    print("=== Current node state ===")
    nodes = await repo.query("SELECT id, label, notebook_id FROM concept_node LIMIT 3")
    for n in nodes:
        print(f"  {n}")
    
    notebook_id = "notebook:f1jodat25ruahw23qu9c"
    
    # Update directly with string value
    print(f"\nUpdating with notebook_id = '{notebook_id}'...")
    result = await repo.query(
        f"UPDATE concept_node SET notebook_id = '{notebook_id}'"
    )
    print(f"Update result (first 3): {result[:3] if result else 'None'}")
    
    # Check again
    print("\n=== After update ===")
    nodes = await repo.query("SELECT id, label, notebook_id FROM concept_node LIMIT 3")
    for n in nodes:
        print(f"  {n}")
    
    # Try the query that KnowledgeGraph uses
    print(f"\n=== Testing find_by_notebook ===")
    found = await repo.query(f"SELECT * FROM concept_node WHERE notebook_id = '{notebook_id}' LIMIT 5")
    print(f"Found {len(found)} nodes")


if __name__ == "__main__":
    asyncio.run(check_and_fix())
